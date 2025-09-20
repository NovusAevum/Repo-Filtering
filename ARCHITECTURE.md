# System Architecture

## Overview
This document outlines the architecture of the Replit Production Finder application, which consists of a React frontend and a Flask backend.

## Frontend Architecture

### Tech Stack
- **Framework**: React 18 with TypeScript
- **UI Library**: Material-UI v5
- **State Management**: React Context API + useReducer
- **Build Tool**: Vite
- **Testing**: Jest + React Testing Library

### Key Components
1. **App** - Root component that manages global state
2. **SearchInterface** - Handles search inputs and filters
3. **RepositoryList** - Displays search results
4. **RepositoryDetailsModal** - Shows detailed repository information
5. **DashboardCharts** - Visualizes repository statistics
6. **ProgressTracker** - Shows search/processing progress
7. **NotificationSystem** - Handles user notifications

## Backend Architecture

### Tech Stack
- **Framework**: Flask
- **Database**: SQLite (with SQLAlchemy ORM)
- **Async Support**: asyncio + aiohttp
- **Authentication**: JWT (to be implemented)

### API Endpoints
- `GET /api/repositories` - List all repositories
- `POST /api/search` - Start a new search
- `GET /api/search/{id}/status` - Get search status
- `WS /ws` - WebSocket for real-time updates

### Data Flow
1. User initiates search from frontend
2. Frontend sends request to `/api/search`
3. Backend starts async search process
4. Progress updates sent via WebSocket
5. Results stored in SQLite database
6. Frontend displays results in real-time

## Development Setup
1. Frontend: `npm install && npm run dev`
2. Backend: `python app.py`
3. Access at: http://localhost:3000

## Deployment
- Frontend: Vercel/Netlify
- Backend: AWS ECS/Heroku
- Database: AWS RDS/PostgreSQL (production)
