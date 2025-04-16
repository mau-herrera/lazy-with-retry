import { lazy, Suspense } from 'react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router'
import LazyWithRetries from './utils/lazy-with-retries.tsx'
import LazyWithRefresh from './utils/lazy-with-refresh.tsx'
import './index.css'
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import App from './App.tsx'
import CircularIndeterminate from './components/CircularProgressIndeterminate.tsx'
import WithErrorBoundary from './components/WithErrorBoundary.tsx'
import ErrorFallback from './components/ErrorFallback.tsx'

import Bunny1 from './components/Bunny1.tsx';
const Bunny2 = lazy(() => import('./components/Bunny2.tsx'));
const Bunny3 = lazy(() => import('./components/Bunny3.tsx'));;
const Bunny4 = LazyWithRetries(() => import('./components/Bunny4.tsx'), ErrorFallback);
const Bunny5 = LazyWithRefresh(() => import('./components/Bunny5.tsx'), ErrorFallback, { forceRefreshOnFailure: {forceRefresh: true, sessionCacheKey: 'bunny5'} });
const Bunny6 = LazyWithRefresh(() => import('./components/Bunny6.tsx'), ErrorFallback, { forceRefreshOnFailure: {forceRefresh: true, sessionCacheKey: 'bunny6'} });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route path="bundled" element={<Bunny1 />} />
          <Route path="lazy-loaded" element={<Suspense fallback={<CircularIndeterminate />} ><Bunny2 /></Suspense>} />
          <Route path="lazy-loaded-with-error-boundary" element={<WithErrorBoundary><Suspense fallback={<CircularIndeterminate />} ><Bunny3 /></Suspense></WithErrorBoundary>} />
          <Route path="lazy-loaded-with-retries" element={<Suspense fallback={<CircularIndeterminate />} ><Bunny4 /></Suspense>} />
          <Route path="lazy-loaded-with-refresh" element={<Suspense fallback={<CircularIndeterminate />} ><Bunny5 /></Suspense>} />
          <Route path="lazy-loaded-prefetch" element={<Suspense fallback={<CircularIndeterminate />} ><Bunny6 /></Suspense>} />
          <Route path="*" element={<div>Not Found</div>} />
          <Route index element={<Bunny1 />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
