# Best File and Folder Naming Convention for Express TypeScript Projects

Here's a comprehensive naming convention guide for Express.js projects using TypeScript:

## Folder Structure Convention

```
project-root/
├── src/
│   ├── config/         # Configuration files
│   ├── controllers/     # Route controllers
│   ├── services/       # Business logic
│   ├── middleware/     # Express middleware
│   ├── models/         # Database models
│   ├── routes/         # Route definitions
│   ├── types/          # Custom type definitions
│   ├── utils/          # Utility/helper functions
│   ├── validators/     # Request validation
│   ├── tests/         # Test files
│   └── app.ts         # Express app setup
├── .env                # Environment variables
└── package.json
```

## File Naming Conventions

### General Rules

- Use **kebab-case** for file and folder names (e.g., `user-controller.ts`)
- Use **PascalCase** for class names and interfaces (matches TypeScript conventions)
- Use **camelCase** for utility functions and non-class exports

### Specific File Types

1. **Controllers**: `[entity]-controller.ts` (e.g., `user-controller.ts`)
2. **Services**: `[entity]-service.ts` (e.g., `auth-service.ts`)
3. **Models**: `[entity].model.ts` (e.g., `user.model.ts`)
4. **Routes**: `[entity].routes.ts` (e.g., `user.routes.ts`)
5. **Middleware**: `[purpose]-middleware.ts` (e.g., `auth-middleware.ts`)
6. **Interfaces/Types**: `[entity].interface.ts` or `[entity].type.ts` (e.g., `user.interface.ts`)
7. **DTOs**: `[purpose].dto.ts` (e.g., `create-user.dto.ts`)
8. **Utils**: `[purpose].util.ts` (e.g., `date.util.ts`)

## TypeScript Specific Conventions

1. **Interface Naming**: Prefix with `I` (optional) or use descriptive names

   ```typescript
   interface IUser { ... }  // Option 1
   interface User { ... }    // Option 2 (more common in TypeScript)
   ```

2. **Type Aliases**: Use `.type.ts` suffix for complex types

   ```typescript
   // in types/user.type.ts
   type UserRole = "admin" | "user" | "guest";
   ```

3. **Class Names**: Match filename (PascalCase)
   ```typescript
   // in user.service.ts
   class UserService { ... }
   ```

## Example Implementation

```typescript
// src/controllers/user-controller.ts
import { Request, Response } from "express";
import { UserService } from "../services/user-service";

export class UserController {
  constructor(private userService: UserService) {}

  async getUser(req: Request, res: Response) {
    // ...
  }
}
```

```typescript
// src/routes/user.routes.ts
import { Router } from "express";
import { UserController } from "../controllers/user-controller";

const router = Router();
const userController = new UserController();

router.get("/:id", userController.getUser);

export { router as userRouter };
```

## Additional Best Practices

1. **Barrel Files**: Use `index.ts` in folders to simplify imports

   ```typescript
   // in controllers/index.ts
   export * from "./user-controller";
   export * from "./auth-controller";
   ```

2. **Test Files**: Keep test files alongside or in `__tests__` folders with `.spec.ts` or `.test.ts` suffix

   ```
   user-controller.spec.ts
   or
   __tests__/user-controller.test.ts
   ```

3. **Environment Files**: `.env` for development, `.env.production` for production

4. **Configuration Files**: `config/database.ts`, `config/server.ts` etc.

This convention provides a clean, scalable structure that works well for both small and large Express TypeScript projects while maintaining good TypeScript type safety and IDE support.
