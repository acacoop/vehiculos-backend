## Simplified Makefile (core workflows only)
## Targets: up, down, dev, sample-data, sync, sync-verbose

.PHONY: up down dev sample-data sync sync-verbose

WAIT_RETRIES?=40
MSSQL_SA_PASSWORD?=Your_password123

wait-db:
	@echo "Waiting for DB (max $(WAIT_RETRIES) attempts)..."; \
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
	@DB_HOST=localhost DB_PORT=1433 DB_USER=sa DB_PASSWORD=$(MSSQL_SA_PASSWORD) npm run dev

sample-data:
	@read -p "Load sample data (destructive)? (y/N): " c; \
	[ "$$c" = "y" -o "$$c" = "Y" ] || { echo "Cancelled"; exit 0; }; \
	cat db/sample_data.sql | docker compose exec -T db /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "$(MSSQL_SA_PASSWORD)" -d vehicles_db && echo "Sample data loaded"

sync:
	@$(MAKE) wait-db
	@npm run --silent sync:users

sync-verbose:
	@$(MAKE) wait-db
	@VERBOSE=1 npm run --silent sync:users
