import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logger } from '../logger';

describe('Logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should log info messages', () => {
    const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    logger.info('Test message', { foo: 'bar' });
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should log error messages with context', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('Test error');
    logger.error('Error occurred', error, { context: 'test' });
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should format API request logs', () => {
    const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    logger.apiRequest('GET', '/api/test', { userId: '123' });
    expect(consoleSpy).toHaveBeenCalled();
  });
});
