import { Request, Response, Router } from 'express';
import { methodHandler } from '../handler';

// Mock fs.promises.readdir
jest.mock('fs', () => ({
  promises: {
    readdir: jest.fn()
  }
}));

// Mock dynamic imports
jest.mock('../attach', () => {
  const originalModule = jest.requireActual('../attach');
  return {
    ...originalModule,
    // We need to re-export methodHandler for our tests
    methodHandler: originalModule.methodHandler,
    // But we'll mock the dynamic import in attachRoutes
    attachRoutes: jest.fn().mockImplementation((dir) => {
      const router = Router();
      // The implementation will be provided in each test
      return router;
    })
  };
});

describe('methodHandler', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    req = {};
    res = {
      json: jest.fn()
    };
    next = jest.fn();
  });

  test('should handle undefined return value', async () => {
    const handler = methodHandler(() => undefined);
    await handler(req as Request, res as Response, next);
    
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });

  test('should handle array return value', async () => {
    const handler = methodHandler(() => [1, 2, 3]);
    await handler(req as Request, res as Response, next);
    
    expect(res.json).toHaveBeenCalledWith({ data: [1, 2, 3], success: true });
  });

  test('should handle object return value', async () => {
    const handler = methodHandler(() => ({ user: { id: 1 } }));
    await handler(req as Request, res as Response, next);
    
    expect(res.json).toHaveBeenCalledWith({ user: { id: 1 }, success: true });
  });

  test('should handle primitive return value', async () => {
    const handler = methodHandler(() => 'hello');
    await handler(req as Request, res as Response, next);
    
    expect(res.json).toHaveBeenCalledWith({ data: 'hello', success: true });
  });

  test('should handle errors', async () => {
    const error = new Error('Test error');
    const handler = methodHandler(() => {
      throw error;
    });
    
    await handler(req as Request, res as Response, next);
    
    expect(next).toHaveBeenCalledWith(error);
  });
});

// For a more complete test suite, you would also want to test the attachRoutes function
// This would require more complex mocking of the file system and dynamic imports 