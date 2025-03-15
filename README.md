# 🏎️ Fastlane

**Zero to API in seconds flat. No speed limits.**

Fastlane is a lightning-fast, zero-config Express router that lets you build APIs at breakneck speed. Stop wasting time with boilerplate and start shipping routes that matter.

## 🚀 The Fastlane Advantage

- **File-based routing** - Create a file, get an endpoint. It's that simple.
- **Convention over configuration** - No more repetitive route definitions
- **Built-in error handling** - Automatic response formatting for all your errors
- **TypeScript first** - Full type safety with zero compromises

## ⚡ Installation

```bash
npm install fastlane
# or
yarn add fastlane
```

## 🏁 Quick Start

1. Create a route file:

```ts
// routes/users.route.ts
import { Request, Response } from "express";

export default {
  // GET /users
  GET: (req: Request, res: Response) => {
    return { users: [{ id: 1, name: "Speed Racer" }] };
  },
  
  // POST /users
  POST: (req: Request, res: Response) => {
    return { id: 2, name: req.body.name };
  }
};
```

2. Attach your routes:

```ts
import express from "express";
import { attachRoutes, appErrorHandler } from "fastlane";

const app = express();
app.use(express.json());

// Automatically discovers and attaches all route files
app.use(attachRoutes("./routes"));

// Handle errors with our built-in error handler
app.use(appErrorHandler);

app.listen(3000, () => {
  console.log("Server racing on port 3000");
});
```

## 🛣️ How It Works

Fastlane scans your project for files ending in `.route.ts` or `.route.js` and automatically creates Express routes based on the file path and exported HTTP method handlers.

For example:
- `users/route.ts` becomes `/users`
- `users/admin/route.ts` becomes `/users/admin`

## 🚦 Response Handling

All route handlers automatically format your responses:

```ts
// Return an object
return { user: { id: 1 } };
// Becomes: { user: { id: 1 }, success: true }

// Return an array
return [1, 2, 3];
// Becomes: { data: [1, 2, 3], success: true }

// Return nothing
return;
// Becomes: { success: true }
```

## 🚧 Error Handling

Fastlane includes a powerful error handling system:

```ts
import { StatusError, Unauthorized } from "fastlane";

// Throw custom errors
throw new StatusError("Something went wrong", { statusCode: 400 });

// Or use built-in error types
throw new Unauthorized("Invalid API key");
```

Zod validation errors are automatically formatted and returned as 400 responses.

## 📋 API Reference

### `attachRoutes(directory: string): Router`

Scans the specified directory for route files and returns an Express router with all routes configured.

### Error Classes

- `StatusError` - Base error class with customizable status code
- `Unauthorized` - 401 Unauthorized errors
- `NotProcessed` - 403 Forbidden errors

## 🏆 Why Choose Fastlane?

When you need to move fast without breaking things, Fastlane gives you the perfect balance of convention and flexibility. No unnecessary abstractions, just pure speed for your API development.

## 📄 License

ISC