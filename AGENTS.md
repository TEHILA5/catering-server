# AI Agent Guide: Catering Server

This document helps AI coding agents understand the codebase architecture, conventions, and best practices for this catering service REST API.

## Project Overview

**catering-server** is a Node.js/Express API for managing catering dishes and packages. It serves both public endpoints (menu browsing) and admin endpoints (content management) with JWT-based authentication.

## Architecture: 3-Tier Layered Pattern

All features follow this strict separation:

```
Routes (middleware chain) 
  ↓ [auth, validation, authorization]
Controllers (request handling, error mapping)
  ↓ [try-catch wrapper, responseHandler]
Services (business logic, database queries)
  ↓
Models (Mongoose schemas)
  ↓
MongoDB
```

**Key principle**: Each layer has a single responsibility. Business logic lives in services, not controllers or routes.

## Conventions to Follow

### Routes
- **Pattern**: RESTful endpoints with middleware chains  
- **Middleware order**: `verifyToken` → `isAdmin` → `validate()` → controller  
- **Exemplar**: [src/routes/dish.routes.js](src/routes/dish.routes.js)
- **Standard template**:
  ```javascript
  router.post('/', verifyToken, isAdmin, validate(dishValidation.create, 'body'), dishController.create);
  ```

### Controllers
- **Wrap all service calls in try-catch**
- **Use `responseHandler(res, statusCode, message, data)` for all responses**
- **Map service error messages to HTTP status codes** (e.g., "not found" → 404)
- **Never call database directly** — use services only
- **Exemplar**: [src/controllers/dish.controller.js](src/controllers/dish.controller.js)

### Services
- **Pure business logic layer** — no direct request/response handling
- **Throw descriptive errors** with clear messages (e.g., `throw new Error('Dish not found')`)
- **Use `.lean()` for read-only queries** to improve performance
- **Use `{ new: true, runValidators: true }` in findByIdAndUpdate calls**
- **Exemplar**: [src/services/dish.service.js](src/services/dish.service.js)

### Models (Mongoose Schemas)
- **File names**: PascalCase (e.g., `Dish.js`, `Package.js`)
- **Schema patterns**: 
  - Use enums for controlled fields (e.g., category)
  - Mark required fields
  - Use custom validators where needed
  - Include timestamps if tracking history
- **Exemplar**: [src/models/Dish.js](src/models/Dish.js)

### Validation
- **Define schemas in separate files**: `src/validations/[feature].validation.js`
- **Use Joi with options**: `.trim()`, `.stripUnknown()` for security
- **⚠️ INCONSISTENCY ALERT**: 
  - ✅ **Dish routes** use centralized `validate(schema, source)` middleware (CORRECT PATTERN)
  - ❌ **Package routes** use inline validation in handlers (should be refactored)
  - **Always use the Dish pattern for new features**
- **Exemplar**: [src/validations/dish.validation.js](src/validations/dish.validation.js)

### Response Format
- **All responses follow this format** (via `responseHandler`):
  ```json
  {
    "success": true|false,
    "message": "Human-readable message",
    "data": null|object|array
  }
  ```
- **Use**: [src/utils/responseHandler.js](src/utils/responseHandler.js)

## Authentication & Authorization

- **Token location**: `Authorization: Bearer <token>` header
- **Token validation**: `verifyToken` middleware validates JWT and stores decoded token in `req.user`
- **Role checking**: `isAdmin` middleware checks `req.user.role === 'admin'`
- **Middleware chain**: Always use both for admin endpoints, only `verifyToken` for public endpoints

## Database & ORM

- **Database**: MongoDB with Mongoose v9.6.3
- **Performance tips**:
  - Use `.lean()` for read-only queries (returns plain objects, faster)
  - Use projections to exclude unnecessary fields: `.find({}, 'name price -_id')`
- **Dish model note**: Schema includes enums for categories (Starters, MainCourses, Salads, Desserts, Breads, Drinks)

## ⚠️ Known Issues to Fix

1. **app.js is currently empty** — needs Express setup, middleware configuration, and route mounting
2. **No .env configuration** — JWT_SECRET, MONGODB_URI, and PORT are not defined
3. **Missing database connection code** — Mongoose connection initialization needed in app.js
4. **Validation inconsistency** — Package routes use inline validation instead of reusable middleware
5. **Entry point mismatch** — package.json lists `index.js` but should reference `app.js`
6. **No npm scripts** — need `start`, `dev`, and `test` scripts in package.json
7. **isActive field issue** — Dish model doesn't have this field but queries filter by `isActive: true`

## Common Tasks

### Adding a New Route Endpoint
1. Create/update validation schema in `src/validations/[feature].validation.js`
2. Create controller method in `src/controllers/[feature].controller.js` with try-catch
3. Create service method in `src/services/[feature].service.js` with business logic
4. Add route with correct middleware chain in `src/routes/[feature].routes.js`
5. **Always follow the Dish pattern**, not the Package pattern

### Adding a New Field to a Model
1. Update the Mongoose schema in `src/models/[Model].js`
2. Update validation schemas if the field is user-input
3. Update service methods to use the field if needed
4. Add database migration if production data needs updating

### Handling Errors
- **In services**: throw descriptive errors → `throw new Error('Dish not found')`
- **In controllers**: catch and map to status codes
  ```javascript
  if (error.message.includes('not found')) {
    return responseHandler(res, 404, error.message, null);
  }
  ```

## Directory Structure

```
src/
├── controllers/       # Request handlers (try-catch wrappers)
├── middlewares/       # Auth, validation, authorization
├── models/           # Mongoose schemas (PascalCase files)
├── routes/           # REST endpoints with middleware chains
├── services/         # Business logic (pure functions)
├── validations/      # Joi schemas for input validation
└── utils/            # Shared utilities (responseHandler.js)
```

## Performance & Security Notes

- ✅ Use `.lean()` for read-only queries
- ✅ Trim and strip unknown fields in validation
- ✅ Always validate user input at route level
- ✅ Use Mongoose validators where applicable
- ⚠️ Add helmet.js and CORS middleware in app.js
- ⚠️ Consider rate limiting for public endpoints

---

**For questions about patterns**: Look at [src/routes/dish.routes.js](src/routes/dish.routes.js) and [src/services/dish.service.js](src/services/dish.service.js) — these exemplify the correct patterns to follow.
