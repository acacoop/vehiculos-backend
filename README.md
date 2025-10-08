# 🚗 Vehiculos Backend

Vehicle fleet management API built with Node.js, Express, TypeScript, TypeORM and Microsoft SQL Server.

## Quick Start

```bash
make up            # Start app + DB (no data)
make sample-data   # (DEV ONLY) Load sample dataset (destructive)
make docs          # Open API documentation
make dev           # Run locally with hot reload (uses existing DB container)
```

**URLs**: [API](http://localhost:3000) • [Docs](http://localhost:3000/docs) • [Health](http://localhost:3000/health)

## Dev Auth Bypass (Local Only)

For quick local testing without Entra, you can enable a dev-only impersonation mode:

1) In `.env` set:

```
AUTH_BYPASS=true
# optional defaults
AUTH_BYPASS_EMAIL=user@example.com
AUTH_BYPASS_ROLES=Admin,User
```

2) Start the API and open Swagger at http://localhost:3000/docs. Use the headers on any request:
	- `x-dev-impersonate`: email or entraId of a seeded user
	- `x-dev-roles`: comma-separated roles (e.g., `Admin,User`)

3) Or use curl/Postman, e.g.:

```
curl -H "x-dev-impersonate: user@example.com" -H "x-dev-roles: Admin" http://localhost:3000/me
```

Notes:
- Headers are only honored if `AUTH_BYPASS=true`.
- Never enable this in production.

## Commands

**See all available commands**: `make help`

Key features: TypeScript, TypeORM, SQL Server, structured validation, security middleware, Dockerized, comprehensive optional dev dataset.
