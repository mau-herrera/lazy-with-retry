import { lazyWithRetry } from './main';

// Mock the lazyWithRetry function
vi.mock('./utils/lazy-with-retry', () => {
  return {
    default: vi.fn(() => 'mocked result'),
    lazyWithRetry: vi.fn(() => 'mocked result'),
  };
});

describe('main export', () => {
  it('should correctly import and call lazyWithRetry', () => {
    const result = lazyWithRetry(() =>
      Promise.resolve({ default: () => null }),
    );
    expect(result).toBe('mocked result');
  });
});
