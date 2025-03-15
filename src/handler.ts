import { RequestHandler, Request, Response } from "express";

export function methodHandler(fn: (req: Request, res: Response) => unknown): RequestHandler {
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