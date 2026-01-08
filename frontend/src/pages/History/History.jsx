import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import { API_ENDPOINTS } from "../../config/api";
import { useAuth } from "../../app/AuthContext";
import Loader from "../../components/UI/Loader";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faThumbsUp } from "@fortawesome/free-solid-svg-icons";
import UserIcon from "../../assets/UserIcon";

function History() {
  const { user } = useAuth();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(API_ENDPOINTS.VIDEOS_HISTORY(user.id), {
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error("Failed to fetch watch history");
        }

        const data = await res.json();
        setVideos(data);
      } catch (err) {
        console.error("Error fetching watch history:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const diff = Math.floor((Date.now() - date) / (1000 * 60 * 60 * 24));
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    if (diff < 7) return `${diff} days ago`;
    if (diff < 30) return `${Math.floor(diff / 7)} weeks ago`;
    return `${Math.floor(diff / 30)} months ago`;
  };

  const formatViews = (count) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count;
  };

  const formatCount = (count) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count;
  };

  const calculateLikePercentage = (likes, dislikes) => {
    const total = likes + dislikes;
    if (total === 0) return 0;
    return Math.round((likes / total) * 100);
  };

  if (!user) {
    return (
      <>
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-50 dark:bg-bg px-4">
          <div className="text-center max-w-md">
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white mb-4">
              Sign in to see your watch history
            </h1>
            <p className="text-neutral-600 dark:text-textSecondary mb-6">
              Log in to view videos you've watched
            </p>
            <Link
              to="/login"
              className="inline-block px-6 py-3 bg-accent hover:bg-accentSoft text-white font-semibold rounded-lg transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-neutral-50 dark:bg-bg text-neutral-900 dark:text-white">
        <div className="max-w-[90rem] mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">
              Watch History
            </h1>
            <p className="text-neutral-600 dark:text-textSecondary">
              Videos you've watched
            </p>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader size="lg" />
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-red-500 dark:text-red-400 text-lg">{error}</p>
            </div>
          ) : videos.length === 0 ? (
            <div className="text-center py-20">
              <div className="max-w-md mx-auto">
                <svg
                  className="w-20 h-20 mx-auto mb-4 text-neutral-400 dark:text-neutral-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h2 className="text-xl font-semibold mb-2">
                  No watch history yet
                </h2>
                <p className="text-neutral-600 dark:text-textSecondary mb-6">
                  Videos you watch will appear here
                </p>
                <Link
                  to="/"
                  className="inline-block px-6 py-3 bg-accent hover:bg-accentSoft text-white font-semibold rounded-lg transition-colors"
                >
                  Explore Videos
                </Link>
              </div>
            </div>
          ) : (
            <div
              className="
                grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
                gap-x-4 gap-y-8
                sm:gap-x-6 sm:gap-y-10
                lg:gap-x-8 lg:gap-y-12
              "
            >
              {videos.map((video) => (
                <article key={video.id}>
                  {/* Thumbnail */}
                  <Link to={`/watch/${video.id}`} className="group block">
                    <div className="relative aspect-video xl:aspect-[16/10] rounded-xl overflow-hidden bg-neutral-200 dark:bg-neutral-800 shadow-sm group-hover:shadow-lg transition">
                      {video.thumbnailUrl ? (
                        <img
                          src={video.thumbnailUrl}
                          alt={video.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-800 dark:to-neutral-900">
                          <svg
                            className="w-16 h-16 text-neutral-400 dark:text-neutral-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Video Info */}
                  <div className="mt-3 space-y-2">
                    {/* Title */}
                    <Link
                      to={`/watch/${video.id}`}
                      className="block group-hover:text-accent transition-colors"
                    >
                      <h3 className="text-sm sm:text-base font-semibold line-clamp-2 leading-tight">
                        {video.title}
                      </h3>
                    </Link>

                    {/* Channel Info */}
                    {video.uploader && (
                      <Link
                        to={`/channel/${video.uploader.id}`}
                        className="flex items-center gap-2 hover:text-accent transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-neutral-300 dark:bg-neutral-700 flex-shrink-0 relative">
                          {video.uploader.avatar && video.uploader.avatar.trim() !== '' ? (
                            <img
                              src={video.uploader.avatar}
                              alt=""
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-500 absolute inset-0" style={{ display: (video.uploader.avatar && video.uploader.avatar.trim() !== '') ? 'none' : 'flex' }}>
                            <UserIcon className="w-4 h-4 text-white" />
                          </div>
                        </div>
                        <span className="text-xs sm:text-sm text-neutral-600 dark:text-textSecondary">
                          {video.uploader.name}
                          {video.uploader.username && (
                            <span className="text-neutral-500 dark:text-neutral-500"> • @{video.uploader.username}</span>
                          )}
                        </span>
                      </Link>
                    )}

                    {/* Views and Date */}
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-neutral-600 dark:text-textSecondary">
                      <span>{formatViews(video.views)} views</span>
                      <span>•</span>
                      <span>Watched {formatDate(video.viewed_at)}</span>
                    </div>

                    {/* Like Bar and Count */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="h-1 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-accent transition-all"
                            style={{ width: `${calculateLikePercentage(video.likes, video.dislikes)}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-textSecondary">
                        <FontAwesomeIcon icon={faThumbsUp} className="text-accent" />
                        <span>{formatCount(video.likes)}</span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default History;
