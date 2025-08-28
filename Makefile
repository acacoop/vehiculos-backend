# Vehiculos Backend - Development Makefile

.PHONY: help setup up down logs db restart clean dev dev-stop docs health sample-data sync-users sync-users-verbose db-reset

# Helper function to wait for database
define wait_for_db
	@echo "⏳ Waiting for SQL Server..."
	@for i in 1 2 3 4 5 6 7 8 9 10 11 12; do \
		if docker compose exec -T db /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "$$MSSQL_SA_PASSWORD" -Q "SELECT 1" >/dev/null 2>&1; then \
			echo "✅ Database ready!"; \
			break; \
		else \
			printf "   ."; \
			sleep 3; \
		fi; \
		if [ $$i -eq 12 ]; then \
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

sample-data: ## Load DEV sample data (db/sample_data.sql) - destructive (clears tables first)
	@read -p "Load DEV sample data? This will DELETE existing data in these tables. Continue? (y/N): " confirm; \
	if [ "$$confirm" = "y" ] || [ "$$confirm" = "Y" ]; then \
		MSSQL_SA_PASSWORD=$${MSSQL_SA_PASSWORD:-Your_password123} cat db/sample_data.sql | docker compose exec -T db /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "$$MSSQL_SA_PASSWORD" -d vehicles_db && echo "✅ Sample data loaded"; \
	else \
		echo "❌ Cancelled"; \
	fi

docs: ## Open API documentation
	@command -v open >/dev/null 2>&1 && open http://localhost:3000/docs || \
	 command -v xdg-open >/dev/null 2>&1 && xdg-open http://localhost:3000/docs || \
	 echo "📖 Open: http://localhost:3000/docs"

health: ## Check application status
	@curl -f http://localhost:3000/health 2>/dev/null | jq . || echo "❌ Not responding"

setup: ## Initial setup (install deps, start services; use 'make sample-data' for dev dataset)
	@echo "🏗️  Initial setup..."
	@npm install >/dev/null 2>&1 && echo "✅ Dependencies installed"
	@docker compose up -d >/dev/null 2>&1 && echo "✅ Services started"
	$(call wait_for_db)
	@echo "🎉 Ready! API: http://localhost:3000 | Docs: http://localhost:3000/docs"
	@echo "👉 Run 'make sample-data' to load development sample data (destructive)."

dev: ## Development mode (starts DB, runs API locally with hot reload & ORM sync)
	@echo "🚀 Starting development environment (SQL Server)..."
	@docker compose up -d db >/dev/null 2>&1 && echo "✅ Database starting"
	$(call wait_for_db)
	@if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then echo "⚠️  Port 3000 in use!"; exit 1; fi
	@echo "🔄 Starting with hot reload..."
	@DB_PORT=1433 DB_USER=sa DB_PASSWORD=$${MSSQL_SA_PASSWORD:-Your_password123} npm run dev

dev-stop: ## Stop development environment
	@docker compose down >/dev/null 2>&1 && echo "✅ Development stopped"

logs: ## View application logs
	docker compose logs -f backend

restart: ## Quick restart
	docker compose restart

clean: ## Clean everything and start fresh
	docker compose down -v
	docker system prune -f

db: ## Open interactive SQLCMD session
	MSSQL_SA_PASSWORD=$${MSSQL_SA_PASSWORD:-Your_password123} docker compose exec db /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "$$MSSQL_SA_PASSWORD" -d master

db-reset: ## Reset SQL Server data volume
	@read -p "Delete ALL database data? (y/N): " confirm; \
	if [ "$$confirm" = "y" ] || [ "$$confirm" = "Y" ]; then \
		docker compose down db; \
		docker volume rm vehiculos-backend_mssql_data || true; \
		docker compose up -d db; \
		$(call wait_for_db); \
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
