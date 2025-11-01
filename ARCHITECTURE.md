# System Architecture Documentation

## Overview

The Auto-Generated CRUD + RBAC Platform is a low-code development platform that enables users to define data models through a web UI and automatically generates CRUD APIs with role-based access control.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Directory Structure](#directory-structure)
4. [Core Components](#core-components)
5. [Data Flow](#data-flow)
6. [Security Architecture](#security-architecture)
7. [Database Schema](#database-schema)
8. [API Layer](#api-layer)
9. [Frontend Architecture](#frontend-architecture)
10. [Design Patterns](#design-patterns)

---

## Architecture Overview

The platform follows a modern **3-tier architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                       │
│  (Next.js Client Components + Server Components)            │
│  - Model Definition UI                                       │
│  - Data Management UI                                        │
│  - Authentication UI                                         │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ HTTP/JSON
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                      Application Layer                       │
│           (Next.js API Routes + Business Logic)             │
│  - Authentication & Authorization                            │
│  - RBAC Enforcement                                          │
│  - Model Validation                                          │
│  - Dynamic Route Generation                                  │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ Drizzle ORM
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                        Data Layer                            │
│              (Turso Database - SQLite)                       │
│  - Users & Sessions                                          │
│  - Model Definitions                                         │
│  - Dynamic Data Tables                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4
- **UI Components**: Shadcn/UI (Radix UI primitives)
- **State Management**: React Context + Hooks
- **Form Handling**: React Hook Form + Zod

### Backend
- **Runtime**: Node.js
- **Framework**: Next.js API Routes
- **Database**: Turso (SQLite-compatible)
- **ORM**: Drizzle ORM
- **Authentication**: JWT (jose library)
- **Password Hashing**: bcryptjs

### Development Tools
- **Language**: TypeScript
- **Testing**: Vitest + React Testing Library
- **Linting**: ESLint
- **Package Manager**: npm/bun

---

## Directory Structure

```
src/
├── app/                          # Next.js App Router
│   ├── admin/                    # Admin interface routes
│   │   ├── models/               # Model definition UI
│   │   │   └── page.tsx
│   │   └── data/                 # Data management UI
│   │       └── page.tsx
│   ├── api/                      # API routes
│   │   ├── auth/                 # Authentication endpoints
│   │   │   ├── login/
│   │   │   ├── logout/
│   │   │   └── me/
│   │   ├── data/                 # Dynamic data CRUD
│   │   │   └── [modelName]/
│   │   │       ├── route.ts      # GET, POST
│   │   │       └── [id]/
│   │   │           └── route.ts  # GET, PUT, DELETE
│   │   ├── model-definitions/    # Model CRUD
│   │   ├── users/                # User management
│   │   └── sessions/             # Session management
│   ├── login/                    # Login page
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing page
│
├── lib/                          # Core business logic
│   ├── auth.ts                   # JWT & authentication
│   ├── rbac.ts                   # RBAC enforcement
│   ├── models.ts                 # Model validation
│   └── dataStore.ts              # Data operations
│
├── db/                           # Database layer
│   ├── index.ts                  # Database client
│   ├── schema.ts                 # Drizzle schema
│   └── seeds/                    # Database seeders
│       ├── users.ts
│       └── model-definitions.ts
│
├── components/                   # Reusable UI components
│   └── ui/                       # Shadcn/UI components
│
├── contexts/                     # React contexts
│   └── AuthContext.tsx           # Auth state management
│
├── hooks/                        # Custom React hooks
│   └── useAuth.ts                # Authentication hook
│
└── __tests__/                    # Test suites
    ├── lib/                      # Unit tests
    │   ├── auth.test.ts
    │   └── rbac.test.ts
    └── api/                      # Integration tests
        └── data.test.ts
```

---

## Core Components

### 1. Authentication System (`src/lib/auth.ts`)

**Responsibilities:**
- JWT token creation and verification
- User session management
- Role-based permission checking
- Cookie-based authentication

**Key Functions:**
- `createToken(user)`: Generate JWT token
- `verifyToken(token)`: Validate and decode token
- `getCurrentUser(request)`: Extract user from request
- `hasPermission(userRole, requiredRole)`: Role hierarchy check

### 2. RBAC System (`src/lib/rbac.ts`)

**Responsibilities:**
- Define and enforce access control rules
- Check action permissions (CRUD operations)
- Validate record ownership

**Key Functions:**
- `canPerformAction(role, action, permissions)`: Check if role can perform action
- `checkOwnership(userId, ownerId, role)`: Validate record ownership

**RBAC Rules:**
```typescript
interface RBACRule {
  create?: UserRole[];  // Who can create records
  read?: UserRole[];    // Who can read records
  update?: UserRole[];  // Who can update records
  delete?: UserRole[];  // Who can delete records
}
```

### 3. Model System (`src/lib/models.ts`)

**Responsibilities:**
- Define data model schemas
- Validate field types and constraints
- Store model definitions in memory/database

**Model Structure:**
```typescript
interface ModelDefinition {
  name: string;                 // Model name (e.g., "Product")
  fields: ModelField[];         // Field definitions
  ownerField?: string;          // Field for ownership tracking
  permissions: RBACRule;        // RBAC rules
  createdAt: string;
  updatedAt: string;
}
```

**Field Types:**
- `string`, `number`, `boolean`, `date`, `email`, `url`

**Validation Rules:**
- Required fields
- Min/max values
- String length constraints
- Regex patterns
- Type-specific validation

### 4. Dynamic Data Store (`src/lib/dataStore.ts`)

**Responsibilities:**
- CRUD operations on dynamic data
- In-memory storage (development)
- Generate unique IDs
- Timestamp management

---

## Data Flow

### Creating a Model

```
┌──────────┐         ┌─────────────┐         ┌──────────┐         ┌──────────┐
│  Admin   │────────▶│   Model     │────────▶│   API    │────────▶│ Database │
│   UI     │ Submit  │   Form      │  POST   │  Route   │  Insert │          │
└──────────┘         └─────────────┘         └──────────┘         └──────────┘
                                                   │
                                                   ▼
                                            ┌──────────────┐
                                            │  Validation  │
                                            │  & RBAC      │
                                            └──────────────┘
```

1. Admin submits model definition through UI
2. Form validates client-side (required fields, format)
3. POST request to `/api/model-definitions`
4. Server validates permissions (must be Admin)
5. Server validates model schema
6. Model saved to database
7. Model becomes available for data operations

### Creating Data Records

```
┌──────────┐         ┌─────────────┐         ┌──────────────┐
│   User   │────────▶│    Data     │────────▶│     RBAC     │
│          │  Submit │    Form     │  POST   │    Check     │
└──────────┘         └─────────────┘         └──────────────┘
                                                      │
                                             ┌────────▼────────┐
                                             │  Has 'create'   │
                                             │  permission?    │
                                             └────────┬────────┘
                                                      │
                                              ┌───────▼───────┐
                                              │   Validate    │
                                              │   Against     │
                                              │   Model       │
                                              └───────┬───────┘
                                                      │
                                              ┌───────▼───────┐
                                              │   Set Owner   │
                                              │   Field       │
                                              └───────┬───────┘
                                                      │
                                              ┌───────▼───────┐
                                              │   Save to     │
                                              │   Database    │
                                              └───────────────┘
```

### Reading Data (with Ownership Filtering)

```
┌──────────┐         ┌─────────────┐         ┌──────────────┐
│   User   │────────▶│   API       │────────▶│     RBAC     │
│          │   GET   │   Route     │         │    Check     │
└──────────┘         └─────────────┘         └──────────────┘
                                                      │
                                             ┌────────▼────────┐
                                             │  Has 'read'     │
                                             │  permission?    │
                                             └────────┬────────┘
                                                      │
                                              ┌───────▼───────┐
                                              │ Fetch Records │
                                              │ from Database │
                                              └───────┬───────┘
                                                      │
                                              ┌───────▼───────┐
                                              │   Filter by   │
                                              │   Ownership   │
                                              │  (if not Admin)│
                                              └───────┬───────┘
                                                      │
                                              ┌───────▼───────┐
                                              │   Return      │
                                              │   Filtered    │
                                              │   Results     │
                                              └───────────────┘
```

---

## Security Architecture

### Authentication Flow

```
1. User Login
   ↓
2. Verify Credentials (email + password hash)
   ↓
3. Generate JWT Token (24h expiry)
   ↓
4. Set HttpOnly Cookie + Return Token
   ↓
5. Client Stores Token
   ↓
6. Subsequent Requests Include Token
   ↓
7. Server Verifies Token on Each Request
```

### Security Measures

**Password Security:**
- Passwords hashed with bcrypt (10 rounds)
- Never stored or transmitted in plain text
- Password requirements enforced client-side

**JWT Security:**
- HS256 algorithm
- 24-hour expiration
- HttpOnly cookies (prevents XSS)
- Secure flag in production (HTTPS only)
- SameSite: 'lax' (CSRF protection)

**RBAC Security:**
- Secure by default (deny unless explicitly allowed)
- Multi-layer checks (API + ownership)
- Admin override for ownership restrictions

**API Security:**
- All endpoints require authentication (except login)
- Role verification on every request
- Ownership validation for non-admin users
- Input validation and sanitization

---

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password TEXT NOT NULL,  -- bcrypt hash
  role TEXT NOT NULL,      -- 'Admin', 'Manager', 'Viewer'
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

### Sessions Table
```sql
CREATE TABLE sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at INTEGER NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Model Definitions Table
```sql
CREATE TABLE model_definitions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  definition TEXT NOT NULL,  -- JSON string
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

**Definition JSON Structure:**
```json
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
      }
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

---

## API Layer

### Endpoint Structure

```
/api/
├── auth/
│   ├── login        POST   - Authenticate user
│   ├── logout       POST   - Clear session
│   └── me           GET    - Get current user
│
├── model-definitions/
│   ├── /            GET    - List all models
│   ├── /            POST   - Create model (Admin only)
│   ├── /:id         GET    - Get model by ID
│   ├── /:id         PUT    - Update model (Admin only)
│   └── /:id         DELETE - Delete model (Admin only)
│
├── data/
│   └── :modelName/
│       ├── /        GET    - List records (filtered by ownership)
│       ├── /        POST   - Create record (sets owner)
│       ├── /:id     GET    - Get record (ownership check)
│       ├── /:id     PUT    - Update record (ownership check)
│       └── /:id     DELETE - Delete record (ownership check)
│
└── users/
    ├── /            GET    - List users (Admin only)
    ├── /            POST   - Create user (Admin only)
    ├── /:id         GET    - Get user
    ├── /:id         PUT    - Update user
    └── /:id         DELETE - Delete user (Admin only)
```

### Middleware Stack

Each API request goes through:

1. **CORS Headers** (if needed)
2. **Authentication Check** (JWT verification)
3. **User Extraction** (from token)
4. **RBAC Permission Check** (action + role)
5. **Ownership Validation** (if applicable)
6. **Request Validation** (schema validation)
7. **Business Logic** (actual operation)
8. **Response Formatting** (JSON)

---

## Frontend Architecture

### Component Hierarchy

```
App Layout
│
├── AuthProvider (Context)
│   └── App Content
│       │
│       ├── Landing Page (Public)
│       │
│       ├── Login Page (Public)
│       │
│       └── Admin Area (Protected)
│           │
│           ├── Model Definition Page
│           │   ├── ModelList
│           │   ├── ModelForm
│           │   └── FieldEditor
│           │
│           └── Data Management Page
│               ├── ModelSelector
│               ├── DataTable
│               ├── DataForm
│               └── DeleteConfirmation
```

### State Management

**Authentication State:**
- Managed by `AuthContext`
- Persisted in JWT token
- Synced across tabs via cookie

**Model State:**
- Fetched from API on page load
- Cached in component state
- Refetched after mutations

**Data State:**
- Fetched per-model
- Paginated (future enhancement)
- Real-time updates (future enhancement)

---

## Design Patterns

### 1. Repository Pattern
- Database operations abstracted in `src/db`
- Business logic in `src/lib`
- Clean separation of concerns

### 2. Factory Pattern
- Dynamic API route generation for models
- Field validators created based on type

### 3. Strategy Pattern
- Different validation strategies per field type
- RBAC strategies per role

### 4. Middleware Pattern
- Authentication middleware
- RBAC middleware
- Validation middleware

### 5. Context Pattern (React)
- AuthContext for global auth state
- Avoids prop drilling

---

## Extensibility Points

### Adding New Field Types

1. Add type to `FieldType` in `src/lib/models.ts`
2. Add validation logic in `validateField()`
3. Update UI form component
4. Add tests

### Adding New Roles

1. Add role to `UserRole` type in `src/lib/auth.ts`
2. Update `roleHierarchy` in `hasPermission()`
3. Update seed data
4. Update tests

### Adding Custom Validations

1. Extend `FieldValidation` interface
2. Add validation logic in `validateField()`
3. Update UI to expose new validation options

### Adding Audit Logs

1. Create audit_logs table
2. Add middleware to log all mutations
3. Create audit log viewer UI
4. Add filtering and search

---

## Performance Considerations

### Current Limitations
- In-memory model storage (resets on restart)
- No pagination on data endpoints
- No caching layer
- No connection pooling

### Recommended Optimizations for Production

**Database:**
- Add indexes on frequently queried fields
- Implement connection pooling
- Use prepared statements

**API:**
- Add Redis caching layer
- Implement pagination (limit/offset)
- Add request rate limiting
- Use ETags for conditional requests

**Frontend:**
- Implement virtual scrolling for large tables
- Add optimistic updates
- Use SWR or React Query for data fetching
- Implement lazy loading

**Security:**
- Add rate limiting per user/IP
- Implement refresh tokens
- Add CSRF tokens
- Enable HTTPS in production

---

## Deployment Architecture

### Recommended Production Setup

```
┌────────────────┐
│   CDN/Proxy    │  (Cloudflare, AWS CloudFront)
└────────┬───────┘
         │
┌────────▼────────┐
│  Load Balancer  │  (AWS ALB, Nginx)
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼────┐
│ App 1 │ │ App 2 │  (Next.js instances)
└───┬───┘ └──┬────┘
    │        │
    └────┬───┘
         │
┌────────▼────────┐
│     Turso       │  (Managed SQLite)
│   Database      │
└─────────────────┘
```

---

## Testing Strategy

### Unit Tests
- `src/lib/*` - All business logic functions
- Pure functions (auth, RBAC, validation)
- High coverage goal: >80%

### Integration Tests
- API routes end-to-end
- Database operations
- RBAC enforcement in context

### Component Tests (Future)
- React components with user interactions
- Form submissions
- Error states

### E2E Tests (Future)
- Full user workflows
- Login → Create Model → Add Data
- Playwright or Cypress

---

## Monitoring & Observability (Future Enhancements)

**Logging:**
- Structured logging with Winston/Pino
- Log levels: ERROR, WARN, INFO, DEBUG
- Request/response logging

**Metrics:**
- API latency
- Error rates
- Database query performance
- Active user sessions

**Alerts:**
- Failed login attempts
- High error rates
- Database connection failures

---

## Conclusion

This architecture provides a solid foundation for a low-code CRUD platform with RBAC. The modular design allows for easy extension and maintenance. The clear separation of concerns enables independent scaling and testing of each layer.

For production deployment, additional considerations around security, performance, and monitoring should be implemented based on the specific requirements and scale of the deployment.
