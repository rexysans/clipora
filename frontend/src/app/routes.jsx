// frontend/src/app/routes.jsx
import { createBrowserRouter } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Loader from '../components/UI/Loader';
import ErrorMessage from '../components/UI/ErrorMessage';
import ProtectedRoute from '../components/ProtectedRoute';

const Home = lazy(() => import('../pages/Home/Home'));
const Watch = lazy(() => import('../pages/Watch/Watch'));
const Upload = lazy(() => import('../pages/Upload/Upload'));
const Channel = lazy(() => import('../pages/Channel/Channel'));  // NEW
const Search = lazy(() => import('../pages/Search/Search'));
const Login = lazy(() => import('../pages/Login/Login'));
const Signup = lazy(() => import('../pages/Signup/Signup'));
const NotFound = lazy(() => import('../pages/NotFound/NotFound'));

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-neutral-50 dark:bg-[#0f0f0f]">
    <Loader size="lg" />
  </div>
);

const ErrorElement = ({ error }) => (
  <ErrorMessage message={error?.message || 'Failed to load page'} />
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <ProtectedRoute>
          <Home />
        </ProtectedRoute>
      </Suspense>
    ),
    errorElement: <ErrorElement />
  },
  {
    path: '/watch/:videoId',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <ProtectedRoute>
          <Watch />
        </ProtectedRoute>
      </Suspense>
    ),
    errorElement: <ErrorElement />
  },
  {
    path: '/upload',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <ProtectedRoute>
          <Upload />
        </ProtectedRoute>
      </Suspense>
    ),
    errorElement: <ErrorElement />
  },
  {
    path: '/channel/:userId',  // NEW
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <ProtectedRoute>
          <Channel />
        </ProtectedRoute>
      </Suspense>
    ),
    errorElement: <ErrorElement />
  },
  {
    path: '/search',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <ProtectedRoute>
          <Search />
        </ProtectedRoute>
      </Suspense>
    ),
    errorElement: <ErrorElement />
  },
  {
    path: '/login',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <Login />
      </Suspense>
    ),
    errorElement: <ErrorElement />
  },
  {
    path: '/signup',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <Signup />
      </Suspense>
    ),
    errorElement: <ErrorElement />
  },
  {
    path: '*',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <NotFound />
      </Suspense>
    )
  }
]);