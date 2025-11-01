# Auto-Generated CRUD + RBAC Platform - API Documentation

## Table of Contents
1. [Authentication](#authentication)
2. [Model Definitions API](#model-definitions-api)
3. [Dynamic Data API](#dynamic-data-api)
4. [User Management API](#user-management-api)
5. [Error Responses](#error-responses)
6. [RBAC Rules](#rbac-rules)

---

## Authentication

All API endpoints (except login) require authentication via JWT token.

### Authentication Methods

**1. Cookie-based (Recommended for browser)**
- Token is automatically sent via `auth_token` cookie
- Set by the server after successful login

**2. Bearer Token (Recommended for API clients)**
```http
Authorization: Bearer <your-jwt-token>
```

### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "admin123"
}
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "1",
    "email": "admin@example.com",
    "name": "Admin User",
    "role": "Admin"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Response (401 Unauthorized):**
```json
{
  "error": "Invalid credentials"
}
```

### Get Current User

```http
GET /api/auth/me
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "1",
    "email": "admin@example.com",
    "name": "Admin User",
    "role": "Admin"
  }
}
```

### Logout

```http
POST /api/auth/logout
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

---

## Model Definitions API

Manage data model schemas that define the structure of your dynamic entities.

### List All Models

```http
GET /api/model-definitions
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "1",
      "name": "Product",
      "fields": [
        {
          "name": "name",
          "type": "string",
          "required": true
        },
        {
          "name": "price",
          "type": "number",
          "required": true
        }
      ],
      "ownerField": "ownerId",
      "permissions": {
        "create": ["Admin", "Manager"],
        "read": ["Admin", "Manager", "Viewer"],
        "update": ["Admin", "Manager"],
        "delete": ["Admin"]
      },
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

### Get Single Model

```http
GET /api/model-definitions/:id
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "data": {
    "id": "1",
    "name": "Product",
    "fields": [...],
    "ownerField": "ownerId",
    "permissions": {...}
  }
}
```

### Create Model

```http
POST /api/model-definitions
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Product",
  "fields": [
    {
      "name": "name",
      "type": "string",
      "validation": {
        "required": true,
        "minLength": 3,
        "maxLength": 100
      },
      "label": "Product Name"
    },
    {
      "name": "price",
      "type": "number",
      "validation": {
        "required": true,
        "min": 0
      },
      "label": "Price"
    },
    {
      "name": "inStock",
      "type": "boolean",
      "label": "In Stock"
    },
    {
      "name": "email",
      "type": "email",
      "label": "Contact Email"
    },
    {
      "name": "website",
      "type": "url",
      "label": "Website"
    },
    {
      "name": "releaseDate",
      "type": "date",
      "label": "Release Date"
    }
  ],
  "ownerField": "ownerId",
  "permissions": {
    "create": ["Admin", "Manager"],
    "read": ["Admin", "Manager", "Viewer"],
    "update": ["Admin", "Manager"],
    "delete": ["Admin"]
  }
}
```

**Field Types:**
- `string`: Text values
- `number`: Numeric values (integer or decimal)
- `boolean`: True/false values
- `date`: Date values (ISO 8601 format)
- `email`: Email address with validation
- `url`: URL with validation

**Validation Options:**
- `required`: Field must have a value
- `min`/`max`: For numbers (value range)
- `minLength`/`maxLength`: For strings (character count)
- `pattern`: Regular expression for string validation

**Response (201 Created):**
```json
{
  "data": {
    "id": "1",
    "name": "Product",
    "fields": [...],
    "permissions": {...},
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

### Update Model

```http
PUT /api/model-definitions/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Product",
  "fields": [...],
  "permissions": {...}
}
```

**Response (200 OK):**
```json
{
  "data": {
    "id": "1",
    "name": "Product",
    "fields": [...],
    "updatedAt": "2025-01-02T00:00:00.000Z"
  }
}
```

### Delete Model

```http
DELETE /api/model-definitions/:id
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "message": "Model deleted successfully"
}
```

---

## Dynamic Data API

Once a model is created, CRUD endpoints are automatically available for that model.

### List Records

```http
GET /api/data/:modelName
Authorization: Bearer <token>
```

**Query Parameters:**
- None currently (future: pagination, filtering, sorting)

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "1",
      "name": "iPhone 15",
      "price": 999,
      "inStock": true,
      "ownerId": "user-123",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

**RBAC Filtering:**
- Admins see all records
- Non-admins only see records they own (if `ownerField` is defined)
- Requires `read` permission in model

### Get Single Record

```http
GET /api/data/:modelName/:id
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "data": {
    "id": "1",
    "name": "iPhone 15",
    "price": 999,
    "inStock": true
  }
}
```

**Error (403 Forbidden):**
```json
{
  "error": "Permission denied"
}
```

### Create Record

```http
POST /api/data/:modelName
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "iPhone 15",
  "price": 999,
  "inStock": true,
  "email": "contact@apple.com",
  "website": "https://apple.com",
  "releaseDate": "2025-09-15"
}
```

**Response (201 Created):**
```json
{
  "record": {
    "id": "1",
    "name": "iPhone 15",
    "price": 999,
    "inStock": true,
    "ownerId": "user-123",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

**Error (400 Bad Request):**
```json
{
  "error": "Validation failed",
  "errors": {
    "name": "name is required",
    "price": "price must be a number"
  }
}
```

### Update Record

```http
PUT /api/data/:modelName/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "iPhone 15 Pro",
  "price": 1099,
  "inStock": false
}
```

**Response (200 OK):**
```json
{
  "record": {
    "id": "1",
    "name": "iPhone 15 Pro",
    "price": 1099,
    "inStock": false,
    "updatedAt": "2025-01-02T00:00:00.000Z"
  }
}
```

**Error (403 Forbidden):**
```json
{
  "error": "Permission denied"
}
```

### Delete Record

```http
DELETE /api/data/:modelName/:id
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "message": "Record deleted successfully"
}
```

**Error (403 Forbidden):**
```json
{
  "error": "Permission denied"
}
```

---

## User Management API

Manage user accounts and roles.

### List Users

```http
GET /api/users
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "1",
      "email": "admin@example.com",
      "name": "Admin User",
      "role": "Admin",
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

### Get User

```http
GET /api/users/:id
Authorization: Bearer <token>
```

### Create User

```http
POST /api/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "newuser@example.com",
  "name": "New User",
  "password": "secure-password",
  "role": "Viewer"
}
```

### Update User

```http
PUT /api/users/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name",
  "role": "Manager"
}
```

### Delete User

```http
DELETE /api/users/:id
Authorization: Bearer <token>
```

---

## Error Responses

### Standard Error Format

```json
{
  "error": "Error message here"
}
```

### Common HTTP Status Codes

| Code | Meaning | When It Occurs |
|------|---------|----------------|
| 200 | OK | Successful GET, PUT, DELETE |
| 201 | Created | Successful POST |
| 400 | Bad Request | Validation errors, malformed JSON |
| 401 | Unauthorized | Missing or invalid auth token |
| 403 | Forbidden | RBAC permission denied |
| 404 | Not Found | Model or record doesn't exist |
| 500 | Internal Server Error | Server-side errors |

---

## RBAC Rules

### Role Hierarchy

```
Admin > Manager > Viewer
```

- **Admin**: Full access to all operations and all records
- **Manager**: Can create, read, and update records they own
- **Viewer**: Can only read records they own

### Permission Configuration

Permissions are defined per model:

```json
{
  "permissions": {
    "create": ["Admin", "Manager"],
    "read": ["Admin", "Manager", "Viewer"],
    "update": ["Admin", "Manager"],
    "delete": ["Admin"]
  }
}
```

### Ownership Rules

If a model defines an `ownerField`:
- Records automatically get `ownerId` set to the creator's user ID
- Non-admin users can only access their own records
- Admins can access all records regardless of ownership

### Default Behavior

If no permissions are specified:
- Only Admins can perform the action (secure by default)

---

## Example Workflows

### Creating a Complete Model and Adding Data

1. **Login**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

2. **Create Model Definition**
```bash
curl -X POST http://localhost:3000/api/model-definitions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{
    "name": "Product",
    "fields": [
      {"name": "name", "type": "string", "validation": {"required": true}},
      {"name": "price", "type": "number", "validation": {"required": true, "min": 0}}
    ],
    "permissions": {
      "create": ["Admin", "Manager"],
      "read": ["Admin", "Manager", "Viewer"],
      "update": ["Admin"],
      "delete": ["Admin"]
    }
  }'
```

3. **Create Data Record**
```bash
curl -X POST http://localhost:3000/api/data/Product \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{"name": "iPhone 15", "price": 999}'
```

4. **List All Products**
```bash
curl -X GET http://localhost:3000/api/data/Product \
  -H "Authorization: Bearer <your-token>"
```

---

## Rate Limiting

Currently no rate limiting is implemented. In production, consider adding:
- Rate limiting per IP/user
- Request throttling for expensive operations
- API key management for external integrations

---

## Versioning

API Version: `v1` (implicit)

Future versions will be prefixed: `/api/v2/...`

---

## Support

For issues or questions:
- Check the README.md for setup instructions
- Review the ARCHITECTURE.md for system design
- Check test files for usage examples
