import { Suspense } from 'react';
import lazy from '../lib/utils/lazy-with-retry';
import FallbackComponent from './components/fallback-component';

const HelloWorld = lazy(
  () =>
    import('./components/hello-world') as Promise<{
      default: React.ComponentType<unknown>;
    }>,
  {
    failFallbackComponent: FallbackComponent,
    retries: 5,
    interval: 1000,
    forceRefreshOptions: {
      sessionCacheKey: 'hello-world',
      cacheKeyPrefix: 'demo-app',
      refreshRetries: 2,
    },
    onRefresh: (_error: Error, refreshLeft: number) => {
      console.log(`Refreshing... ${refreshLeft} left`);
    },
    onRetry: (_error: Error, retriesLeft: number) => {
      console.log(`Retrying... ${retriesLeft} left`);
    },
    onFailure: (error: Error) => {
      console.error('Failed to load component:', error);
    },
  },
);

const App = () => {
  return (
    <>
      <Suspense fallback={<div>Loading...</div>}>
        <HelloWorld />
      </Suspense>
    </>
  );
};

export default App;
