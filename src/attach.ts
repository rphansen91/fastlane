import { Router, RequestHandler, Request, Response } from "express";
import fs from "fs";

const routeFile = /route\.(ts|js)$/;
const methodNames = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;

export function attachRoutes(dir: string): Router {
  const router = Router();

  fs.promises.readdir(dir, { recursive: true }).then(async (paths) => {
    for (const path of paths) {
      if (path.match(routeFile)) {
        const pathUrl = `/${path.replace(routeFile, "").replace(/\/$/, "")}`;
        const methodImport = await import(`${dir}/${path}`);
        const methods = methodImport?.default || methodImport;
        for (const methodName of methodNames) {
          if (typeof methods[methodName] === "function") {
            console.log(`Attaching ${methodName} ${pathUrl}`);
            router[methodName.toLowerCase() as Lowercase<typeof methodName>](
              pathUrl,
              methodHandler(methods[methodName])
            );
          }
        }
      }
    }
  });

  return router;
}

function methodHandler(fn: (req: Request, res: Response) => unknown): RequestHandler {
  return async (req, res, next) => {
    try {
      const data = await fn(req, res);

      if (typeof data === "undefined") {
        res.json({ success: true });
      } else if (Array.isArray(data)) {
        res.json({ data, success: true });
      } else if (typeof data === 'object') {
        res.json({ ...data, success: true });
      } else {
        res.json({ data, success: true });
      }
    } catch (err) {
      next(err);
    }
  }
}