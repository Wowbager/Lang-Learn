# Language Learning Chat - Development Commands

.PHONY: help dev prod build clean logs test

help: ## Show this help message
	@echo "Language Learning Chat - Available Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

dev: ## Start development environment
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build

prod: ## Start production environment
	docker-compose up -d --build

build: ## Build all containers
	docker-compose build

clean: ## Stop and remove all containers, networks, and volumes
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml down -v
	docker system prune -f

logs: ## Show logs from all services
	docker-compose logs -f

logs-backend: ## Show backend logs
	docker-compose logs -f backend

logs-frontend: ## Show frontend logs
	docker-compose logs -f frontend

test-backend: ## Run backend tests
	docker-compose exec backend pytest

test-frontend: ## Run frontend tests
	docker-compose exec frontend npm test

shell-backend: ## Open shell in backend container
	docker-compose exec backend bash

shell-frontend: ## Open shell in frontend container
	docker-compose exec frontend sh

db-shell: ## Open PostgreSQL shell
	docker-compose exec postgres psql -U postgres -d language_learning

setup: ## Initial setup - copy env files
	cp .env.example .env
	cp backend/.env.example backend/.env
	cp frontend/.env.example frontend/.env
	@echo "Environment files created. Please edit .env files with your configuration."