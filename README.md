# Backend Vehículos

Backend para aplicación de gestión interna de la flota.

## Base de datos

Conectado a una base de datos PostgreSQL.

Para correr la base de datos en un contenedor de Docker, ejecutar el siguiente comando:

CHEQUEAR

```bash
docker run --name vehiculos-db -e POSTGRES_PASSWORD=vehiculos -e POSTGRES_DB=vehiculos -p 5432:5432 -d postgres
```

Luego para conectarse a la base de datos, ejecutar el siguiente comando:

```bash
docker exec -it vehiculos-db psql -U postgres
```

Para crear la base de datos, ejecutar el siguiente comando:

```sql
CREATE DATABASE vehicles;
```

Luego para levantar el esquema de la base de datos, ejecutar el siguiente comando:

```bash
psql -h localhost -U postgres -d vehicles -a -f ./db/schema.sql
```

Hay un script que carga datos de prueba en la base de datos, ejecutar el siguiente comando:

```bash
psql -h localhost -U postgres -d vehicles -a -f ./db/sample_data.sql
```

Para hacer queries a la base de datos, ejecutar el siguiente comando:

```bash
psql -h localhost -U postgres -d vehicles

SELECT * FROM vehicles;
...
```

O podemos pasarle un archivo con queries SQL:

```bash
psql -h localhost -U postgres -d vehicles -a -f ./db/query.sql
```

Si queremos conectarnos a la base de datos con un cliente gráfico, podemos usar DBeaver.
