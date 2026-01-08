import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import { API_ENDPOINTS } from "../../config/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faVideo } from "@fortawesome/free-solid-svg-icons";
import UserIcon from "../../assets/UserIcon";

export default function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [results, setResults] = useState({ videos: [], channels: [] });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all"); // all, videos, channels

  useEffect(() => {
    if (query.trim()) {
      performSearch(query);
    } else {
      setResults({ videos: [], channels: [] });
    }
  }, [query]);

  const performSearch = async (searchQuery) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_ENDPOINTS.SEARCH}?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatViews = (views) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  const filteredVideos = activeTab === "channels" ? [] : results.videos;
  const filteredChannels = activeTab === "videos" ? [] : results.channels;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-[#0f0f0f]">
      <Navbar />
      <div className="max-w-[90rem] mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
            Search results for "{query}"
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400">
            {results.videos.length + results.channels.length} results
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-neutral-200 dark:border-neutral-800">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === "all"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
            }`}
          >
            All ({results.videos.length + results.channels.length})
          </button>
          <button
            onClick={() => setActiveTab("videos")}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === "videos"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
            }`}
          >
            Videos ({results.videos.length})
          </button>
          <button
            onClick={() => setActiveTab("channels")}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === "channels"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
            }`}
          >
            Channels ({results.channels.length})
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-neutral-600 dark:text-neutral-400">
            Searching...
          </div>
        ) : (
          <div className="space-y-8">
            {/* Channels Section */}
            {filteredChannels.length > 0 && (
              <div>
                {activeTab === "all" && (
                  <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
                    Channels
                  </h2>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredChannels.map((channel) => (
                    <Link
                      key={channel.id}
                      to={`/channel/${channel.id}`}
                      className="flex items-center gap-4 p-4 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:shadow-lg transition-shadow"
                    >
                      <img
                        src={channel.avatar}
                        alt={channel.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                          {channel.name}
                        </h3>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                          {channel.followerCount.toLocaleString()} {channel.followerName}
                        </p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-500">
                          <FontAwesomeIcon icon={faVideo} className="mr-1" />
                          {channel.videoCount} videos
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Videos Section */}
            {filteredVideos.length > 0 && (
              <div>
                {activeTab === "all" && filteredChannels.length > 0 && (
                  <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
                    Videos
                  </h2>
                )}
                <div className="space-y-4">
                  {filteredVideos.map((video) => (
                    <Link
                      key={video.id}
                      to={`/watch/${video.id}`}
                      className="flex gap-4 p-4 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex-shrink-0 w-48 h-28 bg-neutral-200 dark:bg-neutral-800 rounded-lg overflow-hidden">
                        {video.thumbnailUrl ? (
                          <img
                            src={video.thumbnailUrl}
                            alt={video.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-neutral-400">
                            <FontAwesomeIcon icon={faVideo} size="2x" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg text-neutral-900 dark:text-neutral-100 line-clamp-2 mb-2">
                          {video.title}
                        </h3>
                        <div className="flex items-center gap-2 mb-2">
                          {video.uploader.avatar && video.uploader.avatar.trim() !== '' ? (
                            <img
                              src={video.uploader.avatar}
                              alt=""
                              className="w-6 h-6 rounded-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center" style={{ display: (video.uploader.avatar && video.uploader.avatar.trim() !== '') ? 'none' : 'flex' }}>
                            <UserIcon className="w-3 h-3 text-white" />
                          </div>
                          <span className="text-sm text-neutral-600 dark:text-neutral-400">
                            {video.uploader.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-neutral-500 dark:text-neutral-500">
                          <span>
                            <FontAwesomeIcon icon={faEye} className="mr-1" />
                            {formatViews(video.views)} views
                          </span>
                          <span>•</span>
                          <span>{formatDate(video.createdAt)}</span>
                        </div>
                        {video.description && (
                          <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2 mt-2">
                            {video.description}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {!loading && filteredVideos.length === 0 && filteredChannels.length === 0 && query.trim() && (
              <div className="text-center py-12">
                <p className="text-xl text-neutral-600 dark:text-neutral-400 mb-2">
                  No results found for "{query}"
                </p>
                <p className="text-neutral-500 dark:text-neutral-500">
                  Try different keywords or check your spelling
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
