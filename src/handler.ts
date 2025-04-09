import { RequestHandler, Request, Response } from "express";

export function methodHandler(fn: (req: Request, res: Response) => unknown): RequestHandler {
  return async (req, res, next) => {
    try {
      const data = await fn(req, res);

      if (data instanceof Response) {
        for (const [key, value] of data.headers.entries()) {
          res.setHeader(key, value);
        }
        res.status(data.status);
        res.send(data.body);
      } else if (typeof data === "undefined") {
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