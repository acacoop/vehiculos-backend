# Vehiculos Backend - Development Makefile

.PHONY: help setup up down logs db restart clean dev dev-stop docs health sample-data sync-users sync-users-verbose

# Helper function to wait for database
define wait_for_db
	@echo "⏳ Waiting for database..."
	@for i in 1 2 3 4 5 6 7 8 9 10; do \
		if docker compose exec -T db pg_isready -U postgres -d vehicles_db >/dev/null 2>&1; then \
			echo "✅ Database ready!"; \
			break; \
		else \
			printf "   ."; \
			sleep 2; \
		fi; \
		if [ $$i -eq 10 ]; then \
			echo "\n⚠️  Continuing anyway..."; \
		fi; \
	done
	@echo ""
endef

help: ## Show available commands
	@echo "🚗 Vehiculos Backend Commands"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "URLs: http://localhost:3000 • http://localhost:3000/docs"

up: ## Start application and database
	@docker compose up --build -d  && echo "✅ Services started. Try: make sample-data"

down: ## Stop application
	@docker compose down >/dev/null 2>&1 && echo "✅ Services stopped"

sample-data: ## Load test data (15 users, 15 vehicles)
	@read -p "Load sample data? (y/N): " confirm; \
	if [ "$$confirm" = "y" ] || [ "$$confirm" = "Y" ]; then \
		docker compose exec -T db psql -U postgres -d vehicles_db < ./db/sample_data.sql; \
		echo "✅ Sample data loaded"; \
	else \
		echo "❌ Cancelled"; \
	fi

docs: ## Open API documentation
	@command -v open >/dev/null 2>&1 && open http://localhost:3000/docs || \
	 command -v xdg-open >/dev/null 2>&1 && xdg-open http://localhost:3000/docs || \
	 echo "📖 Open: http://localhost:3000/docs"

health: ## Check application status
	@curl -f http://localhost:3000/health 2>/dev/null | jq . || echo "❌ Not responding"

setup: ## Initial setup (install deps, start services, load sample data)
	@echo "🏗️  Initial setup..."
	@npm install >/dev/null 2>&1 && echo "✅ Dependencies installed"
	@docker compose up -d >/dev/null 2>&1 && echo "✅ Services started"
	$(call wait_for_db)
	@docker compose exec -T db psql -U postgres -d vehicles_db -f /docker-entrypoint-initdb.d/sample_data.sql >/dev/null 2>&1 && echo "✅ Sample data loaded" || echo "⚠️  Sample data already exists"
	@echo "🎉 Ready! API: http://localhost:3000 | Docs: http://localhost:3000/docs"

dev: ## Development mode with hot reload (starts DB, stops backend container, runs locally)
	@echo "🚀 Starting development environment..."
	@docker compose up -d db >/dev/null 2>&1 && echo "✅ Database starting"
	@docker compose stop backend >/dev/null 2>&1 || true
	$(call wait_for_db)
	@if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then echo "⚠️  Port 3000 in use!"; exit 1; fi
	@echo "🔄 Starting with hot reload..."
	@NODE_ENV=development npm run dev

dev-stop: ## Stop development environment
	@docker compose down >/dev/null 2>&1 && echo "✅ Development stopped"

logs: ## View application logs
	docker compose logs -f backend

restart: ## Quick restart
	docker compose restart

clean: ## Clean everything and start fresh
	docker compose down -v
	docker system prune -f

db: ## Connect to PostgreSQL (via Docker container)
	docker compose exec db psql -U postgres -d vehicles_db

db-reset: ## Reset database (deletes all data)
	@read -p "Delete all data? (y/N): " confirm; \
	if [ "$$confirm" = "y" ] || [ "$$confirm" = "Y" ]; then \
		docker compose down db; \
		docker volume rm vehiculos-backend_postgres_data || true; \
		docker compose up -d db; \
		echo "✅ Database reset"; \
	else \
		echo "❌ Cancelled"; \
	fi

sync-users:
	@$(call wait_for_db)
	@echo "🔄 Syncing users from Entra..."
	@npm run --silent sync:users
	@echo "✅ Sync complete"

sync-users-verbose:
	@$(call wait_for_db)
	@echo "🔄 Syncing users from Entra (verbose)..."
	@VERBOSE=1 npm run --silent sync:users
	@echo "✅ Sync complete"
