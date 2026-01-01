import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import { API_ENDPOINTS } from "../../config/api";


export default function Home() {
  const [videos, setVideos] = useState([]);
  const [error, setError] = useState(null);

  // Fetch videos
  useEffect(() => {
    fetch(API_ENDPOINTS.VIDEOS)
      .then((res) => res.json())
      .then(setVideos)
      .catch(() => setError("Failed to load videos"));
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const diff = Math.floor((Date.now() - date) / (1000 * 60 * 60 * 24));
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    if (diff < 7) return `${diff} days ago`;
    if (diff < 30) return `${Math.floor(diff / 7)} weeks ago`;
    return `${Math.floor(diff / 30)} months ago`;
  };

  const readyVideos = videos.filter((v) => v.status === "ready");

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans">
      <Navbar />

      <main className="max-w-[1200px] mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold tracking-tight">
            Recommended
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Fresh uploads curated for you
          </p>
        </div>

        {/* EXACT YouTube grid */}
        <div
          className="
            grid
            grid-cols-1
            md:grid-cols-2
            lg:grid-cols-3
            gap-x-6
            gap-y-12
          "
        >
          {readyVideos.map((video) => (
            <Link key={video.id} to={`/watch/${video.id}`} className="group">
              <article>
                {/* Thumbnail */}
                <div
                  className="
                    relative aspect-video rounded-xl overflow-hidden
                    bg-neutral-200 dark:bg-neutral-800
                    shadow-sm group-hover:shadow-lg
                    transition
                  "
                >
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    loading="lazy"
                    className="
                      w-full h-full object-cover
                      transition-transform duration-300
                      group-hover:scale-105
                    "
                  />
                </div>

                {/* Info */}
                <div className="flex gap-3 mt-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex-shrink-0" />

                  <div className="min-w-0">
                    <h3
                      className="
                        text-[15px] font-semibold leading-snug
                        line-clamp-2
                        group-hover:text-indigo-600
                        dark:group-hover:text-indigo-400
                        transition-colors
                      "
                    >
                      {video.title}
                    </h3>

                    <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
                      Channel Name
                    </p>

                    <p className="text-xs text-neutral-500">
                      0 views · {formatDate(video.created_at)}
                    </p>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>

        {readyVideos.length === 0 && (
          <div className="text-center py-32 text-neutral-500 dark:text-neutral-400">
            No videos available
          </div>
        )}
      </main>
    </div>
  );
}
