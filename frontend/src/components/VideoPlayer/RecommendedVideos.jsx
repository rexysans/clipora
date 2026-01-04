import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faThumbsUp } from "@fortawesome/free-solid-svg-icons";
import WatchLaterButton from "../UI/WatchLaterButton";

export default function RecommendedVideos({ videos, currentVideoId }) {
  const navigate = useNavigate();

  const formatViews = (count) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const formatCount = (count) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return "just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
    return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
  };

  // Filter out current video and take only ready videos
  const recommendedVideos = videos
    .filter((v) => v.status === "ready" && v.id !== currentVideoId)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  const handleVideoClick = (videoId) => {
    navigate(`/watch/${videoId}`);
  };

  const handleChannelClick = (e, channelId) => {
    e.stopPropagation();
    navigate(`/channel/${channelId}`);
  };

  return (
    <div className="w-full md:w-[440px] lg:w-[480px] flex-shrink-0">
      <div className="bg-neutral-100 dark:bg-[#181818] rounded-xl p-4 shadow-md min-h-[300px]">
        <h2 className="text-lg font-semibold mb-4 text-neutral-900 dark:text-neutral-100">
          Recommended
        </h2>
        {recommendedVideos.length === 0 ? (
          <span className="text-gray-400 text-base">
            No recommendations
          </span>
        ) : (
          <div className="flex flex-col gap-4">
            {recommendedVideos.map((video) => (
              <div key={video.id} className="group">
                {/* Changed from Link to div with onClick */}
                <div
                  onClick={() => handleVideoClick(video.id)}
                  className="flex gap-3 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg p-2 transition cursor-pointer"
                >
                  {/* Thumbnail */}
                  <div className="relative w-52 h-32 bg-neutral-300 dark:bg-neutral-700 rounded-lg overflow-hidden flex-shrink-0">
                    {/* Watch Later Button */}
                    <WatchLaterButton 
                      videoId={video.id} 
                      className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100"
                    />
                    
                    {video.thumbnailUrl ? (
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-500 dark:text-neutral-400">
                        <svg
                          className="w-8 h-8"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  {/* Video Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm line-clamp-2 text-neutral-900 dark:text-neutral-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                      {video.title}
                    </h3>
                    
                    {/* Channel Info - Clickable */}
                    <div className="flex items-center gap-2 mt-2">
                      {/* Channel Avatar - Link to channel */}
                      {video.uploader?.avatar ? (
                        <div
                          onClick={(e) => handleChannelClick(e, video.uploader.id)}
                          className="flex-shrink-0 cursor-pointer"
                        >
                          <img
                            src={video.uploader.avatar}
                            alt={video.uploader.name}
                            className="w-6 h-6 rounded-full object-cover hover:ring-2 hover:ring-indigo-500 transition"
                          />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex-shrink-0" />
                      )}
                      
                      {/* Channel Name - Link to channel */}
                      <div className="flex-1 min-w-0">
                        <span
                          onClick={(e) => handleChannelClick(e, video.uploader?.id)}
                          className="text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors inline-block truncate cursor-pointer"
                        >
                          {video.uploader?.name || "Unknown"}
                        </span>
                      </div>
                    </div>
                    
                    {/* Views and Likes */}
                    <div className="flex items-center gap-2 mt-1 text-xs text-neutral-500 dark:text-neutral-500">
                      <span>{formatViews(video.views)} views</span>
                      <span className="text-neutral-400 dark:text-neutral-600">•</span>
                      <div className="flex items-center gap-1">
                        <FontAwesomeIcon icon={faThumbsUp} className="text-[9px]" />
                        <span>{formatCount(video.likes)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}