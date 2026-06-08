# Catering Server - Agent Instructions

## Project Overview
Catering Server is a Node.js/Express backend API for a catering service. It manages authentication, dishes, and packages with MongoDB persistence and role-based access control (admin/customer).

**Tech Stack:** Express.js | MongoDB + Mongoose | JWT Auth | Joi Validation | Helmet Security

---

## Quick Start
```bash
npm install
npm run dev  # Start development server (runs on PORT 3000 by default)
```

**Environment Setup:** Create `.env` file with:
- `MONGODB_URI` - Mongction string (default: `mongodb://localhost:27017/catering`)
- `PORT` - Server port (default: 3000)
- `JWT_SECRET` - JWT signing secret
- `NODE_ENV` - Set to 'development' or 'production'

---

## Architecture & Conventions

### Folder Structure
```
src/
├── config/        # Database and service configurations
├── controllers/   # HTTP request handlers - thin layer delegating to services
├── middlewares/   # Express middleware (auth, validation, error handling)
├── models/        # Mongoose schemas (User, Dish, Package)
├── routes/        # Express route definitions (mapped by feature)
├── services/      # Business logic layer - where operations happen
├── utils/         # Helper utilities (responseHandler, token generation)
└── validations/   # Joi schema definitions for request validation
```

### Feature Organization
Each feature (auth, dishes, packages) follows this flow:
```
Route → Middleware (Validation, Auth) → Controller → Service → Model
```

**Example (Auth):**
- `routes/auth.routes.js` - Define endpoints
- `controllers/auth.controller.js` - Extract request data, call service, return response
- `services/auth.service.js` - Hash passwords, check credentials, generate tokens
- `models/User.js` - Define schema
- `validations/auth.validation.js` - Joi schemas

---

## Development Patterns

### 1. Response Handling
Always use `responseHandler` utility for consistent API responses:
```javascript
const responseHandler = require('../utils/responseHandler');
responseHandler.success(res, data, message, statusCode);
responseHandler.error(res, message, statusCode);
```

### 2. Request Validation
- Create Joi schema in `validations/` folder
- Apply via `validate()` middleware before controller
- Example: `validate(registerValidation, 'body')`

### 3. Authentication
- Routes requiring auth use `verifyToken` middleware
- Extracts `req.user.id` from JWT token
- Role-based checks via `isAdmin` middleware for admin endpoints

### 4. Error Handling
- Services throw descriptive errors
- Controllers catch and map errors to HTTP status codes (401, 404, 409, 500)
- Global error handler catches unexpected errors

### 5. Middleware Pattern
```javascript
// auth.middleware.js - verifyToken, isAdmin
// validation.middleware.js - validate(schema, location)
// error.middleware.js - Global error handler
```

---

## Common Tasks

### Adding a New Feature
1. Create model in `models/FeatureName.js`
2. Create validation schema in `validations/feature.validation.js`
3. Create service in `services/feature.service.js` (business logic)
4. Create controller in `controllers/feature.controller.js`
5. Create routes in `routes/feature.routes.js`
6. Mount routes in `app.js`: `app.use('/api/feature', require('./src/routes/feature.routes'))`

### Adding an Endpoint
1. Add Joi schema to validation file
2. Create controller method
3. Add route with validation middleware + auth middleware
4. Implement service method

### Database Operations
- All Mongoose queries live in services
- Models define schema structure only
- Connection managed in `config/mongodb.config.js`

---

## API Endpoints

### Auth Routes (`/api/auth`)
- `POST /register` - Register new user
- `POST /login` - Login user
- `GET /profile` - Get authenticated user profile (requires auth)

### Dishes Routes (`/api/dishes`)
- CRUD operations for dishes

### Packages Routes (`/api/packages`)
- CRUD operations for packages

### Health Check
- `GET /api/health` - Server status

---

## Key Dependencies & Their Roles

| Package | Purpose |
|---------|---------|
| `express` | HTTP framework |
| `mongoose` | MongoDB ORM |
| `jsonwebtoken` | JWT authentication |
| `bcrypt` | Password hashing |
| `joi` | Request validation |
| `helmet` | HTTP security headers |
| `cors` | Cross-origin requests |
| `morgan` | HTTP request logging |

---

## Testing
```bash
npm test  # Currently placeholder - add test suite as needed
```

---

## Important Notes

- **Security:** Passwords hashed with bcrypt, stored as `hashPassword`
- **User Roles:** `admin` or `customer` (default) - role-based access control in middlewares
- **Error Messages:** Match error strings to determine HTTP status (e.g., "Email already in use" → 409)
- **Database:** Uses default collection names (users, dishes, packages)
- **JWT:** Token stored and validated in auth middleware

---

## When Modifying Code

1. **Adding validation rules?** Update corresponding file in `validations/`
2. **Changing business logic?** Modify `services/` - never duplicate logic in controllers
3. **Adding routes?** Use validation middleware and follow existing patterns
4. **Database changes?** Update model schema and corresponding service methods
5. **New middleware?** Place in `middlewares/` folder, document purpose, mount in `app.js` or specific routes
