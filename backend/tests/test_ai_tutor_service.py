"""
Tests for AI tutor service with LangChain integration.
"""

import pytest
import asyncio
import json
from unittest.mock import Mock, AsyncMock, patch, MagicMock
from datetime import datetime

from services.ai_tutor_service import AITutorService, StreamingCallbackHandler
from models.database_models import LearningSet, VocabularyItem, GrammarTopic, ChatMessage, SenderType, GrammarDifficulty


class TestStreamingCallbackHandler:
    """Test the streaming callback handler."""
    
    def test_init(self):
        """Test callback handler initialization."""
        handler = StreamingCallbackHandler()
        assert handler.tokens == []
        assert handler.current_response == ""
    
    @pytest.mark.asyncio
    async def test_on_llm_new_token(self):
        """Test handling new tokens."""
        handler = StreamingCallbackHandler()
        
        await handler.on_llm_new_token("Hello")
        await handler.on_llm_new_token(" ")
        await handler.on_llm_new_token("world")
        
        assert handler.tokens == ["Hello", " ", "world"]
        assert handler.current_response == "Hello world"
    
    def test_reset(self):
        """Test resetting the handler."""
        handler = StreamingCallbackHandler()
        handler.tokens = ["test"]
        handler.current_response = "test"
        
        handler.reset()
        
        assert handler.tokens == []
        assert handler.current_response == ""


class TestAITutorService:
    """Test the AI tutor service."""
    
    @pytest.fixture
    def mock_env(self):
        """Mock environment variables."""
        with patch.dict('os.environ', {'OPENAI_API_KEY': 'test-api-key'}):
            yield
    
    @pytest.fixture
    def mock_learning_set(self):
        """Create a mock learning set."""
        learning_set = Mock(spec=LearningSet)
        learning_set.id = "test-set-id"
        learning_set.grade_level = "5th grade"
        learning_set.subject = "English"
        
        # Mock vocabulary items
        vocab1 = Mock(spec=VocabularyItem)
        vocab1.word = "adventure"
        vocab1.definition = "an exciting experience"
        vocab1.example_sentence = "We went on an adventure in the forest."
        
        vocab2 = Mock(spec=VocabularyItem)
        vocab2.word = "explore"
        vocab2.definition = "to investigate or travel through"
        vocab2.example_sentence = None
        
        learning_set.vocabulary_items = [vocab1, vocab2]
        
        # Mock grammar topics
        grammar1 = Mock(spec=GrammarTopic)
        grammar1.name = "Past Tense"
        grammar1.description = "Using verbs in past tense"
        grammar1.rule_explanation = "Add -ed to regular verbs"
        
        learning_set.grammar_topics = [grammar1]
        
        return learning_set
    
    @pytest.fixture
    def mock_chat_messages(self):
        """Create mock chat messages."""
        msg1 = Mock(spec=ChatMessage)
        msg1.sender = SenderType.USER
        msg1.content = "Hello, I want to practice English."
        
        msg2 = Mock(spec=ChatMessage)
        msg2.sender = SenderType.AI
        msg2.content = "Great! Let's practice together."
        
        return [msg1, msg2]
    
    def test_init_with_api_key(self, mock_env):
        """Test service initialization with API key."""
        with patch('services.ai_tutor_service.ChatOpenAI') as mock_chat_openai, \
             patch('services.ai_tutor_service.LLMChain'):
            service = AITutorService()
            
            assert service.openai_api_key == "test-api-key"
            assert mock_chat_openai.call_count == 2  # llm and analysis_llm
    
    def test_init_without_api_key(self):
        """Test service initialization without API key raises error."""
        with patch.dict('os.environ', {}, clear=True):
            with pytest.raises(ValueError, match="OPENAI_API_KEY environment variable is required"):
                AITutorService()
    
    def test_format_learning_content(self, mock_env, mock_learning_set):
        """Test formatting learning content for prompts."""
        with patch('services.ai_tutor_service.ChatOpenAI'), \
             patch('services.ai_tutor_service.LLMChain'):
            service = AITutorService()
            
            result = service._format_learning_content(mock_learning_set)
            
            assert result["grade_level"] == "5th grade"
            assert result["subject"] == "English"
            assert "adventure: an exciting experience" in result["vocabulary_words"]
            assert "explore: to investigate or travel through" in result["vocabulary_words"]
            assert "Past Tense: Using verbs in past tense" in result["grammar_topics"]
    
    def test_format_learning_content_empty(self, mock_env):
        """Test formatting learning content with empty data."""
        with patch('services.ai_tutor_service.ChatOpenAI'), \
             patch('services.ai_tutor_service.LLMChain'):
            service = AITutorService()
            
            learning_set = Mock(spec=LearningSet)
            learning_set.id = "empty-set"
            learning_set.grade_level = None
            learning_set.subject = None
            learning_set.vocabulary_items = []
            learning_set.grammar_topics = []
            
            result = service._format_learning_content(learning_set)
            
            assert result["grade_level"] == "elementary"
            assert result["subject"] == "language arts"
            assert result["vocabulary_words"] == "General vocabulary practice"
            assert result["grammar_topics"] == "General grammar practice"
    
    @pytest.mark.asyncio
    async def test_generate_response(self, mock_env, mock_learning_set, mock_chat_messages):
        """Test generating AI response."""
        with patch('services.ai_tutor_service.ChatOpenAI') as mock_chat_openai, \
             patch('services.ai_tutor_service.LLMChain'):
            mock_llm = AsyncMock()
            mock_response = Mock()
            mock_response.content = "That's great! Let's practice using 'adventure' in a sentence."
            mock_llm.ainvoke.return_value = mock_response
            mock_chat_openai.return_value = mock_llm
            
            service = AITutorService()
            
            result = await service.generate_response(
                "I want to learn about adventures",
                mock_learning_set,
                mock_chat_messages
            )
            
            assert result == "That's great! Let's practice using 'adventure' in a sentence."
            mock_llm.ainvoke.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_generate_response_error(self, mock_env, mock_learning_set):
        """Test generating AI response with error."""
        with patch('services.ai_tutor_service.ChatOpenAI') as mock_chat_openai, \
             patch('services.ai_tutor_service.LLMChain'):
            mock_llm = AsyncMock()
            mock_llm.ainvoke.side_effect = Exception("API Error")
            mock_chat_openai.return_value = mock_llm
            
            service = AITutorService()
            
            result = await service.generate_response(
                "Test message",
                mock_learning_set
            )
            
            assert "having trouble responding" in result
    
    @pytest.mark.asyncio
    async def test_stream_response(self, mock_env, mock_learning_set):
        """Test streaming AI response."""
        with patch('services.ai_tutor_service.ChatOpenAI') as mock_chat_openai, \
             patch('services.ai_tutor_service.LLMChain'):
            # Mock streaming response
            async def mock_astream(messages):
                chunks = ["Hello", " there", "! How", " are", " you?"]
                for chunk in chunks:
                    mock_chunk = Mock()
                    mock_chunk.content = chunk
                    yield mock_chunk
            
            mock_llm = AsyncMock()
            mock_llm.astream = mock_astream
            mock_chat_openai.return_value = mock_llm
            
            service = AITutorService()
            
            chunks = []
            async for chunk in service.stream_response("Hello", mock_learning_set):
                chunks.append(chunk)
            
            assert chunks == ["Hello", " there", "! How", " are", " you?"]
    
    @pytest.mark.asyncio
    async def test_stream_response_error(self, mock_env, mock_learning_set):
        """Test streaming AI response with error."""
        with patch('services.ai_tutor_service.ChatOpenAI') as mock_chat_openai, \
             patch('services.ai_tutor_service.LLMChain'):
            mock_llm = AsyncMock()
            mock_llm.astream.side_effect = Exception("Streaming error")
            mock_chat_openai.return_value = mock_llm
            
            service = AITutorService()
            
            chunks = []
            async for chunk in service.stream_response("Test", mock_learning_set):
                chunks.append(chunk)
            
            assert len(chunks) == 1
            assert "having trouble responding" in chunks[0]
    
    @pytest.mark.asyncio
    async def test_analyze_message(self, mock_env, mock_learning_set):
        """Test analyzing user message with enhanced feedback."""
        with patch('services.ai_tutor_service.ChatOpenAI') as mock_chat_openai:
            with patch('services.ai_tutor_service.LLMChain') as mock_chain:
                mock_llm = AsyncMock()
                mock_response = Mock()
                mock_response.content = json.dumps({
                    "corrections": [
                        {
                            "original": "I goed",
                            "corrected": "I went",
                            "explanation": "Past tense of 'go' is 'went'",
                            "grammar_rule": "Irregular verbs",
                            "severity": "moderate",
                            "learning_tip": "Remember that 'go' becomes 'went' in past tense"
                        }
                    ],
                    "vocabulary_used": [
                        {
                            "word": "adventure",
                            "used_correctly": True,
                            "context": "Used correctly in sentence",
                            "definition_match": True
                        }
                    ],
                    "encouragement": "Great job using vocabulary!",
                    "difficulty_assessment": "appropriate",
                    "learning_progress": {
                        "grammar_concepts_demonstrated": ["past tense"],
                        "vocabulary_level": "at grade level",
                        "areas_for_improvement": ["irregular verbs"]
                    }
                })
                mock_llm.ainvoke.return_value = mock_response
                mock_chat_openai.return_value = mock_llm
                
                # Mock the chains
                mock_gentle_chain = AsyncMock()
                mock_gentle_chain.arun.return_value = "I understand you went on an adventure! The past tense of 'go' is 'went'."
                
                mock_vocab_chain = AsyncMock()
                mock_vocab_chain.arun.return_value = "Great use of 'adventure'! You used it perfectly to describe an exciting experience."
                
                mock_grammar_chain = AsyncMock()
                mock_grammar_chain.arun.return_value = "You're practicing past tense verbs. Remember that some verbs like 'go' are irregular."
                
                service = AITutorService()
                service.gentle_correction_chain = mock_gentle_chain
                service.vocabulary_chain = mock_vocab_chain
                service.grammar_pattern_chain = mock_grammar_chain
                
                result = await service.analyze_message(
                    "I goed on an adventure yesterday",
                    mock_learning_set
                )
                
                assert len(result["corrections"]) == 1
                assert result["corrections"][0]["original"] == "I goed"
                assert result["corrections"][0]["corrected"] == "I went"
                assert result["corrections"][0]["severity"] == "moderate"
                assert "gentle_feedback" in result["corrections"][0]
                assert len(result["vocabulary_used"]) == 1
                assert result["vocabulary_used"][0]["word"] == "adventure"
                assert result["vocabulary_used"][0]["definition_match"] is True
                assert result["encouragement"] == "Great job using vocabulary!"
                assert "detailed_vocabulary_feedback" in result
                assert "grammar_pattern_feedback" in result
    
    @pytest.mark.asyncio
    async def test_analyze_message_invalid_json(self, mock_env, mock_learning_set):
        """Test analyzing message with invalid JSON response."""
        with patch('services.ai_tutor_service.ChatOpenAI') as mock_chat_openai, \
             patch('services.ai_tutor_service.LLMChain'):
            mock_llm = AsyncMock()
            mock_response = Mock()
            mock_response.content = "Invalid JSON response"
            mock_llm.ainvoke.return_value = mock_response
            mock_chat_openai.return_value = mock_llm
            
            service = AITutorService()
            
            result = await service.analyze_message("Test message", mock_learning_set)
            
            assert result["corrections"] == []
            assert result["vocabulary_used"] == []
            assert "Great job practicing" in result["encouragement"]
    
    @pytest.mark.asyncio
    async def test_analyze_message_error(self, mock_env, mock_learning_set):
        """Test analyzing message with error falls back gracefully."""
        with patch('services.ai_tutor_service.ChatOpenAI') as mock_chat_openai, \
             patch('services.ai_tutor_service.LLMChain'):
            mock_llm = AsyncMock()
            mock_llm.ainvoke.side_effect = Exception("Analysis error")
            mock_chat_openai.return_value = mock_llm
            
            service = AITutorService()
            
            result = await service.analyze_message("I used adventure in my story", mock_learning_set)
            
            # Should fall back to simple vocabulary detection
            assert result["corrections"] == []
            assert len(result["vocabulary_used"]) == 1  # Should detect "adventure"
            assert result["vocabulary_used"][0]["word"] == "adventure"
            assert "Great job practicing" in result["encouragement"]
    
    @pytest.mark.asyncio
    async def test_generate_vocabulary_reinforcement(self, mock_env, mock_learning_set):
        """Test generating vocabulary reinforcement feedback."""
        with patch('services.ai_tutor_service.ChatOpenAI') as mock_chat_openai, \
             patch('services.ai_tutor_service.LLMChain'):
            mock_llm = AsyncMock()
            mock_response = Mock()
            mock_response.content = "Excellent use of 'adventure' and 'explore'! You really understand these words."
            mock_llm.ainvoke.return_value = mock_response
            mock_chat_openai.return_value = mock_llm
            
            service = AITutorService()
            
            vocabulary_usage = [
                {"word": "adventure", "used_correctly": True, "context": "great usage"},
                {"word": "explore", "used_correctly": True, "context": "perfect context"}
            ]
            
            result = await service.generate_vocabulary_reinforcement(vocabulary_usage, mock_learning_set)
            
            assert "Excellent use" in result
            assert "adventure" in result
            assert "explore" in result
    
    @pytest.mark.asyncio
    async def test_generate_vocabulary_reinforcement_no_correct_words(self, mock_env, mock_learning_set):
        """Test vocabulary reinforcement with no correct words."""
        with patch('services.ai_tutor_service.ChatOpenAI'), \
             patch('services.ai_tutor_service.LLMChain'):
            service = AITutorService()
            
            vocabulary_usage = [
                {"word": "adventure", "used_correctly": False, "context": "incorrect usage"}
            ]
            
            result = await service.generate_vocabulary_reinforcement(vocabulary_usage, mock_learning_set)
            
            assert result == ""  # Should return empty string when no correct usage
    
    @pytest.mark.asyncio
    async def test_generate_gentle_correction_response(self, mock_env, mock_learning_set):
        """Test generating gentle correction responses."""
        with patch('services.ai_tutor_service.ChatOpenAI') as mock_chat_openai, \
             patch('services.ai_tutor_service.LLMChain'):
            mock_llm = AsyncMock()
            mock_response = Mock()
            mock_response.content = "I can see you're talking about the past! When we talk about going somewhere yesterday, we say 'I went' instead of 'I goed'. Great story though!"
            mock_llm.ainvoke.return_value = mock_response
            mock_chat_openai.return_value = mock_llm
            
            service = AITutorService()
            
            corrections = [
                {
                    "original": "I goed",
                    "corrected": "I went",
                    "grammar_rule": "Irregular past tense verbs"
                }
            ]
            
            result = await service.generate_gentle_correction_response(corrections, mock_learning_set)
            
            assert "I can see you're talking about the past" in result
            assert "I went" in result
            assert "Great story" in result
    
    @pytest.mark.asyncio
    async def test_generate_gentle_correction_response_no_corrections(self, mock_env, mock_learning_set):
        """Test gentle correction with no corrections."""
        with patch('services.ai_tutor_service.ChatOpenAI'), \
             patch('services.ai_tutor_service.LLMChain'):
            service = AITutorService()
            
            result = await service.generate_gentle_correction_response([], mock_learning_set)
            
            assert result == ""  # Should return empty string when no corrections
    
    @pytest.mark.asyncio
    async def test_fallback_analysis(self, mock_env, mock_learning_set):
        """Test fallback analysis when primary analysis fails."""
        with patch('services.ai_tutor_service.ChatOpenAI'), \
             patch('services.ai_tutor_service.LLMChain'):
            service = AITutorService()
            
            result = await service._fallback_analysis("I went on an adventure", mock_learning_set)
            
            assert result["corrections"] == []
            assert len(result["vocabulary_used"]) == 1  # Should detect "adventure"
            assert result["vocabulary_used"][0]["word"] == "adventure"
            assert result["vocabulary_used"][0]["used_correctly"] is True
            assert "Great job practicing" in result["encouragement"]
            assert result["difficulty_assessment"] == "appropriate"
            assert "learning_progress" in result
    
    def test_get_conversation_starter(self, mock_env, mock_learning_set):
        """Test getting conversation starter."""
        with patch('services.ai_tutor_service.ChatOpenAI'), \
             patch('services.ai_tutor_service.LLMChain'):
            service = AITutorService()
            
            starter = service.get_conversation_starter(mock_learning_set)
            
            assert isinstance(starter, str)
            assert len(starter) > 0
            assert "English" in starter or "practice" in starter
    
    def test_get_conversation_starter_error(self, mock_env):
        """Test getting conversation starter with error."""
        with patch('services.ai_tutor_service.ChatOpenAI'), \
             patch('services.ai_tutor_service.LLMChain'):
            service = AITutorService()
            
            # Mock learning set that causes error
            learning_set = Mock()
            learning_set.id = None  # This should cause an error in hash()
            
            starter = service.get_conversation_starter(learning_set)
            
            assert "Hi! I'm here to help you practice" in starter
    
    def test_validate_api_key(self, mock_env):
        """Test API key validation."""
        with patch('services.ai_tutor_service.ChatOpenAI'), \
             patch('services.ai_tutor_service.LLMChain'):
            service = AITutorService()
            assert service.validate_api_key() is True
    
    def test_validate_api_key_missing(self):
        """Test API key validation when missing."""
        with patch.dict('os.environ', {}, clear=True):
            with patch('services.ai_tutor_service.ChatOpenAI'):
                # This should raise an error during init, but let's test the method
                try:
                    service = AITutorService()
                except ValueError:
                    # Expected behavior
                    pass
    
    @pytest.mark.asyncio
    async def test_health_check_healthy(self, mock_env):
        """Test health check when service is healthy."""
        with patch('services.ai_tutor_service.ChatOpenAI') as mock_chat_openai, \
             patch('services.ai_tutor_service.LLMChain'):
            mock_llm = AsyncMock()
            mock_response = Mock()
            mock_response.content = "Hello! This is a test response."
            mock_llm.ainvoke.return_value = mock_response
            mock_chat_openai.return_value = mock_llm
            
            service = AITutorService()
            
            result = await service.health_check()
            
            assert result["status"] == "healthy"
            assert result["model"] == "gpt-4-turbo-preview"
            assert result["api_key_configured"] is True
            assert result["test_response_length"] > 0
    
    @pytest.mark.asyncio
    async def test_health_check_unhealthy(self, mock_env):
        """Test health check when service is unhealthy."""
        with patch('services.ai_tutor_service.ChatOpenAI') as mock_chat_openai, \
             patch('services.ai_tutor_service.LLMChain'):
            mock_llm = AsyncMock()
            mock_llm.ainvoke.side_effect = Exception("Service unavailable")
            mock_chat_openai.return_value = mock_llm
            
            service = AITutorService()
            
            result = await service.health_check()
            
            assert result["status"] == "unhealthy"
            assert "Service unavailable" in result["error"]
            assert result["api_key_configured"] is True


@pytest.mark.integration
class TestAITutorServiceIntegration:
    """Integration tests for AI tutor service (requires actual API key)."""
    
    @pytest.mark.asyncio
    async def test_real_api_integration(self):
        """Test with real OpenAI API (requires valid API key)."""
        import os
        
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            pytest.skip("OPENAI_API_KEY not set for integration test")
        
        # Create a simple learning set
        learning_set = Mock(spec=LearningSet)
        learning_set.id = "integration-test"
        learning_set.grade_level = "3rd grade"
        learning_set.subject = "English"
        learning_set.vocabulary_items = []
        learning_set.grammar_topics = []
        
        service = AITutorService()
        
        # Test health check
        health = await service.health_check()
        assert health["status"] == "healthy"
        
        # Test conversation starter
        starter = service.get_conversation_starter(learning_set)
        assert isinstance(starter, str)
        assert len(starter) > 10
        
        # Test response generation
        response = await service.generate_response(
            "Hello, I want to practice English",
            learning_set
        )
        assert isinstance(response, str)
        assert len(response) > 10
        
        # Test message analysis
        analysis = await service.analyze_message(
            "I goed to the store yesterday",
            learning_set
        )
        assert isinstance(analysis, dict)
        assert "corrections" in analysis
        assert "vocabulary_used" in analysis
        assert "encouragement" in analysis
