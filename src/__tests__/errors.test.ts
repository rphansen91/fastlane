import { StatusError, Unauthorized, NotProcessed, isKnownError, appErrorHandler } from '../errors';
import { Request, Response, NextFunction } from 'express';
import { ZodError, z } from 'zod';

describe('Error classes', () => {
  test('StatusError should have correct default status code', () => {
    const error = new StatusError('Test error');
    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(400);
  });

  test('StatusError should accept custom status code', () => {
    const error = new StatusError('Test error', { statusCode: 418 });
    expect(error.statusCode).toBe(418);
  });

  test('Unauthorized should have status code 401', () => {
    const error = new Unauthorized();
    expect(error.message).toBe('Unauthorized');
    expect(error.statusCode).toBe(401);
  });

  test('Unauthorized should accept custom message', () => {
    const error = new Unauthorized('Custom unauthorized message');
    expect(error.message).toBe('Custom unauthorized message');
    expect(error.statusCode).toBe(401);
  });

  test('NotProcessed should have status code 403', () => {
    const error = new NotProcessed();
    expect(error.message).toBe('NotProcessed');
    expect(error.statusCode).toBe(403);
  });
});

describe('isKnownError', () => {
  test('should identify known errors', () => {
    expect(isKnownError(new StatusError('Test'))).toBe(true);
    expect(isKnownError(new Unauthorized())).toBe(true);
    expect(isKnownError(new NotProcessed())).toBe(true);
  });

  test('should reject non-error objects', () => {
    expect(isKnownError(null)).toBe(false);
    expect(isKnownError(undefined)).toBe(false);
    expect(isKnownError({})).toBe(false);
    expect(isKnownError(new Error('Standard error'))).toBe(false);
    expect(isKnownError({ message: 'test' })).toBe(false);
    expect(isKnownError({ statusCode: 400 })).toBe(false);
  });
});

describe('appErrorHandler', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
    
    // Mock console.log to avoid cluttering test output
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should handle ZodError', () => {
    const schema = z.object({ name: z.string() });
    let zodError: ZodError;
    
    try {
      schema.parse({ name: 123 });
    } catch (err) {
      zodError = err as ZodError;
      appErrorHandler(zodError, mockRequest as Request, mockResponse as Response, mockNext);
    }

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.send).toHaveBeenCalled();
  });

  test('should handle known errors', () => {
    const error = new Unauthorized('Invalid token');
    appErrorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Invalid token' });
  });

  test('should handle unknown errors', () => {
    const error = new Error('Something went wrong');
    appErrorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Unknown error' });
  });
}); 