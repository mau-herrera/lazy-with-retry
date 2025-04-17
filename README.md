# Lazy with Retry

`lazy-with-retry` is a utility library designed to enhance the React `lazy` function by adding retry and fallback mechanisms. It is particularly useful for dynamically importing components in React applications where network issues or other failures might prevent a component from loading successfully. This library ensures a better user experience by providing retries, fallback components, and even page refreshes as a last resort.

## Why Use `lazy-with-retry`?

Dynamic imports in React can fail due to various reasons, such as network instability or server issues. By default, React's `lazy` function does not provide a way to handle these failures gracefully. `lazy-with-retry` solves this problem by:

- Allowing multiple retries with customizable intervals.
- Providing a fallback component to display when retries fail.
- Optionally refreshing the page to attempt recovery.
- Offering hooks for custom error handling and retry logic.

## Installation

```bash
npm install lazy-with-retry
```

## Parameters

The `lazyWithRetry` function accepts the following parameters:

| Parameter               | Type                                                 | Description                                                                     |
| ----------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------- |
| `importFunction`        | `() => Promise<{ default: ComponentType<unknown> }>` | The function to dynamically import the component.                               |
| `failFallbackComponent` | `ComponentType<unknown>`                             | A fallback component to display if retries fail. Default is an empty component. |
| `options`               | `TLazyRetryOptions`                                  | Configuration options for retries, refreshes, and error handling.               |

### `TLazyRetryOptions`

| Option                  | Type                                          | Description                                             |
| ----------------------- | --------------------------------------------- | ------------------------------------------------------- |
| `retries`               | `number`                                      | Number of retry attempts. Default is `3`.               |
| `interval`              | `number`                                      | Time in milliseconds between retries. Default is `500`. |
| `forceRefreshOnFailure` | `TForceRefreshProps`                          | Configuration for forcing a page refresh on failure.    |
| `onRefresh`             | `(error: Error, refreshLeft: number) => void` | Callback for when a refresh is attempted.               |
| `onRetry`               | `(error: Error, retriesLeft: number) => void` | Callback for when a retry is attempted.                 |
| `onFailure`             | `(error: Error) => void`                      | Callback for when all retries fail.                     |

### `TForceRefreshProps`

| Option            | Type     | Description                                                             |
| ----------------- | -------- | ----------------------------------------------------------------------- |
| `refreshRetries`  | `number` | Number of page refresh attempts. Default is `0`.                        |
| `cacheKeyPrefix`  | `string` | Prefix for session storage keys. Default is `'retry-lazy-refresh-for'`. |
| `sessionCacheKey` | `string` | Unique key for session storage to prevent infinite refresh loops.       |

## Usage

Here is an example of how to use `lazy-with-retry`:

```tsx
import React from 'react';
import lazyWithRetry from './utils/lazy-with-retry';
import FallbackComponent from './components/fallback-component';

const HelloWorld = lazyWithRetry(
  () => import('./components/hello-world'),
  FallbackComponent,
  {
    retries: 3,
    interval: 1000,
    forceRefreshOnFailure: {
      forceRefresh: true,
      refreshRetries: 2,
      sessionCacheKey: 'hello-world-refresh',
    },
    onRetry: (error, retriesLeft) => {
      console.error(`Retrying... ${retriesLeft} retries left`, error);
    },
    onRefresh: (error, refreshLeft) => {
      console.warn(`Refreshing... ${refreshLeft} refreshes left`, error);
    },
    onFailure: (error) => {
      console.error('Failed to load component', error);
    },
  },
);

const App = () => (
  <React.Suspense fallback={<div>Loading...</div>}>
    <HelloWorld />
  </React.Suspense>
);

export default App;
```

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
