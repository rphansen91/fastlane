import { attachRoutes, appErrorHandler } from '../index';

describe('index', () => {
    it('should export attachRoutes', () => {
      expect(typeof attachRoutes).toBe('function');
    });
    it('should export appErrorHandler', () => {
      expect(typeof appErrorHandler).toBe('function');
    });
});
