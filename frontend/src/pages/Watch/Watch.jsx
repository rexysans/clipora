import VideoPlayer from "../../components/VideoPlayer/VideoPlayer";
import { useRef, useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import { API_ENDPOINTS } from "../../config/api";
import { useAuth } from "../../app/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faThumbsUp, faThumbsDown } from "@fortawesome/free-solid-svg-icons";

const VIEW_THRESHOLD = 30; // seconds - minimum watch time to count as a view

function Watch() {
  const playerRef = useRef(null);
  const { videoId } = useParams();
  const videoLink = `http://localhost:8080/hls/${videoId}/master.m3u8`;
  const { user } = useAuth();

  // View tracking refs
  const viewTimerStarted = useRef(false);
  const viewTimeoutId = useRef(null);

  function getAnonymousUserId() {
    let id = localStorage.getItem("anon_user_id");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("anon_user_id", id);
    }
    return id;
  }

  // Video metadata
  const [videoData, setVideoData] = useState({
    title: "Loading...",
    description: "",
    views: 0,
    likes: 0,
    dislikes: 0,
    userReaction: null,
  });
  const [error, setError] = useState(null);
  const [descExpanded, setDescExpanded] = useState(false);
  const [allVideos, setAllVideos] = useState([]);

  useEffect(() => {
    // Fetch current video metadata
    const fetchVideoData = async () => {
      try {
        const url = user 
          ? `${API_ENDPOINTS.VIDEO_BY_ID(videoId)}?userId=${user.id}`
          : API_ENDPOINTS.VIDEO_BY_ID(videoId);
        
        const res = await fetch(url);
        const data = await res.json();
        setVideoData({
          title: data.title,
          description: data.description || "",
          views: data.views || 0,
          likes: data.likes || 0,
          dislikes: data.dislikes || 0,
          userReaction: data.userReaction || null,
        });
      } catch (err) {
        setError("Failed to load video metadata");
      }
    };
    fetchVideoData();
  }, [videoId, user]);

  // Fetch all videos for recommendations
  useEffect(() => {
    fetch(API_ENDPOINTS.VIDEOS)
      .then((res) => res.json())
      .then((videos) =>
        setAllVideos(
          videos.filter((v) => v.status === "ready" && v.id !== videoId)
        )
      )
      .catch(() => {});
  }, [videoId]);

  // Pick random recommended videos
  const recommended = useMemo(() => {
    const shuffled = allVideos.slice().sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 5);
  }, [allVideos]);

  // Format date util
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const diff = Math.floor((Date.now() - date) / (1000 * 60 * 60 * 24));
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    if (diff < 7) return `${diff} days ago`;
    if (diff < 30) return `${Math.floor(diff / 7)} weeks ago`;
    return `${Math.floor(diff / 30)} months ago`;
  };

  // Format views count
  const formatViews = (count) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  // Format likes/dislikes count
  const formatCount = (count) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  // Handle like/dislike
  const handleReaction = async (reactionType) => {
    if (!user) {
      // Redirect to login if not authenticated
      window.location.href = "/login";
      return;
    }

    try {
      // If clicking the same reaction, remove it
      const reaction = videoData.userReaction === reactionType ? 'remove' : reactionType;

      const res = await fetch(API_ENDPOINTS.VIDEO_REACTION(videoId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reaction }),
      });

      if (res.ok) {
        const data = await res.json();
        setVideoData((prev) => ({
          ...prev,
          likes: data.likes,
          dislikes: data.dislikes,
          userReaction: data.userReaction,
        }));
      }
    } catch (err) {
      console.error("Failed to update reaction:", err);
    }
  };

  // Memoize videoPlayerOptions
  const videoPlayerOptions = useMemo(
    () => ({
      controls: true,
      responsive: true,
      fluid: true,
      sources: [
        {
          src: videoLink,
          type: "application/x-mpegURL",
        },
      ],
    }),
    [videoLink]
  );

  // Handle view tracking
  const startViewTracking = () => {
    if (!user) return;
    if (viewTimerStarted.current) return;

    viewTimerStarted.current = true;

    viewTimeoutId.current = setTimeout(() => {
      fetch(API_ENDPOINTS.VIDEO_VIEW(videoId), {
        method: "POST",
        credentials: "include",
      })
        .then((res) => {
          if (res.status === 201) {
            setVideoData((prev) => ({ ...prev, views: prev.views + 1 }));
          }
        })
        .catch((err) => {
          console.error("Failed to track view:", err);
        });
    }, VIEW_THRESHOLD * 1000);
  };

  const cancelViewTracking = () => {
    if (viewTimeoutId.current) {
      clearTimeout(viewTimeoutId.current);
      viewTimeoutId.current = null;
      viewTimerStarted.current = false;
    }
  };

  const handlePlayerReady = async (player) => {
    playerRef.current = player;
    const userId = getAnonymousUserId();

    player.one("loadedmetadata", async () => {
      const res = await fetch(
        API_ENDPOINTS.PROGRESS_BY_VIDEO_USER(videoId, userId)
      );
      const data = await res.json();

      if (data.lastTime > 0) {
        player.currentTime(data.lastTime);
      }
    });

    player.on("play", () => {
      startViewTracking();
    });

    player.on("pause", () => {
      cancelViewTracking();
      
      fetch(API_ENDPOINTS.PROGRESS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          videoId,
          lastTime: player.currentTime(),
        }),
      });
    });

    player.on("seeking", () => {
      cancelViewTracking();
    });

    const interval = setInterval(() => {
      if (!player.paused()) {
        fetch(API_ENDPOINTS.PROGRESS, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            videoId,
            lastTime: player.currentTime(),
          }),
        });
      }
    }, 5000);

    player.on("dispose", () => {
      clearInterval(interval);
      cancelViewTracking();
    });
  };

  useEffect(() => {
    return () => {
      cancelViewTracking();
    };
  }, []);

  return (
    <>
      <Navbar />

      <div className="flex flex-col items-center bg-neutral-50 dark:bg-[#0f0f0f] min-h-screen w-full text-neutral-900 dark:text-neutral-100">
        <div className="w-full max-w-6xl flex flex-col md:flex-row gap-8 mt-8 px-4">
          {/* Video Section */}
          <div className="flex-1 flex flex-col">
            <div className="rounded-xl overflow-hidden bg-black shadow-lg">
              <VideoPlayer
                options={videoPlayerOptions}
                onReady={handlePlayerReady}
              />
            </div>
            <div className="mt-6 bg-neutral-100 dark:bg-[#181818] rounded-xl p-6 shadow-md">
              {error ? (
                <p className="text-red-500 font-semibold">{error}</p>
              ) : (
                <>
                  <h1 className="text-2xl md:text-3xl font-bold mb-2">
                    {videoData.title}
                  </h1>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400">
                      <span className="font-semibold">
                        {formatViews(videoData.views)} views
                      </span>
                    </div>

                    {/* Like/Dislike Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleReaction('like')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full border transition ${
                          videoData.userReaction === 'like'
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-neutral-200 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-700'
                        }`}
                      >
                        <FontAwesomeIcon icon={faThumbsUp} />
                        <span className="text-sm font-semibold">
                          {formatCount(videoData.likes)}
                        </span>
                      </button>

                      <button
                        onClick={() => handleReaction('dislike')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full border transition ${
                          videoData.userReaction === 'dislike'
                            ? 'bg-red-600 text-white border-red-600'
                            : 'bg-neutral-200 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-700'
                        }`}
                      >
                        <FontAwesomeIcon icon={faThumbsDown} />
                        <span className="text-sm font-semibold">
                          {formatCount(videoData.dislikes)}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <p
                      className={`text-gray-700 dark:text-gray-300 text-base md:text-lg whitespace-pre-line ${
                        descExpanded ? "" : "line-clamp-3"
                      }`}
                    >
                      {videoData.description || "No description available"}
                    </p>
                    {videoData.description && videoData.description.length > 120 && (
                      <button
                        type="button"
                        className="mt-2 text-indigo-600 dark:text-indigo-400 hover:underline text-sm font-medium"
                        onClick={() => setDescExpanded((v) => !v)}
                      >
                        {descExpanded ? "Show less" : "Show more"}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Sidebar: Recommended videos */}
          <div className="w-full md:w-80 flex-shrink-0">
            <div className="bg-neutral-100 dark:bg-[#181818] rounded-xl p-4 shadow-md min-h-[300px]">
              <h2 className="text-lg font-semibold mb-4 text-neutral-900 dark:text-neutral-100">
                Recommended
              </h2>
              {recommended.length === 0 ? (
                <span className="text-gray-400 text-base">
                  No recommendations
                </span>
              ) : (
                <div className="flex flex-col gap-4">
                  {recommended.map((video) => (
                    <Link
                      key={video.id}
                      to={`/watch/${video.id}`}
                      className="flex gap-3 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg p-2 transition group"
                    >
                      <div className="w-40 h-24 bg-neutral-300 dark:bg-neutral-700 rounded-lg overflow-hidden flex-shrink-0">
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
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm line-clamp-2 text-neutral-900 dark:text-neutral-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                          {video.title}
                        </h3>
                        <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                          {formatDate(video.created_at)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Watch;