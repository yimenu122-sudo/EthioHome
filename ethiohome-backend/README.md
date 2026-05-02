# EthioHome Backend

EthioHome is a modern digital house rent and sale brokering system for Ethiopian cities.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL (with Sequelize ORM)
- **Authentication**: JWT & Role-Based Access Control (RBAC)
- **Real-time**: Socket.io
- **File Upload**: Multer

## Getting Started

1.  **Clone the repository**
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Setup Environment Variables**:
    - Copy `.env.example` to `.env` (or use provided `.env`)
    - Update database credentials
4.  **Run Migrations** (if applicable):
    ```bash
    npx sequelize-cli db:migrate
    ```
5.  **Start Server**:
    - Development: `npm run dev`
    - Production: `npm start`

## Project Structure

- `src/config`: Configuration files (DB, Environment, Roles, JWT)
- `src/controllers`: Request handlers
- `src/services`: Business logic
- `src/models`: Database models
- `src/routes`: API routes
- `src/middlewares`: Custom middlewares (Auth, Error, Roles)
- `src/utils`: Helper functions
- `src/i18n`: Internationalization files
- `src/sockets`: Real-time socket handlers

## API API Endpoints

(Document API endpoints here)
