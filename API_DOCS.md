# API Documentation

## Base URL
`http://localhost:5000/api`

## Authentication
All endpoints require authentication via JWT token in the `Authorization` header:
```
Authorization: Bearer <token>
```

## Endpoints

### 1. Authentication

#### `POST /api/auth/login`
Authenticate and get JWT token.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "access_token": "string",
  "token_type": "bearer"
}
```

### 2. Repositories

#### `GET /api/repositories`
Get paginated list of repositories.

**Query Parameters:**
- `page` (number, optional, default: 1)
- `per_page` (number, optional, default: 20)
- `sort` (string, optional, default: "-last_updated")
- `query` (string, optional) - Search query

**Response:**
```json
{
  "items": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "url": "string",
      "stars": 0,
      "forks": 0,
      "language": "string",
      "last_updated": "2023-01-01T00:00:00Z"
    }
  ],
  "total": 0,
  "page": 1,
  "per_page": 20
}
```

### 3. Search

#### `POST /api/search`
Start a new search.

**Request Body:**
```json
{
  "query": "string",
  "source": "github" | "replit",
  "filters": {
    "min_stars": 0,
    "language": "string",
    "min_score": 0
  }
}
```

**Response:**
```json
{
  "search_id": "string",
  "status": "pending" | "in_progress" | "completed" | "failed",
  "progress": 0,
  "message": "string"
}
```

### 4. Search Status

#### `GET /api/search/{search_id}/status`
Get search status and results.

**Response:**
```json
{
  "search_id": "string",
  "status": "string",
  "progress": 0,
  "message": "string",
  "results": [
    {
      "id": "string",
      "name": "string",
      "url": "string",
      "score": 0,
      "metadata": {}
    }
  ],
  "error": "string"
}
```

### 5. WebSocket

#### `ws://localhost:5000/ws`
WebSocket connection for real-time updates.

**Messages:**
- **Search Progress Update**
```json
{
  "type": "progress_update",
  "search_id": "string",
  "progress": 0,
  "message": "string"
}
```

- **Search Complete**
```json
{
  "type": "search_complete",
  "search_id": "string",
  "result_count": 0
}
```

## Error Responses

### 400 Bad Request
```json
{
  "detail": "Invalid request data"
}
```

### 401 Unauthorized
```json
{
  "detail": "Not authenticated"
}
```

### 404 Not Found
```json
{
  "detail": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Internal server error"
}
```
