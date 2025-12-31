import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Loader from '../components/UI/Loader';
import ErrorMessage from '../components/UI/ErrorMessage';

const Watch = lazy(() => import('../pages/Watch/Watch'));
const Home = lazy(() => import('../pages/Home/Home'));

const LoadingFallback = () => (
  <div style={{ padding: '20px', textAlign: 'center' }}>
    <Loader size="md" />
  </div>
);

const ErrorElement = ({ error }) => (
  <div style={{ padding: '20px' }}>
    <ErrorMessage message={error?.message || 'Failed to load page'} />
  </div>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <Home />
      </Suspense>
    ),
    errorElement: <ErrorElement />
  },
  {
    path: '/watch/:videoId',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <Watch />
      </Suspense>
    ),
    errorElement: <ErrorElement />
  }
]);

export default function Routes() {
  return <RouterProvider router={router} />;
}
