# Auto-Generated CRUD + RBAC Platform

A powerful, no-code platform for building data-driven applications with automatic API generation and role-based access control.

## 🚀 Features

- **Auto-Generated REST APIs**: Define your data model once and get complete CRUD APIs automatically
- **Role-Based Access Control (RBAC)**: Configure granular permissions (create, read, update, delete) per role
- **Ownership Control**: Define owner fields to ensure users can only access their own data
- **Dynamic Forms**: UI forms are automatically generated from model definitions with validation
- **JWT Authentication**: Secure authentication with JWT tokens and session management
- **Flexible Data Types**: Support for string, number, boolean, date, email, URL fields with custom validations

## 📋 Demo Accounts

The platform comes with three pre-configured demo accounts:

| Role | Email | Password | Permissions |
|------|-------|----------|-------------|
| **Admin** | admin@example.com | admin123 | Full access to all features |
| **Manager** | manager@example.com | manager123 | Limited management capabilities |
| **Viewer** | viewer@example.com | viewer123 | Read-only access |

## 🏗️ Architecture

### Core Components

1. **Authentication System** (`src/lib/auth.ts`, `src/lib/users.ts`)
   - JWT-based authentication
   - Role hierarchy (Admin > Manager > Viewer)
   - Cookie-based session management

2. **Model Definition System** (`src/lib/models.ts`)
   - Dynamic model creation with custom fields
   - Field type validation (string, number, boolean, date, email, url)
   - Custom validation rules (required, min/max, pattern, minLength/maxLength)
   - RBAC permission configuration per model

3. **Dynamic CRUD API** (`src/app/api/data/[modelName]/route.ts`)
   - Auto-generated endpoints based on model definitions
   - RBAC middleware enforcement
   - Ownership validation
   - Data validation against model schema

4. **Admin Interfaces**
   - Model Definition UI (`/admin/models`) - Create and manage data models
   - Data Management UI (`/admin/data`) - CRUD operations on records

## 📖 How It Works

### Step 1: Define a Model

Go to `/admin/models` and create a new model:

```json
{
  "name": "Product",
  "fields": [
    {
      "name": "name",
      "type": "string",
      "label": "Product Name",
      "required": true
    },
    {
      "name": "price",
      "type": "number",
      "label": "Price",
      "required": true
    },
    {
      "name": "inStock",
      "type": "boolean",
      "label": "In Stock",
      "required": false
    }
  ],
  "ownerField": "userId",
  "permissions": {
    "create": ["Admin", "Manager"],
    "read": ["Admin", "Manager", "Viewer"],
    "update": ["Admin", "Manager"],
    "delete": ["Admin"]
  }
}
```

### Step 2: APIs are Auto-Generated

Once your model is defined, these endpoints are automatically available:

- `GET /api/data/Product` - List all products (with ownership filtering)
- `POST /api/data/Product` - Create a new product
- `GET /api/data/Product/[id]` - Get a specific product
- `PUT /api/data/Product/[id]` - Update a product
- `DELETE /api/data/Product/[id]` - Delete a product

### Step 3: Manage Data via UI

Visit `/admin/data`, select your model, and use the dynamically generated forms to:
- View all records in a table
- Add new records
- Edit existing records
- Delete records

All operations respect the RBAC permissions you configured!

## 🔒 Security Features

### JWT Authentication

- Tokens expire after 24 hours
- HTTP-only cookies prevent XSS attacks
- Secure cookie flags in production

### Role-Based Access Control

Each operation (create, read, update, delete) can be restricted to specific roles:

```typescript
permissions: {
  create: ['Admin'],              // Only admins can create
  read: ['Admin', 'Manager', 'Viewer'], // All roles can read
  update: ['Admin', 'Manager'],   // Admins and managers can update
  delete: ['Admin']               // Only admins can delete
}
```

### Ownership Control

Define an `ownerField` to implement row-level security:

```typescript
ownerField: "userId"  // Field that stores the owner's user ID
```

- Users can only access records they own
- Admins bypass ownership checks and see all records
- Ownership is automatically set on record creation

## 🛠️ API Endpoints

### Authentication

- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/logout` - Logout current user
- `GET /api/auth/me` - Get current user info

### Models

- `GET /api/models` - List all models
- `POST /api/models` - Create a new model (Admin only)
- `GET /api/models/[name]` - Get model definition
- `DELETE /api/models/[name]` - Delete a model (Admin only)

### Data (Dynamic)

- `GET /api/data/[modelName]` - List records
- `POST /api/data/[modelName]` - Create record
- `GET /api/data/[modelName]/[id]` - Get record
- `PUT /api/data/[modelName]/[id]` - Update record
- `DELETE /api/data/[modelName]/[id]` - Delete record

## 🎨 Field Types & Validations

### Supported Field Types

- **string**: Text data
- **number**: Numeric values
- **boolean**: True/false flags
- **date**: Date values
- **email**: Email addresses with validation
- **url**: URLs with validation

### Validation Options

```typescript
{
  required: boolean,        // Field must have a value
  min: number,             // Minimum value (for numbers)
  max: number,             // Maximum value (for numbers)
  minLength: number,       // Minimum length (for strings)
  maxLength: number,       // Maximum length (for strings)
  pattern: string          // Regex pattern (for strings)
}
```

## 📂 Project Structure

```
src/
├── app/
│   ├── admin/
│   │   ├── models/        # Model definition interface
│   │   └── data/          # Data management interface
│   ├── api/
│   │   ├── auth/          # Authentication endpoints
│   │   ├── models/        # Model management endpoints
│   │   └── data/          # Dynamic CRUD endpoints
│   ├── login/             # Login page
│   └── page.tsx           # Landing page
├── lib/
│   ├── auth.ts            # JWT authentication utilities
│   ├── users.ts           # User management
│   ├── models.ts          # Model definition & validation
│   ├── rbac.ts            # RBAC utilities
│   └── dataStore.ts       # In-memory data storage
├── contexts/
│   └── AuthContext.tsx    # React auth context
└── components/
    └── AuthGuard.tsx      # Route protection component
```

## 🚀 Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Run the development server**
   ```bash
   npm run dev
   ```

3. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

4. **Login**
   Use one of the demo accounts (see Demo Accounts section)

5. **Create your first model**
   Go to `/admin/models` and define a data model

6. **Manage data**
   Go to `/admin/data` and start creating records

## 🔧 Configuration

### JWT Secret

Set the JWT secret in your environment:

```bash
JWT_SECRET=your-secret-key-here
```

Or it will use a default development key (not recommended for production).

### Data Storage

Currently uses in-memory storage. In production, replace `src/lib/dataStore.ts` with a real database implementation (PostgreSQL, MongoDB, etc.).

## 🎯 Use Cases

- **Rapid Prototyping**: Build MVPs without writing backend code
- **Admin Panels**: Create custom admin interfaces quickly
- **Internal Tools**: Build CRUD apps for team operations
- **Learning**: Understand RBAC and API design patterns
- **Starter Template**: Use as a base for more complex applications

## 📝 Example: Building a Blog

1. Login as Admin
2. Create "Post" model with fields:
   - title (string, required)
   - content (string, required)
   - published (boolean)
   - authorId (set as ownerField)
3. Set permissions:
   - create: Admin, Manager
   - read: Admin, Manager, Viewer
   - update: Admin, Manager (only own posts)
   - delete: Admin
4. Go to Data Management and create posts
5. Use the API from your frontend: `GET /api/data/Post`

## 🤝 Contributing

This is a demonstration platform. Feel free to extend it with:
- Real database integration
- File upload support
- Relationship/foreign key support
- Advanced query filters
- Export/import functionality
- API documentation generation

## 📄 License

MIT License - feel free to use this for your projects!

## 🙏 Acknowledgments

Built with:
- Next.js 15
- TypeScript
- Shadcn/UI
- Tailwind CSS
- JWT (jose)
- bcryptjs
