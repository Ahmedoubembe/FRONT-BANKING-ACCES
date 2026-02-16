# Banking Requests App

A minimal Angular 20 standalone application for displaying banking requests.

## Features

- Displays a list of banking requests from backend API
- Minimalist white design
- Standalone component architecture
- Error handling for API failures

## Prerequisites

- Node.js (v18 or higher)
- Angular CLI (v20 or higher)
- Backend Spring Boot server running on http://localhost:8077

## Installation

```bash
npm install
```

## Development Server

```bash
npm start
```

Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Build

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

## API Configuration

The application connects to the Spring Boot backend at:
`http://localhost:8077/banking_access/api/banking-requests/all`

Ensure the backend server is running before starting the frontend application.

## Project Structure

- `src/app/models/` - TypeScript interfaces matching backend entities
- `src/app/services/` - HTTP services for API communication
- `src/app/app.component.*` - Main standalone component
- `src/app/app.config.ts` - Application configuration with HttpClient provider
