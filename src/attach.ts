import { Router } from "express";
import { methodHandler } from "./handler";
import { promises as fs } from "fs";

const routeFile = /route\.(ts|js)$/;
const methodNames = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;

export function attachRoutes(dir: string, importFn = (path: string) => import(path)): Router {
  const router = Router();

  fs.readdir(dir, { recursive: true }).then(async (paths) => {
    for (const path of paths) {
      if (path.match(routeFile)) {
        const pathUrl = `/${path.replace(routeFile, "").replace(/\/$/, "")}`;
        const methodImport = await importFn(`${dir}/${path}`);
        const methods = methodImport?.default || methodImport;
        for (const methodName of methodNames) {
          if (typeof methods[methodName] === "function") {
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

