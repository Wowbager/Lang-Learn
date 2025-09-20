# Language Learning Chat

An interactive AI-powered language learning application that helps students practice grammar and vocabulary through conversational experiences.

## Quick word from the developer

This app exists because I wanted to try Kiro, a spec-driven AI editor. In practice, it runs on the sacred rites of VaaS (Vulnerability as a Service) and tech-debt-driven development. Claiming I know even 1% of the code in this repo would be generous.

If you think it’s cool, check it out [here](https://t.lrnm.eu). If it isn’t working, I probably fell asleep before fixing the bug.

Why don’t I test locally or run a staging server? Because testing in prod is a thrilling, character-building experience.

## Features

- Interactive chat with AI tutor
- Photo-to-content extraction from textbooks
- Collaborative learning with classes and groups
- Progress tracking and analytics
- Mobile-responsive design

## Tech Stack

- **Frontend**: React with TypeScript
- **Backend**: FastAPI with Python
- **Database**: PostgreSQL
- **AI Integration**: LangChain with OpenAI/Anthropic
- **Containerization**: Docker & Docker Compose
- **Reverse Proxy**: Traefik

## Quick Start

### Prerequisites

- Docker and Docker Compose
- OpenAI API key (optional for development)

### Development Setup

1. Clone the repository and navigate to the project directory

2. Copy environment files:
   ```bash
   cp .env.example .env
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

3. Add your OpenAI API key to the `.env` file (optional for initial setup)

4. Start the development environment:
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build
   ```

5. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Production Setup

1. Configure environment variables in `.env`

2. Start the production environment:
   ```bash
   docker-compose up -d --build
   ```

3. Access the application:
   - Application: http://localhost
   - Traefik Dashboard: http://localhost:8080

## Project Structure

```
├── frontend/                 # React TypeScript frontend
│   ├── src/                 # Source code
│   ├── public/              # Static assets
│   ├── Dockerfile           # Production build
│   └── Dockerfile.dev       # Development build
├── backend/                 # FastAPI Python backend
│   ├── main.py             # Application entry point
│   ├── requirements.txt    # Python dependencies
│   └── Dockerfile          # Multi-stage build
├── docker-compose.yml      # Production services
├── docker-compose.dev.yml  # Development overrides
└── .env                    # Environment configuration
```

## Development

### Frontend Development

The frontend runs on port 3000 with hot reload enabled. Make changes to files in `frontend/src/` and they will be automatically reflected.

### Backend Development

The backend runs on port 8000 with hot reload enabled. Make changes to files in `backend/` and the server will automatically restart.

### Database

PostgreSQL runs on port 5432. The database is initialized with the schema from `schema.sql`.

## Environment Variables

See `.env.example` files for all available configuration options.

## Contributing

1. Follow the task-based development approach outlined in the spec
2. Ensure all changes are tested
3. Update documentation as needed

## License

This project is for educational purposes.