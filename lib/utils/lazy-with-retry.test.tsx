import lazyWithRetry from './lazy-with-retry';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Suspense } from 'react';
import { error } from 'console';
describe('lazyWithRetry', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      value: {
        reload: vi.fn(),
      },
      writable: true,
    });
    const sessionStorageMock = (() => {
      let store: Record<string, string> = {};
      return {
        getItem: vi.fn((key: string): string | null => store[key] || null),
        setItem: vi.fn((key: string, value: string): void => {
          store[key] = value;
        }),
        clear: vi.fn((): void => {
          store = {};
        }),
      };
    })();

    Object.defineProperty(window, 'sessionStorage', {
      value: sessionStorageMock,
      writable: true,
    });
  });

  test('should render the fallback component on failure', async () => {
    const FallbackComponent = () => <div>Fallback</div>;
    const importFunction = vi.fn(() => Promise.reject(new Error('Failed')));

    const LazyComponent = lazyWithRetry(importFunction, {
      failFallbackComponent: FallbackComponent,
      retries: 0,
    });

    render(
      <Suspense fallback={<div>Loading...</div>}>
        <LazyComponent />
      </Suspense>,
    );

    // Wait for the fallback component to appear
    expect(await screen.findByText('Fallback')).toBeInTheDocument();
  });

  test('should retry loading the component', async () => {
    const MockComponent = () => <div>Loaded</div>;
    const importFunction = vi
      .fn()
      .mockRejectedValueOnce(new Error('Failed'))
      .mockResolvedValueOnce({ default: MockComponent });

    const LazyComponent = lazyWithRetry(importFunction, {
      interval: 1,
    });

    render(
      <Suspense fallback={<div>Loading...</div>}>
        <LazyComponent />
      </Suspense>,
    );

    // Wait for the retried component to appear
    expect(await screen.findByText('Loaded')).toBeInTheDocument();
  });

  test('should call onRetry and onFailure callbacks', async () => {
    const FallbackComponent = () => <div>Fallback</div>;
    const importFunction = vi
      .fn()
      .mockRejectedValueOnce(
        new Error(
          'Failed to fetch dynamically imported module: http://example.com',
        ),
      )
      .mockRejectedValueOnce(new Error('Failed'))
      .mockRejectedValueOnce(new Error('Failed again'));

    const onRetry = vi.fn();
    const onFailure = vi.fn();

    const LazyComponent = lazyWithRetry(importFunction, {
      failFallbackComponent: FallbackComponent,
      interval: 1,
      retries: 2,
      onRetry,
      onFailure,
    });

    render(
      <Suspense fallback={<div>Loading...</div>}>
        <LazyComponent />
      </Suspense>,
    );

    // Wait for the fallback component to appear
    await screen.findByText('Fallback');

    expect(onRetry).toHaveBeenCalledTimes(2);
    expect(onFailure).toHaveBeenCalledWith(expect.any(Error));
  });

  test('should handle forceRefreshOptions and refresh the page', async () => {
    const importFunction = vi
      .fn()
      .mockRejectedValueOnce(new Error('Failed'))
      .mockRejectedValueOnce(new Error('Failed again'));

    vi.mock('./bust-cache-and-retry', () => ({
      default: vi.fn(),
    }));

    const onRefresh = vi.fn();
    const forceRefreshOptions = {
      refreshRetries: 1,
      sessionCacheKey: 'test-key',
    };

    const LazyComponent = lazyWithRetry(importFunction, {
      retries: 0,
      interval: 1,
      forceRefreshOptions,
      onRefresh,
    });

    render(
      <Suspense fallback={<div>Loading...</div>}>
        <LazyComponent />
      </Suspense>,
    );
    await vi.waitFor(() => {
      if (onRefresh.mock.calls.length <= 0)
        throw error('waiting for refresh to be called');
    });
    console.log(onRefresh.mock.calls.length);
    expect(onRefresh).toHaveBeenCalledTimes(1);
    expect(window.sessionStorage.setItem).toHaveBeenCalledWith(
      'retry-lazy-refresh-for-test-key',
      '0',
    );
  });

  test('should use default fallback component when failFallbackComponent is not provided', async () => {
    const importFunction = vi.fn(() => Promise.reject(new Error('Failed')));

    const LazyComponent = lazyWithRetry(importFunction);

    render(
      <Suspense fallback={<div>Loading...</div>}>
        <LazyComponent />
      </Suspense>,
    );

    // Verify that no fallback UI is displayed since the default fallback is an empty function
    expect(screen.queryByText('Fallback')).not.toBeInTheDocument();
  });
});
