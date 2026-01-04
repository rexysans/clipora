// frontend/src/app/routes.jsx
import { createBrowserRouter } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Loader from '../components/UI/Loader';
import ErrorMessage from '../components/UI/ErrorMessage';
import ProtectedRoute from '../components/ProtectedRoute';
import Layout from './Layout';

const Home = lazy(() => import('../pages/Home/Home'));
const Watch = lazy(() => import('../pages/Watch/Watch'));
const Upload = lazy(() => import('../pages/Upload/Upload'));
const Channel = lazy(() => import('../pages/Channel/Channel'));
const Search = lazy(() => import('../pages/Search/Search'));
const Following = lazy(() => import('../pages/Following/Following'));
const Liked = lazy(() => import('../pages/Liked/Liked'));
const History = lazy(() => import('../pages/History/History'));
const WatchLater = lazy(() => import('../pages/WatchLater/WatchLater'));
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
    element: <Layout />,
    errorElement: <ErrorElement />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          </Suspense>
        ),
      },
      {
        path: 'watch/:videoId',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <ProtectedRoute>
              <Watch />
            </ProtectedRoute>
          </Suspense>
        ),
      },
      {
        path: 'upload',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <ProtectedRoute>
              <Upload />
            </ProtectedRoute>
          </Suspense>
        ),
      },
      {
        path: 'channel/:userId',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <ProtectedRoute>
              <Channel />
            </ProtectedRoute>
          </Suspense>
        ),
      },
      {
        path: 'search',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <ProtectedRoute>
              <Search />
            </ProtectedRoute>
          </Suspense>
        ),
      },
      {
        path: 'following',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <ProtectedRoute>
              <Following />
            </ProtectedRoute>
          </Suspense>
        ),
      },
      {
        path: 'liked',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <ProtectedRoute>
              <Liked />
            </ProtectedRoute>
          </Suspense>
        ),
      },
      {
        path: 'history',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <ProtectedRoute>
              <History />
            </ProtectedRoute>
          </Suspense>
        ),
      },
      {
        path: 'watch-later',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <ProtectedRoute>
              <WatchLater />
            </ProtectedRoute>
          </Suspense>
        ),
      },
      {
        path: 'login',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <Login />
          </Suspense>
        ),
      },
      {
        path: 'signup',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <Signup />
          </Suspense>
        ),
      },
      {
        path: '*',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <NotFound />
          </Suspense>
        )
      }
    ]
  }
]);