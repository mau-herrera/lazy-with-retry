import { ComponentType, lazy } from 'react';

export type TLazyRetryOptions = {
  retryCount?: number;
  interval?: number;
};

const DEFAULT_RETRY_COUNT = 3;
const DEFAULT_INTERVAL = 500;

const retryFunction = (
  fn: () => Promise<{ default: ComponentType<unknown>; }>,
  retriesLeft: number,
  interval: number,
  failFallbackComponent: ComponentType<unknown>,
) => new Promise<{ default: ComponentType<unknown>; }>((resolve, reject) => {
  fn()
    .then(resolve)
    .catch((error: Error) => {
      setTimeout(() => {
        // If this is the last retry, resolve with the fallback component
        if (retriesLeft === 1) {
            console.error('Error loading module:', error);
            // <Log here to your telemetry service>
            resolve({
              default: failFallbackComponent,
            });
            return;
        }
        // To prevent browser from loading the failed cached version of the module, we need to modify the URL
        const bustedCacheUrl = new URL(
          error.message
            .replace('Failed to fetch dynamically imported module: ', '')
            .trim(),
        );
        // For demo purposes we hardcode the URL param. In real life, you might want to use a hash or a timestamp to bust the cache.
        bustedCacheUrl.searchParams.set('t', `${+new Date()}`);
        retryFunction(() => import(bustedCacheUrl.href), retriesLeft - 1, interval, failFallbackComponent)
          .then(resolve, reject);
      }, interval);
    });
});

const lazyWithRetry = (
  importFunction: () => Promise<{ default: ComponentType<unknown>; }>,
  failFallbackComponent: ComponentType<unknown> = () => null,
  options?: TLazyRetryOptions,
) => lazy(
  () => retryFunction(
    importFunction,
    options?.retryCount || DEFAULT_RETRY_COUNT,
    options?.interval || DEFAULT_INTERVAL,
    failFallbackComponent,
  ),
);

export default lazyWithRetry;
