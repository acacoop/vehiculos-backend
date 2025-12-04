# 🚗 Vehiculos Backend

Vehicle fleet management API built with Node.js, Express, TypeScript, TypeORM and Microsoft SQL Server.

## Quick Start

```bash
make up            # Start app + DB (no data)
make sample-data   # (DEV ONLY) Load sample dataset (destructive)
make test          # Run automated tests
make docs          # Open API documentation
make dev           # Run locally with hot reload (uses existing DB container)
make migration-run # Apply database migrations
```

**URLs**: [API](http://localhost:3000) • [Docs](http://localhost:3000/docs) • [Health](http://localhost:3000/health)

## Database Maintenance

The application uses TypeORM migrations for safe database schema management.

### Development Workflow

```bash
make migration-generate NAME=<YourMigrationName>  # Create new migration after entity changes
make migration-run                          # Apply migrations (dev/staging)
```

### Production Deployment

```bash
make migration-run                          # Apply pending migrations
make migration-revert                       # Rollback if needed (CAUTION!)
```

### Important Notes

- **Never modify migration files** after they've been applied to production
- **Test migrations** in staging environment first
- **Keep migrations** in version control
- Migrations run in order, maintaining proper sequencing

## Commands

**See all available commands**: `make help`

Key features: TypeScript, TypeORM, SQL Server, structured validation, security middleware, Dockerized, comprehensive optional dev dataset, **database migrations**.

### Database Commands

- `make migration-generate NAME=YourMigrationName` - Generate migration from entity changes
- `make migration-run` - Apply pending migrations
- `make migration-revert` - Revert last migration (use with caution)
