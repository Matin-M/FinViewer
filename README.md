# Project Setup

The backend and db have been containerized to simplify networking and dependency installation, and orchestration is done using docker-compose.

## Environment Configuration

1. **Frontend Environment Variables:**

   Create a `.env` file in the `frontend` directory. This file should contain the following environment variable:

   ```plaintext
   REACT_APP_API_URL=http://localhost:5000/api
   ```

   This variable sets the base URL for the API that the frontend will communicate with.

## Backend Setup

1. **Build and Start the Backend and Database:**

   Navigate to the root directory of the project where the `docker-compose.yml` file is located. Run the following command to build and start the backend and database services:

   ```bash
   docker-compose up --build
   ```

   This command will build the Docker images for the backend and database services and start them. The backend service will be available on port 5000.

2. **Database Migrations:**

   The backend service uses Flask-Migrate for database migrations. Ensure that the database is up-to-date with the latest migrations. This should be handled automatically by the Docker setup, but if needed, you can manually run:

   ```bash
   docker-compose exec backend flask db upgrade
   ```

   Running Migrations:
   - create new table definition in models.py
   - flask db migrate -m "Add <tablename>"

## Frontend Setup

1. **Install Dependencies:**

   Navigate to the `frontend` directory and install the necessary npm packages:

   ```bash
   cd frontend
   npm install
   ```

2. **Start the Development Server:**

   After installing the dependencies, start the development server:

   ```bash
   npm start
   ```

   This will start the React development server, and you can view the application in your browser at [http://localhost:3000](http://localhost:3000).

## Additional Information

- The backend is a Flask application that connects to a PostgreSQL database.
- The frontend is a React application created using Create React App.
- The backend API is accessible at `http://localhost:5000/api`.
- Ensure that the `.env` files are correctly set up for both the backend and frontend if there are any environment-specific configurations.


