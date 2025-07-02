# Vehiculos Backend - Development Makefile

.PHONY: help up down logs db restart clean dev docs health sample-data

help: ## Show available commands
	@echo "🚗 Vehiculos Backend Commands"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "URLs: http://localhost:3000 • http://localhost:3000/docs"

up: ## Start application and database
	docker compose up --build -d
	@echo "✅ Started. Next: make sample-data"

down: ## Stop application
	docker compose down

sample-data: ## Load test data (15 users, 15 vehicles)
	@read -p "Load sample data? (y/N): " confirm; \
	if [ "$$confirm" = "y" ] || [ "$$confirm" = "Y" ]; then \
		docker compose exec db psql -U postgres -d vehicles_db -f /docker-entrypoint-initdb.d/sample_data.sql; \
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

dev: ## Development mode with hot reload
	npm run dev

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
