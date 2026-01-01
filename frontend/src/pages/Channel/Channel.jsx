// frontend/src/pages/Channel/Channel.jsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faThumbsUp } from "@fortawesome/free-solid-svg-icons";
import Navbar from "../../components/Navbar/Navbar";
import Loader from "../../components/UI/Loader";
import ErrorMessage from "../../components/UI/ErrorMessage";
import { API_ENDPOINTS } from "../../config/api";

export default function Channel() {
  const { userId } = useParams();
  const [channelData, setChannelData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchChannelData = async () => {
      try {
        setLoading(true);
        const response = await fetch(API_ENDPOINTS.VIDEOS_BY_USER(userId), {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch channel data");
        }

        const data = await response.json();
        setChannelData(data);
      } catch (err) {
        console.error("Error fetching channel:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchChannelData();
  }, [userId]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)] bg-neutral-50 dark:bg-[#0f0f0f]">
          <Loader size="lg" />
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)] bg-neutral-50 dark:bg-[#0f0f0f] p-6">
          <ErrorMessage message={error} />
        </div>
      </>
    );
  }

  const { user, videos } = channelData;
  const readyVideos = videos.filter((v) => v.status === "ready");

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-neutral-50 dark:bg-[#0f0f0f] text-neutral-900 dark:text-neutral-100">
        <div className="max-w-[1600px] mx-auto px-6 py-8">
          {/* Channel Header */}
          <div className="mb-8 pb-6 border-b border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-6">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-neutral-800 shadow-lg"
              />
              <div>
                <h1 className="text-3xl font-bold mb-2">{user.name}</h1>
                <p className="text-neutral-600 dark:text-neutral-400">
                  {readyVideos.length} {readyVideos.length === 1 ? "video" : "videos"}
                </p>
              </div>
            </div>
          </div>

          {/* Videos Grid */}
          {readyVideos.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-neutral-500 dark:text-neutral-400 text-lg">
                This channel hasn't uploaded any videos yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {readyVideos.map((video) => {
                const likePercentage =
                  video.likes + video.dislikes > 0
                    ? (video.likes / (video.likes + video.dislikes)) * 100
                    : 0;

                return (
                  <Link
                    key={video.id}
                    to={`/watch/${video.id}`}
                    className="group block bg-white dark:bg-neutral-900 rounded-lg overflow-hidden shadow hover:shadow-lg transition-shadow"
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-video bg-neutral-300 dark:bg-neutral-700">
                      {video.thumbnailUrl ? (
                        <img
                          src={video.thumbnailUrl}
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-500">
                          No Thumbnail
                        </div>
                      )}
                    </div>

                    {/* Video Info */}
                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {video.title}
                      </h3>

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                        <div className="flex items-center gap-1.5">
                          <FontAwesomeIcon icon={faEye} className="text-xs" />
                          <span>{video.views.toLocaleString()} views</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <FontAwesomeIcon icon={faThumbsUp} className="text-xs" />
                          <span>{video.likes.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Like Bar */}
                      {video.likes + video.dislikes > 0 && (
                        <div className="w-full h-1 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-600 dark:bg-indigo-400 transition-all"
                            style={{ width: `${likePercentage}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
}