# Backend Vehículos

Backend para aplicación de gestión interna de la flota.

## Features

- User management (create, read, update, delete users).
- Vehicle tracking for maintance and reservation.
- Document storage for vehicles and users.
- Authentication and authorization with Entra ID.

## Technologies

### Backend

- **[Node.js](https://nodejs.org/)**: JavaScript runtime for server-side development. This is the core of the backend.
- **[Express](https://expressjs.com/)**: Web framework for Node.js. It provides a set of features like routing, middleware, and error handling.
- **[PostgreSQL](https://www.postgresql.org/)**: Open-source relational database. It is used to store the application data.
- **[TypeScript](https://www.typescriptlang.org/)**: Typed JavaScript superset. It is used to write the backend code.
- **TBD - [TypeORM](https://typeorm.io/)**: ORM for TypeScript and JavaScript. It is used to interact with the PostgreSQL database and map the entities to database tables.
- **TBD - [Passport.js](http://www.passportjs.org/)**: Authentication middleware for Node.js. It is used to authenticate users with Entra ID.

### Frontend

- **[React](https://reactjs.org/)**: JavaScript library for building user interfaces. Used for the web version of the application.
- **[React Native](https://reactnative.dev/)**: JavaScript framework for building native mobile applications. For the mobile version of the application.
- **[Expo](https://expo.dev/)**: Framework and platform for universal React applications. It is used to build the mobile application.
- **TBD - [Material-UI](https://material-ui.com/)**: React components that implement Google's Material Design. It is used for the web application's UI.

## Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) (v16 or later)
- [PostgreSQL](https://www.postgresql.org/) (v12 or later)
- [npm](https://www.npmjs.com/)

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/acacoop/vehiculos-backend.git
   cd vehiculos-backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up the environment variables:
   Create a `.env` file in the root directory and provide the following variables:

   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_NAME=vehicles_db
   PORT=3000
   ```

4. Initialize the database:
   Create and configure the PostgreSQL database schema (SQL scripts or migrations).

   ```bash
    psql -U your_db_user -d vehicles_db -a -f db/schema.sql
    ```

    There is a sample data file that can be loaded into the database:

    ```bash
    psql -U your_db_user -d vehicles_db -a -f db/sample_data.sql
    ```

5. Compile the TypeScript code:

   ```bash
   npm run build
   ```

## Development

During development, use the following command to start the application with hot-reloading:

```bash
npm run dev
```

Also, you can create a vscode tunnel to the backend server in order to debug the application in mobile when the LAN is not available. In order to do that, go to the `ports` tab and click on the `Forward a Port` button. Then, select the port (port 3000 in this case) and click on the `Forward` button. The tunnel will require GitHub authentication. After that, set it to public and copy the URL. Finally, replace the `localhost` with the copied URL in the mobile application.

## Production

1. Build the project:

   ```bash
   npm run build
   ```

2. Start the server:

   ```bash
   npm start
   ```

## Project Structure

```plaintext
vehiculos-backend/
├── src/
│   ├── interfaces/    # TypeScript interfaces
│   ├── routes/        # Express routes
│   ├── services/      # Business logic and data access
│   ├── db.ts          # Database connection
│   └── index.ts       # Entry point
├── dist/              # Compiled JavaScript files
├── .env               # Environment variables
├── package.json       # Project metadata and scripts
└── tsconfig.json      # TypeScript configuration
```
