"""
LangChain-based AI tutor service for educational conversations.
"""

import os
import json
import logging
from typing import Dict, List, Optional, AsyncGenerator, Any
from datetime import datetime

from langchain_openai import ChatOpenAI
from langchain.schema import HumanMessage, AIMessage, SystemMessage
from langchain.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate, PromptTemplate
from langchain.callbacks.base import AsyncCallbackHandler
from langchain.schema.output import LLMResult
from langchain.chains import LLMChain
from langchain.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field

from models.database_models import LearningSet, VocabularyItem, GrammarTopic, ChatMessage, SenderType
from models.pydantic_models import GrammarDifficulty

logger = logging.getLogger(__name__)

class GrammarAnalysis(BaseModel):
    """Structured output for grammar analysis."""
    corrections: List[Dict[str, str]] = Field(description="List of grammar corrections")
    vocabulary_used: List[Dict[str, Any]] = Field(description="List of vocabulary usage analysis")
    encouragement: str = Field(description="Positive feedback message")
    difficulty_assessment: str = Field(description="Assessment of message complexity")
    learning_progress: Dict[str, Any] = Field(description="Progress indicators")

class VocabularyFeedback(BaseModel):
    """Structured output for vocabulary feedback."""
    word: str = Field(description="The vocabulary word")
    used_correctly: bool = Field(description="Whether the word was used correctly")
    context: str = Field(description="How the word was used in context")
    definition_match: bool = Field(description="Whether usage matches the definition")
    improvement_suggestion: Optional[str] = Field(description="Suggestion for improvement")

class StreamingCallbackHandler(AsyncCallbackHandler):
    """Callback handler for streaming responses."""
    
    def __init__(self):
        self.tokens = []
        self.current_response = ""
    
    async def on_llm_new_token(self, token: str, **kwargs) -> None:
        """Handle new token from LLM."""
        self.tokens.append(token)
        self.current_response += token
    
    def reset(self):
        """Reset the handler for a new response."""
        self.tokens = []
        self.current_response = ""

class AITutorService:
    """Service for managing AI tutor conversations with learning content awareness."""
    
    def __init__(self):
        """Initialize the AI tutor service with LangChain."""
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        if not self.openai_api_key:
            raise ValueError("OPENAI_API_KEY environment variable is required")
        
        # Initialize ChatOpenAI with streaming support
        self.llm = ChatOpenAI(
            model="gpt-4-turbo-preview",
            temperature=0.7,
            streaming=True,
            openai_api_key=self.openai_api_key,
            max_tokens=500
        )
        
        # Initialize analysis LLM (non-streaming for structured output)
        self.analysis_llm = ChatOpenAI(
            model="gpt-4-turbo-preview",
            temperature=0.3,  # Lower temperature for more consistent analysis
            openai_api_key=self.openai_api_key,
            max_tokens=800
        )
        
        # Initialize prompt templates and chains
        self._setup_prompt_templates()
        self._setup_analysis_chains()
        
        logger.info("AI Tutor Service initialized with LangChain ChatOpenAI")
    
    def _setup_analysis_chains(self):
        """Set up specialized LangChain chains for grammar and vocabulary analysis."""
        
        # Vocabulary tracking chain
        self.vocabulary_chain_template = PromptTemplate(
            input_variables=["user_message", "target_vocabulary", "grade_level"],
            template="""
            Analyze how well this {grade_level} student used target vocabulary words:
            
            Student message: "{user_message}"
            Target vocabulary: {target_vocabulary}
            
            For each target vocabulary word found in the message, evaluate:
            1. Is it used correctly in context?
            2. Does the usage match the word's definition?
            3. Is it used at an appropriate level for {grade_level}?
            
            Provide specific feedback for vocabulary reinforcement.
            Focus on celebrating correct usage and gently guiding improvements.
            """
        )
        
        # Grammar pattern recognition chain
        self.grammar_pattern_template = PromptTemplate(
            input_variables=["user_message", "grammar_focus", "grade_level"],
            template="""
            Analyze this {grade_level} student's message for grammar patterns:
            
            Student message: "{user_message}"
            Grammar focus areas: {grammar_focus}
            
            Identify:
            1. Grammar patterns the student used correctly
            2. Common grammar errors for this grade level
            3. Opportunities to practice target grammar concepts
            4. Gentle corrections that maintain student confidence
            
            Provide feedback that encourages continued practice while addressing errors constructively.
            """
        )
        
        # Gentle correction chain for conversational feedback
        self.gentle_correction_template = PromptTemplate(
            input_variables=["original_text", "corrected_text", "explanation", "grade_level"],
            template="""
            Create a gentle, conversational correction for a {grade_level} student:
            
            Original: "{original_text}"
            Corrected: "{corrected_text}"
            Grammar explanation: {explanation}
            
            Provide a friendly, encouraging way to introduce the correction naturally in conversation.
            Make it feel like helpful guidance rather than criticism.
            Use age-appropriate language and maintain the student's confidence.
            """
        )
        
        # Create the chains
        self.vocabulary_chain = LLMChain(
            llm=self.analysis_llm,
            prompt=self.vocabulary_chain_template,
            verbose=False
        )
        
        self.grammar_pattern_chain = LLMChain(
            llm=self.analysis_llm,
            prompt=self.grammar_pattern_template,
            verbose=False
        )
        
        self.gentle_correction_chain = LLMChain(
            llm=self.analysis_llm,
            prompt=self.gentle_correction_template,
            verbose=False
        )
    
    def _setup_prompt_templates(self):
        """Set up LangChain prompt templates for educational conversations."""
        
        # System prompt for educational conversations
        self.system_template = SystemMessagePromptTemplate.from_template(
            """You are an AI language tutor helping a {grade_level} student practice {subject}. 
            Your role is to engage in natural, educational conversations that help the student practice vocabulary and grammar.

            LEARNING OBJECTIVES:
            - Vocabulary to practice: {vocabulary_words}
            - Grammar topics to focus on: {grammar_topics}
            - Student's current level: {grade_level}

            CONVERSATION GUIDELINES:
            1. Keep responses conversational and age-appropriate for {grade_level} level
            2. Naturally incorporate target vocabulary words when possible
            3. Use grammar structures that match the learning objectives
            4. Provide gentle corrections when the student makes mistakes
            5. Acknowledge and reinforce correct vocabulary usage
            6. Ask engaging questions to keep the conversation flowing
            7. Stay within educational topics appropriate for the student's level

            CORRECTION STYLE:
            - Be encouraging and positive
            - Correct mistakes gently within the conversation flow
            - Explain grammar rules simply when needed
            - Celebrate correct usage of target vocabulary

            Remember: You're having a conversation, not giving a lesson. Make learning feel natural and fun!"""
        )
        
        # Human message template
        self.human_template = HumanMessagePromptTemplate.from_template(
            "Student message: {user_message}"
        )
        
        # Create the full chat prompt template
        self.chat_prompt = ChatPromptTemplate.from_messages([
            self.system_template,
            self.human_template
        ])
        
        # Grammar correction prompt template with enhanced analysis
        self.correction_template = ChatPromptTemplate.from_template(
            """You are an expert language tutor analyzing a {grade_level} student's message. 
            Provide detailed but gentle feedback that encourages learning.

            Student message: "{user_message}"
            Target vocabulary: {vocabulary_words}
            Grammar focus: {grammar_topics}
            Student level: {grade_level}
            
            Analyze the message and provide a JSON response with:
            {{
                "corrections": [
                    {{
                        "original": "incorrect text",
                        "corrected": "correct text", 
                        "explanation": "gentle, encouraging explanation suitable for {grade_level}",
                        "grammar_rule": "relevant grammar rule explained simply",
                        "severity": "minor|moderate|major",
                        "learning_tip": "helpful tip for remembering this rule"
                    }}
                ],
                "vocabulary_used": [
                    {{
                        "word": "vocabulary word used",
                        "used_correctly": true/false,
                        "context": "how it was used in the sentence",
                        "definition_match": true/false,
                        "improvement_suggestion": "suggestion if used incorrectly"
                    }}
                ],
                "encouragement": "specific positive feedback about what they did well",
                "difficulty_assessment": "appropriate|too_easy|too_hard",
                "learning_progress": {{
                    "grammar_concepts_demonstrated": ["list of concepts shown"],
                    "vocabulary_level": "below|at|above grade level",
                    "areas_for_improvement": ["specific areas to work on"]
                }}
            }}
            
            Guidelines:
            - Be encouraging and positive in all feedback
            - Explain grammar rules in age-appropriate language
            - Celebrate correct usage before mentioning errors
            - Provide specific, actionable improvement suggestions
            - If no errors found, still provide encouragement and acknowledge good usage"""
        )
    
    def _format_learning_content(self, learning_set: LearningSet) -> Dict[str, str]:
        """Format learning set content for prompt injection."""
        vocabulary_words = []
        if learning_set.vocabulary_items:
            for item in learning_set.vocabulary_items:
                vocab_entry = f"{item.word}: {item.definition}"
                if item.example_sentence:
                    vocab_entry += f" (Example: {item.example_sentence})"
                vocabulary_words.append(vocab_entry)
        
        grammar_topics = []
        if learning_set.grammar_topics:
            for topic in learning_set.grammar_topics:
                grammar_entry = f"{topic.name}: {topic.description}"
                if topic.rule_explanation:
                    grammar_entry += f" (Rule: {topic.rule_explanation})"
                grammar_topics.append(grammar_entry)
        
        return {
            "vocabulary_words": "; ".join(vocabulary_words) if vocabulary_words else "General vocabulary practice",
            "grammar_topics": "; ".join(grammar_topics) if grammar_topics else "General grammar practice",
            "grade_level": learning_set.grade_level or "elementary",
            "subject": learning_set.subject or "language arts"
        }
    
    async def generate_response(
        self, 
        user_message: str, 
        learning_set: LearningSet,
        conversation_history: List[ChatMessage] = None
    ) -> str:
        """Generate an AI tutor response using LangChain."""
        try:
            # Format learning content for context injection
            learning_context = self._format_learning_content(learning_set)
            
            # Create the prompt with context
            formatted_prompt = self.chat_prompt.format_messages(
                user_message=user_message,
                **learning_context
            )
            
            # Add conversation history if available
            messages = []
            if conversation_history:
                # Add recent conversation history (last 10 messages)
                recent_history = conversation_history[-10:] if len(conversation_history) > 10 else conversation_history
                for msg in recent_history:
                    if msg.sender == SenderType.USER:
                        messages.append(HumanMessage(content=msg.content))
                    else:
                        messages.append(AIMessage(content=msg.content))
            
            # Add the current formatted prompt
            messages.extend(formatted_prompt)
            
            # Generate response
            response = await self.llm.ainvoke(messages)
            
            logger.info(f"Generated AI response for learning set {learning_set.id}")
            return response.content
            
        except Exception as e:
            logger.error(f"Error generating AI response: {e}")
            return "I'm having trouble responding right now. Could you try asking again?"
    
    async def stream_response(
        self, 
        user_message: str, 
        learning_set: LearningSet,
        conversation_history: List[ChatMessage] = None
    ) -> AsyncGenerator[str, None]:
        """Stream AI tutor response using LangChain streaming."""
        try:
            # Set up streaming callback
            callback_handler = StreamingCallbackHandler()
            
            # Create LLM with streaming callback
            streaming_llm = ChatOpenAI(
                model="gpt-4-turbo-preview",
                temperature=0.7,
                streaming=True,
                openai_api_key=self.openai_api_key,
                max_tokens=500,
                callbacks=[callback_handler]
            )
            
            # Format learning content for context injection
            learning_context = self._format_learning_content(learning_set)
            
            # Create the prompt with context
            formatted_prompt = self.chat_prompt.format_messages(
                user_message=user_message,
                **learning_context
            )
            
            # Add conversation history if available
            messages = []
            if conversation_history:
                recent_history = conversation_history[-10:] if len(conversation_history) > 10 else conversation_history
                for msg in recent_history:
                    if msg.sender == SenderType.USER:
                        messages.append(HumanMessage(content=msg.content))
                    else:
                        messages.append(AIMessage(content=msg.content))
            
            messages.extend(formatted_prompt)
            
            # Reset callback handler
            callback_handler.reset()
            
            # Stream the response
            async for chunk in streaming_llm.astream(messages):
                if chunk.content:
                    yield chunk.content
            
            logger.info(f"Streamed AI response for learning set {learning_set.id}")
            
        except Exception as e:
            logger.error(f"Error streaming AI response: {e}")
            yield "I'm having trouble responding right now. Could you try asking again?"
    
    async def analyze_message(
        self, 
        user_message: str, 
        learning_set: LearningSet
    ) -> Dict[str, Any]:
        """Analyze user message for grammar corrections and vocabulary usage using enhanced LangChain chains."""
        try:
            # Format learning content
            learning_context = self._format_learning_content(learning_set)
            
            # Create comprehensive analysis prompt
            analysis_prompt = self.correction_template.format(
                user_message=user_message,
                **learning_context
            )
            
            # Generate primary analysis
            response = await self.analysis_llm.ainvoke([HumanMessage(content=analysis_prompt)])
            
            # Parse JSON response
            try:
                analysis_result = json.loads(response.content)
                
                # Enhance corrections with gentle feedback using chains
                if analysis_result.get("corrections"):
                    enhanced_corrections = []
                    for correction in analysis_result["corrections"]:
                        try:
                            gentle_feedback = await self.gentle_correction_chain.arun(
                                original_text=correction.get("original", ""),
                                corrected_text=correction.get("corrected", ""),
                                explanation=correction.get("explanation", ""),
                                grade_level=learning_context["grade_level"]
                            )
                            correction["gentle_feedback"] = gentle_feedback.strip()
                        except Exception as e:
                            logger.warning(f"Failed to generate gentle feedback: {e}")
                            correction["gentle_feedback"] = correction.get("explanation", "")
                        
                        enhanced_corrections.append(correction)
                    
                    analysis_result["corrections"] = enhanced_corrections
                
                # Run additional vocabulary analysis if target vocabulary exists
                if learning_context["vocabulary_words"] != "General vocabulary practice":
                    try:
                        vocab_analysis = await self.vocabulary_chain.arun(
                            user_message=user_message,
                            target_vocabulary=learning_context["vocabulary_words"],
                            grade_level=learning_context["grade_level"]
                        )
                        analysis_result["detailed_vocabulary_feedback"] = vocab_analysis.strip()
                    except Exception as e:
                        logger.warning(f"Failed to generate detailed vocabulary feedback: {e}")
                
                # Run grammar pattern analysis
                if learning_context["grammar_topics"] != "General grammar practice":
                    try:
                        grammar_analysis = await self.grammar_pattern_chain.arun(
                            user_message=user_message,
                            grammar_focus=learning_context["grammar_topics"],
                            grade_level=learning_context["grade_level"]
                        )
                        analysis_result["grammar_pattern_feedback"] = grammar_analysis.strip()
                    except Exception as e:
                        logger.warning(f"Failed to generate grammar pattern feedback: {e}")
                
                logger.info(f"Enhanced analysis completed for learning set {learning_set.id}")
                return analysis_result
                
            except json.JSONDecodeError:
                logger.warning("Failed to parse analysis JSON, returning default structure")
                return await self._fallback_analysis(user_message, learning_set)
                
        except Exception as e:
            logger.error(f"Error analyzing message: {e}")
            return await self._fallback_analysis(user_message, learning_set)
    
    async def _fallback_analysis(self, user_message: str, learning_set: LearningSet) -> Dict[str, Any]:
        """Provide fallback analysis when primary analysis fails."""
        try:
            # Simple vocabulary detection
            vocabulary_used = []
            if learning_set.vocabulary_items:
                for vocab_item in learning_set.vocabulary_items:
                    if vocab_item.word.lower() in user_message.lower():
                        vocabulary_used.append({
                            "word": vocab_item.word,
                            "used_correctly": True,  # Assume correct for fallback
                            "context": f"Found '{vocab_item.word}' in message",
                            "definition_match": True
                        })
            
            return {
                "corrections": [],
                "vocabulary_used": vocabulary_used,
                "encouragement": "Great job practicing! Keep up the good work.",
                "difficulty_assessment": "appropriate",
                "learning_progress": {
                    "grammar_concepts_demonstrated": [],
                    "vocabulary_level": "at grade level",
                    "areas_for_improvement": []
                }
            }
        except Exception as e:
            logger.error(f"Fallback analysis failed: {e}")
            return {
                "corrections": [],
                "vocabulary_used": [],
                "encouragement": "Keep practicing! You're doing great."
            }
    
    async def generate_vocabulary_reinforcement(
        self,
        vocabulary_usage: List[Dict[str, Any]],
        learning_set: LearningSet
    ) -> str:
        """Generate positive reinforcement for correct vocabulary usage."""
        try:
            if not vocabulary_usage:
                return ""
            
            correct_words = [v for v in vocabulary_usage if v.get("used_correctly", False)]
            if not correct_words:
                return ""
            
            learning_context = self._format_learning_content(learning_set)
            
            reinforcement_prompt = f"""
            A {learning_context['grade_level']} student correctly used these vocabulary words:
            {', '.join([v['word'] for v in correct_words])}
            
            Create a brief, encouraging response that:
            1. Celebrates their correct usage
            2. Reinforces the meaning of the words they used well
            3. Encourages continued practice
            4. Uses age-appropriate, positive language
            
            Keep it conversational and motivating, not overly formal.
            """
            
            response = await self.analysis_llm.ainvoke([HumanMessage(content=reinforcement_prompt)])
            return response.content.strip()
            
        except Exception as e:
            logger.error(f"Error generating vocabulary reinforcement: {e}")
            return "Great job using those vocabulary words correctly!"
    
    async def generate_gentle_correction_response(
        self,
        corrections: List[Dict[str, Any]],
        learning_set: LearningSet
    ) -> str:
        """Generate a gentle, conversational correction that maintains student confidence."""
        try:
            if not corrections:
                return ""
            
            learning_context = self._format_learning_content(learning_set)
            
            # Focus on the most important correction (first one)
            main_correction = corrections[0]
            
            correction_prompt = f"""
            A {learning_context['grade_level']} student wrote: "{main_correction.get('original', '')}"
            The correct form is: "{main_correction.get('corrected', '')}"
            Grammar rule: {main_correction.get('grammar_rule', '')}
            
            Create a gentle, encouraging response that:
            1. Acknowledges what they're trying to say
            2. Naturally introduces the correct form
            3. Briefly explains why in simple terms
            4. Encourages them to keep practicing
            5. Maintains a supportive, conversational tone
            
            Make it feel like helpful guidance from a friendly tutor, not criticism.
            """
            
            response = await self.analysis_llm.ainvoke([HumanMessage(content=correction_prompt)])
            return response.content.strip()
            
        except Exception as e:
            logger.error(f"Error generating gentle correction: {e}")
            return "I understand what you mean! Let me help you with that grammar point."

    def get_conversation_starter(self, learning_set: LearningSet) -> str:
        """Generate a conversation starter based on the learning set."""
        try:
            learning_context = self._format_learning_content(learning_set)
            
            starters = [
                f"Hi! I'm excited to practice {learning_context['subject']} with you today. What would you like to talk about?",
                f"Hello! Let's have a fun conversation while practicing your {learning_context['subject']} skills. How was your day?",
                f"Welcome! I'm here to help you practice {learning_context['subject']}. What's something interesting you learned recently?",
                f"Hi there! Ready to practice some {learning_context['subject']}? Tell me about something you enjoy doing.",
                f"Hello! Let's chat and practice your language skills. What's your favorite subject in school?"
            ]
            
            # Simple selection based on learning set ID for consistency
            starter_index = hash(learning_set.id) % len(starters)
            return starters[starter_index]
            
        except Exception as e:
            logger.error(f"Error generating conversation starter: {e}")
            return "Hi! I'm here to help you practice your language skills. How are you doing today?"
    
    def validate_api_key(self) -> bool:
        """Validate that the OpenAI API key is configured."""
        return bool(self.openai_api_key)
    
    async def health_check(self) -> Dict[str, Any]:
        """Perform a health check on the AI service."""
        try:
            # Simple test message
            test_response = await self.llm.ainvoke([
                HumanMessage(content="Hello, this is a test message.")
            ])
            
            return {
                "status": "healthy",
                "model": "gpt-4-turbo-preview",
                "api_key_configured": bool(self.openai_api_key),
                "test_response_length": len(test_response.content) if test_response.content else 0
            }
        except Exception as e:
            logger.error(f"AI service health check failed: {e}")
            return {
                "status": "unhealthy",
                "error": str(e),
                "api_key_configured": bool(self.openai_api_key)
            }

# Global instance
ai_tutor_service = AITutorService()