# Vehiculos Backend - Development Makefile

.PHONY: help up down logs db restart clean dev docs health sample-data

# Default target
help: ## Show this help message
	@echo "🚗 Vehiculos Backend - Available Commands"
	@echo ""
	@echo "📚 Essential:"
	@grep -E '^(up|sample-data|docs|health|down):.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "🔧 Development:"
	@grep -E '^(dev|logs|restart|clean):.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "🗄️  Database:"
	@grep -E '^(db|db-reset):.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "🌐 URLs:"
	@echo "  API:           http://localhost:3000"
	@echo "  Documentation: http://localhost:3000/docs"
	@echo "  Health:        http://localhost:3000/health"
	@echo ""

# Essential commands
up: ## Start application and database
	@echo "🚀 Starting application..."
	docker-compose up --build -d
	@echo "✅ Application started"
	@echo "📖 Next: make sample-data (load test data)"
	@echo "📚 Docs: make docs"

down: ## Stop application
	@echo "🛑 Stopping application..."
	docker-compose down

sample-data: ## Load comprehensive test data
	@echo "📊 Loading sample data..."
	@echo "ℹ️  This replaces existing data with test data (15 users, 15 vehicles, maintenance system)"
	@read -p "Continue? (y/N): " confirm; \
	if [ "$$confirm" = "y" ] || [ "$$confirm" = "Y" ]; then \
		docker-compose exec db psql -U postgres -d vehicles_db -f /docker-entrypoint-initdb.d/sample_data.sql; \
		echo "✅ Sample data loaded"; \
		echo "📚 Explore at: http://localhost:3000/docs"; \
	else \
		echo "❌ Cancelled"; \
	fi

docs: ## Open API documentation in browser
	@echo "📚 Opening API documentation..."
	@command -v open >/dev/null 2>&1 && open http://localhost:3000/docs || \
	 command -v xdg-open >/dev/null 2>&1 && xdg-open http://localhost:3000/docs || \
	 echo "📖 Open manually: http://localhost:3000/docs"

health: ## Check application health
	@echo "🩺 Checking application health..."
	@curl -f http://localhost:3000/health 2>/dev/null | jq . || echo "❌ Application not responding"

# Development commands  
dev: ## Start in development mode with hot reload
	@echo "🔥 Starting development mode..."
	npm run dev

logs: ## View application logs
	@echo "📋 Application logs:"
	docker-compose logs -f backend

restart: ## Quick restart
	@echo "🔄 Restarting..."
	docker-compose restart

clean: ## Clean everything and start fresh
	@echo "🧹 Cleaning up..."
	docker-compose down -v
	docker system prune -f
	@echo "✅ Cleaned. Use 'make up' to start fresh"

# Database commands
db: ## Connect to PostgreSQL database
	@echo "🗄️  Connecting to database..."
	docker-compose exec db psql -U postgres -d vehicles_db

db-reset: ## Reset database (WARNING: deletes all data)
	@echo "⚠️  WARNING: This will delete ALL data!"
	@read -p "Are you sure? (y/N): " confirm; \
	if [ "$$confirm" = "y" ] || [ "$$confirm" = "Y" ]; then \
		docker-compose down db; \
		docker volume rm vehiculos-backend_postgres_data || true; \
		docker-compose up -d db; \
		echo "✅ Database reset"; \
	else \
		echo "❌ Cancelled"; \
	fi
