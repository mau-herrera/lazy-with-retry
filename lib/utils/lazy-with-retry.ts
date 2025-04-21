import { ComponentType, lazy } from 'react';
import bustCacheAndRetry from './bust-cache-and-retry';

export type TForceRefreshOptions = {
  // Number of times to refresh the page if the lazy load fails
  refreshRetries?: number;

  // This is an optional cache key prefix that can be used to store the refresh flag in session storage
  // Default is 'retry-lazy-refresh-for-'
  cacheKeyPrefix?: string;

  // This is the key used to store the refresh flag in session storage
  // It should be unique for each lazy load component to prevent infinite loops
  sessionCacheKey: string;
};

export type TLazyRetryOptions = {
  // This is the fallback component to be used if the lazy load fails
  failFallbackComponent?: ComponentType<unknown>;

  // Number of times to retry loading the component before trying to refresh or falling back to the fallback component
  retries?: number;

  // Time in milliseconds to wait before retrying the load
  interval?: number;

  // This flag is used to force a refresh of the page if the lazy load fails
  // It should be used with caution as it can cause an infinite loop of refreshes if not handled properly
  forceRefreshOptions?: TForceRefreshOptions;

  // Callback function to be called when a refresh is attempted
  onRefresh?: (error: Error, refreshLeft: number) => void;

  // Callback function to be called when a retry is attempted
  onRetry?: (error: Error, retriesLeft: number) => void;

  // Callback fucntion to be called when everything fails
  onFailure?: (error: Error) => void;
};

const DEFAULT_RETRY_COUNT = 2;
const DEFAULT_REFRESH_COUNT = 0;
const DEFAULT_INTERVAL = 500;
const DEFAULT_CACHE_KEY_PREFIX = 'retry-lazy-refresh-for';

const retryFunction = (
  fn: () => Promise<{ default: ComponentType<unknown> }>,
  retriesLeft: number,
  interval: number,
  failFallbackComponent: ComponentType<unknown>,
  forceRefreshOptions?: TForceRefreshOptions,
  onRefresh?: (error: Error, refreshLeft: number) => void,
  onRetry?: (error: Error, retriesLeft: number) => void,
  onFailure?: (error: Error) => void,
) =>
  new Promise<{ default: ComponentType<unknown> }>((resolve, reject) => {
    fn()
      .then(resolve)
      .catch((error: Error) => {
        setTimeout(() => {
          // This flags help us prevent infinite loop of refreshes
          let refreshLeft =
            forceRefreshOptions?.refreshRetries || DEFAULT_REFRESH_COUNT;

          // If we have no retries left, we need to check if we are forcing refresh on failure
          if (retriesLeft <= 0) {
            // If we are forcing refresh on failure, we need to check if we have already refreshed the page enough times
            if (
              (forceRefreshOptions?.refreshRetries || DEFAULT_REFRESH_COUNT) > 0
            ) {
              // Get or Set the Has refreshed flag from session
              refreshLeft = Number(
                JSON.parse(
                  window.sessionStorage.getItem(
                    `${forceRefreshOptions?.cacheKeyPrefix || DEFAULT_CACHE_KEY_PREFIX}-${forceRefreshOptions?.sessionCacheKey}`,
                  ) || `${refreshLeft}`,
                ),
              );
            }
            // If we already tried to refresh the page (or forceRefresh is false), report it and fallback.
            if (refreshLeft <= 0) {
              onFailure?.(error);
              // If we have a fallback component, resolve with it
              resolve({
                default: failFallbackComponent,
              });
              return;
            }
            // If we haven't refreshed yet, or we have refreshes pending, set the flag in session storage
            window.sessionStorage.setItem(
              `${forceRefreshOptions?.cacheKeyPrefix || DEFAULT_CACHE_KEY_PREFIX}-${forceRefreshOptions?.sessionCacheKey}`,
              `${--refreshLeft}`,
            );
            // Save a flag in session storage to prevent infinite loop of refreshes
            // then bust cache and reload the page
            // Notify the user that we are refreshing
            onRefresh?.(error, refreshLeft);
            bustCacheAndRetry();
            return;
          }
          // Passing on "reject" is the important part
          // Ensure the error message is a valid URL before constructing a new URL
          let bustedCacheUrl: URL | undefined;
          try {
            bustedCacheUrl = new URL(
              error.message
                .replace('Failed to fetch dynamically imported module: ', '')
                .trim(),
            );
          } catch {
            // If the error message is not a valid URL, we can't bust the cache
            // and we need to retry the function instead
            bustedCacheUrl = undefined;
          }
          if (bustedCacheUrl) {
            bustedCacheUrl.searchParams.set('t', `${+new Date()}`);
          }
          // Notify the user that we are retrying
          onRetry?.(error, retriesLeft - 1);
          retryFunction(
            bustedCacheUrl
              ? () => import(/* @vite-ignore */ bustedCacheUrl.href)
              : fn,
            retriesLeft - 1,
            interval,
            failFallbackComponent,
            forceRefreshOptions,
            onRefresh,
            onRetry,
            onFailure,
          ).then(resolve, reject);
        }, interval);
      });
  });

const lazyWithRetry = (
  importFunction: () => Promise<{ default: ComponentType<unknown> }>,
  options?: TLazyRetryOptions,
) =>
  lazy(() =>
    retryFunction(
      importFunction,
      options?.retries !== undefined && options.retries >= 0
        ? options.retries
        : DEFAULT_RETRY_COUNT,
      options?.interval || DEFAULT_INTERVAL,
      options?.failFallbackComponent || (() => null),
      options?.forceRefreshOptions,
      options?.onRefresh,
      options?.onRetry,
      options?.onFailure,
    ),
  );

export default lazyWithRetry;
