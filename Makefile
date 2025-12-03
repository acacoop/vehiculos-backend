## Simplified Makefile (core workflows only)
## Targets: up, down, dev, sample-data, sync, test
## Automatically loads .env into the environment and suppresses noisy recursive make messages.

MAKEFLAGS += --no-print-directory

# Auto-load .env (simple parser: KEY=VALUE lines). Values become exported for all recipes.
ifneq (,$(wildcard .env))
include .env
export $(shell sed -nE 's/^([A-Za-z_][A-Za-z0-9_]*)=.*/\1/p' .env)
endif

.PHONY: up down dev sample-data sync test clean migration-generate migration-run migration-revert prepare-webjobs generate-quarterly-controls help

WAIT_RETRIES?=5
MSSQL_SA_PASSWORD?=$(or $(DB_PASSWORD),Your_password123)
# Host override used when running Node on the host (not inside backend container)
HOST_DB_HOST?=localhost

wait-db:
	@echo "Waiting for DB"; \
	i=0; \
	while [ $$i -lt $(WAIT_RETRIES) ]; do \
		# Prevent Git Bash (/msys) from converting /opt/... into a Windows path. \
		# MSYS_NO_PATHCONV=1 avoids automatic path conversion for this command. \
		if MSYS_NO_PATHCONV=1 docker compose exec -T db /opt/mssql-tools18/bin/sqlcmd -C -S localhost -U sa -P "$(MSSQL_SA_PASSWORD)" -Q "SELECT 1" >/dev/null 2>&1; then \
			echo "DB ready"; \
			MSYS_NO_PATHCONV=1 docker compose exec -T db /opt/mssql-tools18/bin/sqlcmd -C -S localhost -U sa -P "$(MSSQL_SA_PASSWORD)" -Q "IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = '$(DB_NAME)') BEGIN CREATE DATABASE [$(DB_NAME)]; END"; \
			exit 0; \
		fi; \
		sleep 2; i=$$((i+1)); \
		echo -n "."; \
	done; \
	echo ""; \
	echo "ERROR: Database not ready after $$(echo $$(($(WAIT_RETRIES)*2))) seconds"; \
	exit 1;

up:
	@docker compose up -d --build
	@$(MAKE) wait-db
	@echo "API: http://localhost:3000  Docs: /docs"

down:
	@docker compose down

dev:
	@docker compose up -d db
	@$(MAKE) wait-db
	@npm ci
	@DB_HOST=$(HOST_DB_HOST) npm run dev

sample-data:
	@read -p "Load sample data (destructive)? (y/N): " c; \
	[ "$$c" = "y" -o "$$c" = "Y" ] || { echo "Cancelled"; exit 0; }; \
# 	npm ci; \
	$(MAKE) wait-db; \
	DB_HOST=$(HOST_DB_HOST) npm run sample-data && echo "Sample data loaded"

sync:
	@$(MAKE) wait-db
# 	@npm ci
	@if [ -n "$(ADMIN)" ]; then \
		DB_HOST=$(HOST_DB_HOST) npm run sync:users -- $(ADMIN); \
	else \
		DB_HOST=$(HOST_DB_HOST) npm run sync:users; \
	fi

generate-quarterly-controls:
	@$(MAKE) wait-db
	@DB_HOST=$(HOST_DB_HOST) npm run generate-quarterly-controls

test:
	@npm test

migration-generate:
	@echo "Generating migration..."; \
	$(MAKE) wait-db; \
	NAME=$(filter-out $@,$(MAKECMDGOALS)) DB_HOST=$(HOST_DB_HOST) npm run migration:generate

migration-run:
	@echo "Running migrations..."; \
	$(MAKE) wait-db; \
	DB_HOST=$(HOST_DB_HOST) npm run migration:run

migration-revert:
	@echo "Reverting last migration..."; \
	$(MAKE) wait-db; \
	DB_HOST=$(HOST_DB_HOST) npm run migration:revert

reset-db:
	@echo "Stopping containers and removing volumes..."
	@docker compose down -v
	@echo "Starting fresh database..."
	@docker compose up -d db
	@$(MAKE) wait-db
	@echo "Database reset complete. You can now run 'make migration-run' to apply migrations."

clean:
	@echo "Cleaning dist/, node_modules/, Docker artifacts..."
	@rm -rf dist
	@rm -rf node_modules
	@docker image prune -f >/dev/null 2>&1 || true
	@echo "Done. Run 'npm ci' to reinstall dependencies."

prepare-webjobs:
	@echo "Preparing WebJobs for deployment..."
	@mkdir -p webjobs-deploy
	@cp webjobs/quarterly-controls/run.sh webjobs-deploy/quarterly-controls.sh
	@cp webjobs/sync-entra-users/run.sh webjobs-deploy/sync-entra-users.sh
	@chmod +x webjobs-deploy/*.sh
	@echo "WebJobs prepared in webjobs-deploy/ directory"
	@echo "  - quarterly-controls.sh"
	@echo "  - sync-entra-users.sh"

help:
	@echo "Available targets:"; \
	echo "  up                       		Build and start containers (API + DB)"; \
	echo "  down                     		Stop and remove containers"; \
	echo "  dev                      		Start local dev (DB in docker, API on host)"; \
	echo "  sample-data              		Load sample data using TypeORM (destructive)"; \
	echo "  sync                     		Run Entra users sync script (set admin: make sync ADMIN=admin@domain.com)"; \
	echo "  generate-quarterly-controls		Generate quarterly controls for all vehicles"; \
	echo "  test                     		Run automated tests"; \
	echo "  migration-generate NAME  		Generate new migration from entity changes"; \
	echo "  migration-run           		Apply pending migrations to database"; \
	echo "  migration-revert        		Revert last applied migration"; \
	echo "  reset-db                 		Stop containers, remove volumes (DB data), and restart DB"; \
	echo "  prepare-webjobs         		Package WebJobs into .sh files in webjobs-deploy/"; \
	echo "  clean                   		Remove build artifacts and prune dangling images"; \
	echo "  help                    		Show this help message";