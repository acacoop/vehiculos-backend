## Simplified Makefile (core workflows only)
## Targets: up, down, dev, sample-data, sync, sync-verbose
## Automatically loads .env into the environment and suppresses noisy recursive make messages.

MAKEFLAGS += --no-print-directory

# Auto-load .env (simple parser: KEY=VALUE lines). Values become exported for all recipes.
ifneq (,$(wildcard .env))
include .env
export $(shell sed -nE 's/^([A-Za-z_][A-Za-z0-9_]*)=.*/\1/p' .env)
endif

.PHONY: up down dev sample-data sync sync-verbose clean help

WAIT_RETRIES?=5
MSSQL_SA_PASSWORD?=Your_password123
# Host override used when running Node on the host (not inside backend container)
HOST_DB_HOST?=localhost

wait-db:
	@echo "Waiting for DB"; \
	i=0; \
	while [ $$i -lt $(WAIT_RETRIES) ]; do \
		if docker compose exec -T db /opt/mssql-tools18/bin/sqlcmd -C -S localhost -U sa -P "$(MSSQL_SA_PASSWORD)" -Q "SELECT 1" >/dev/null 2>&1; then \
			echo "DB ready"; exit 0; \
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
	npm ci; \
	$(MAKE) wait-db; \
	DB_HOST=$(HOST_DB_HOST) npm run sample-data && echo "Sample data loaded"

sync:
	@$(MAKE) wait-db
	@npm ci
	@DB_HOST=$(HOST_DB_HOST) npm run --silent sync:users

sync-verbose:
	@$(MAKE) wait-db
	@npm ci
	@DB_HOST=$(HOST_DB_HOST) VERBOSE=1 npm run --silent sync:users

clean:
	@echo "Cleaning dist/, node_modules/, Docker artifacts..."
	@rm -rf dist
	@rm -rf node_modules
	@docker image prune -f >/dev/null 2>&1 || true
	@echo "Done. Run 'npm ci' to reinstall dependencies."

help:
	@echo "Available targets:"; \
	echo "  up              Build and start containers (API + DB)"; \
	echo "  down            Stop and remove containers"; \
	echo "  dev             Start local dev (DB in docker, API on host)"; \
	echo "  sample-data     Load sample data using TypeORM (destructive)"; \
	echo "  sync            Run Entra users sync script"; \
	echo "  sync-verbose    Run sync with VERBOSE=1"; \
	echo "  clean           Remove build artifacts and prune dangling images"; \
	echo "  help            Show this help message";
