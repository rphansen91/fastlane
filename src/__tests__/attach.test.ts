import { Router } from 'express';
import { attachRoutes } from '../attach';
import * as handler from '../handler';

// Create a spy for Router
const mockRouterFn = jest.fn();

const mockRouter = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn()
};

// Mock fs with a properly implemented readdir function
jest.mock('fs', () => {
  return {
    promises: {
      readdir: jest.fn().mockImplementation(() => Promise.resolve([]))
    }
  };
});

// Get a reference to the mocked function for use in tests
const fsPromises = jest.requireMock('fs').promises;

// Mock dependencies
jest.mock('express', () => {
  return {
    Router: () => {
      mockRouterFn();
      return mockRouter;
    }
  };
});

// Mock the methodHandler to properly wrap the handler functions
jest.mock('../handler', () => ({
  methodHandler: jest.fn().mockImplementation((fn) => {
    // Return a function that can be used as a route handler
    const mockHandler = function() {
      if (fn) return fn();
      return undefined;
    };
    return mockHandler;
  })
}));

describe('attachRoutes', () => {
  let mockMethodHandler: jest.MockedFunction<typeof handler.methodHandler>;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetAllMocks();
    mockMethodHandler = handler.methodHandler as jest.MockedFunction<typeof handler.methodHandler>;
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should return a router instance', async () => {
    // Set up the mock to resolve immediately
    fsPromises.readdir.mockResolvedValue([]);
    
    const router = attachRoutes('./routes');
    
    // Wait for any promises to resolve
    await new Promise(process.nextTick);
    
    expect(mockRouterFn).toHaveBeenCalled();
    expect(router).toBeDefined();
  });

  it('should scan the directory for route files', async () => {
    fsPromises.readdir.mockResolvedValue([]);
    
    attachRoutes('./routes');
    
    // Wait for promises to resolve
    await new Promise(process.nextTick);
    
    expect(fsPromises.readdir).toHaveBeenCalledWith('./routes', { recursive: true });
  });

  it('should attach route handlers for matching files', async () => {
    // Mock file system with route files
    fsPromises.readdir.mockResolvedValue(['users/route.ts', 'products/route.js']);
    
    // Create mock handler functions
    const getUserHandler = jest.fn();
    const postUserHandler = jest.fn();
    const putProductHandler = jest.fn();
    const deleteProductHandler = jest.fn();
    
    // Mock user routes
    const mockUserRoutes = {
      GET: getUserHandler,
      POST: postUserHandler
    };
    
    // Mock product routes
    const mockProductRoutes = {
      default: {
        PUT: putProductHandler,
        DELETE: deleteProductHandler
      }
    };
    
    // Mock the methodHandler to return the wrapped handler
    mockMethodHandler.mockImplementation((fn) => {
      return fn as any;
    });
    
    // Mock the dynamic import
    const importFn = jest.fn().mockImplementation((path) => {
      if (path.includes('users/route.ts')) return Promise.resolve(mockUserRoutes);
      if (path.includes('products/route.js')) return Promise.resolve(mockProductRoutes);
      return Promise.resolve({});
    });
    
    attachRoutes('./routes', importFn);
    
    // Wait for promises to resolve
    await new Promise(process.nextTick);
    
    // Verify routes were attached
    expect(mockRouter.get).toHaveBeenCalledWith('/users', expect.any(Function));
    expect(mockRouter.post).toHaveBeenCalledWith('/users', expect.any(Function));
    expect(mockRouter.put).toHaveBeenCalledWith('/products', expect.any(Function));
    expect(mockRouter.delete).toHaveBeenCalledWith('/products', expect.any(Function));
    
    // Verify console logs
    expect(consoleSpy).toHaveBeenCalledWith('Attaching GET /users');
    expect(consoleSpy).toHaveBeenCalledWith('Attaching POST /users');
    expect(consoleSpy).toHaveBeenCalledWith('Attaching PUT /products');
    expect(consoleSpy).toHaveBeenCalledWith('Attaching DELETE /products');
  });

  it('should handle files that do not match the route pattern', async () => {
    fsPromises.readdir.mockResolvedValue(['users/index.ts', 'products/route.ts'] as any);
    
    const mockProductRoutes = {
      GET: jest.fn()
    };
    
    // Mock the dynamic import
    const importFn = jest.fn((path) => {
      if (path.includes('products/route.ts')) return Promise.resolve(mockProductRoutes);
      return Promise.resolve({});
    });
    
    // Don't override the methodHandler implementation
    mockMethodHandler.mockImplementation((fn) => fn as any);
    
    attachRoutes('./routes', importFn);
    
    // Wait for promises to resolve
    await new Promise(process.nextTick);
    
    // Only the route file should be processed
    expect(mockRouter.get).toHaveBeenCalledWith('/products', expect.any(Function));
    expect(mockRouter.get).toHaveBeenCalledTimes(1);
  });

  it('should correctly parse the URL path from the file path', async () => {
    fsPromises.readdir.mockResolvedValue(['users/admin/route.ts', 'api/v1/products/route.js'] as any);
    
    const mockUserAdminRoutes = {
      GET: jest.fn()
    };
    
    const mockProductsV1Routes = {
      POST: jest.fn()
    };
    
    // Mock the dynamic import
    const importFn = jest.fn((path) => {
      if (path.includes('users/admin/route.ts')) return Promise.resolve(mockUserAdminRoutes);
      if (path.includes('api/v1/products/route.js')) return Promise.resolve(mockProductsV1Routes);
      return Promise.resolve({});
    });
    
    // Don't override the methodHandler implementation
    mockMethodHandler.mockImplementation((fn) => fn as any);
    
    attachRoutes('./routes', importFn);
    
    // Wait for promises to resolve
    await new Promise(process.nextTick);
    
    // Verify the paths are correctly parsed
    expect(mockRouter.get).toHaveBeenCalledWith('/users/admin', expect.any(Function));
    expect(mockRouter.post).toHaveBeenCalledWith('/api/v1/products', expect.any(Function));
  });

  it('should handle both default and direct exports', async () => {
    fsPromises.readdir.mockResolvedValue(['direct-export/route.ts', 'default-export/route.ts'] as any);
    
    const mockDirectExport = {
      GET: jest.fn()
    };
    
    const mockDefaultExport = {
      default: {
        POST: jest.fn()
      }
    };
    
    // Mock the dynamic import
    const importFn = jest.fn((path) => {
      if (path.includes('direct-export/route.ts')) return Promise.resolve(mockDirectExport);
      if (path.includes('default-export/route.ts')) return Promise.resolve(mockDefaultExport);
      return Promise.resolve({});
    });
    
    // Don't override the methodHandler implementation
    mockMethodHandler.mockImplementation((fn) => fn as any);
    
    attachRoutes('./routes', importFn);
    
    // Wait for promises to resolve
    await new Promise(process.nextTick);
    
    // Verify both export styles work
    expect(mockRouter.get).toHaveBeenCalledWith('/direct-export', expect.any(Function));
    expect(mockRouter.post).toHaveBeenCalledWith('/default-export', expect.any(Function));
  });
});
