import { ComponentType, lazy } from 'react';

export type TForceRefreshProps = {
  forceRefresh: boolean;
  sessionCacheKey: string;
};

export type TLazyRetryOptions = {
  retryCount?: number;
  interval?: number;
  forceRefreshOnFailure?: TForceRefreshProps;
};

const DEFAULT_RETRY_COUNT = 3;
const DEFAULT_INTERVAL = 500;

// Function to bust the cache and reload the page
const bustCacheAndRetry = () => {
  if (window.caches) {
    window.caches.keys().then((cacheNames) => {
      cacheNames.forEach((cacheName) => {
        window.caches.delete(cacheName);
      });
    })
      .catch(() => { }); // NO-OP if we cant delete the cache we proceed with normal reload.
  }
  // delete browser cache and hard reload
  window.location.reload();
};

const retryFunction = (
  fn: () => Promise<{ default: ComponentType<unknown>; }>,
  retriesLeft: number,
  interval: number,
  failFallbackComponent: ComponentType<unknown>,
  forceRefreshOnFailure?: TForceRefreshProps,
) => new Promise<{ default: ComponentType<unknown>; }>((resolve, reject) => {
  fn()
    .then(resolve)
    .catch((error: Error) => {
      setTimeout(() => {
        // This flags help us prevent infinite loop of refreshes
        let hasRefreshed = false;

        if (retriesLeft === 1) {
          // If we are forcing refresh on failure, we need to check if we have already refreshed the page
          if (forceRefreshOnFailure?.forceRefresh) {
            // Get or Set the Has refreshed flag from session
            hasRefreshed = JSON.parse(
              window.sessionStorage.getItem(`retry-lazy-refresh-for-${forceRefreshOnFailure?.sessionCacheKey}`) || 'false',
            );
          }
          // If we already tried to regresh the page, report it and fallback.
          if (hasRefreshed || !forceRefreshOnFailure?.forceRefresh) {
            // <Log here to your telemetry service>
            resolve({
              default: failFallbackComponent,
            });
            return;
          }
          // If we haven't refreshed yet, set the flag in session storage
          window.sessionStorage.setItem(`retry-lazy-refresh-for-${forceRefreshOnFailure?.sessionCacheKey}`, 'true');
          // Save a flag in session storage to prevent infinite loop of refreshes
          // then bust cache and reload the page
          bustCacheAndRetry();
        }
        // Passing on "reject" is the important part
        const bustedCacheUrl = new URL(
          error.message
            .replace('Failed to fetch dynamically imported module: ', '')
            .trim(),
        );
        bustedCacheUrl.searchParams.set('t', `${+new Date()}`);
        retryFunction(() => import(bustedCacheUrl.href), retriesLeft - 1, interval, failFallbackComponent, forceRefreshOnFailure)
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
    options?.forceRefreshOnFailure,
  ),
);

export default lazyWithRetry;
