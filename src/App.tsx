import { Suspense } from 'react';
import lazy from '../lib/utils/lazy-with-retry';
import FallbackComponent from './components/fallback-component';

const HelloWorld = lazy(
  () =>
    import('./components/hello-world') as Promise<{
      default: React.ComponentType<unknown>;
    }>,
  FallbackComponent,
  {
    retries: 5,
    interval: 1000,
    forceRefreshOptions: {
      sessionCacheKey: 'hello-world',
      cacheKeyPrefix: 'demo-app',
      refreshRetries: 2,
    },
    onRefresh: (_error, refreshLeft) => {
      console.log(`Refreshing... ${refreshLeft} left`);
    },
    onRetry: (_error, retriesLeft) => {
      console.log(`Retrying... ${retriesLeft} left`);
    },
    onFailure: (error) => {
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
