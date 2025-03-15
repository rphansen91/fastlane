import { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'

export function appErrorHandler (err: unknown, req: Request, res: Response, next: NextFunction) {
  console.log('Error', err)
  if (err instanceof ZodError) {
    const formatted = err.format()
    console.log(JSON.stringify(formatted))
    res.status(400).send(err)
  } else if (isKnownError(err)) {
    res.status(err.statusCode).json({ message: err.message })
  } else {
    res.status(500).json({ message: 'Unknown error' })
  }
}

export class StatusError extends Error {
  statusCode = 400

  constructor (message: string, options: { statusCode?: number } = {}) {
    super(message)
    if (options.statusCode) {
      this.statusCode = options.statusCode
    }
  }
}

export class Unauthorized extends StatusError {
  constructor(message = 'Unauthorized') {
    super(message, { statusCode: 401 })
  }
}

export class NotProcessed extends StatusError {
  constructor(message = 'NotProcessed') {
    super(message, { statusCode: 403 })
  }
}

export interface KnownError { statusCode: number; message: string }

export function isKnownError (err: unknown): err is KnownError {
  return !!err && typeof err === 'object' && 'statusCode' in err && typeof err.statusCode === 'number' && 'message' in err && typeof err.message === 'string'
}