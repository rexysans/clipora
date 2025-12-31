import VideoPlayer from "../../components/VideoPlayer/VideoPlayer";
import { useRef, useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";

function Watch() {
  const playerRef = useRef(null);
  const { videoId } = useParams();
  const videoLink = `http://localhost:8080/hls/${videoId}/master.m3u8`;
  // Initialize theme from localStorage immediately
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved ? saved === "dark" : true;
  });
  
  // Apply theme whenever it changes
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

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
    description: "Loading...",
  });
  const [error, setError] = useState(null);
  // Expand/collapse description
  const [descExpanded, setDescExpanded] = useState(false);

  // All videos for recommendations
  const [allVideos, setAllVideos] = useState([]);

  useEffect(() => {
    // Fetch current video metadata
    const fetchVideoData = async () => {
      try {
        const res = await fetch(`http://localhost:5000/videos/${videoId}`);
        const data = await res.json();
        setVideoData({
          title: data.title,
          description: data.description || "No description available",
        });
      } catch (err) {
        setError("Failed to load video metadata");
      }
    };
    fetchVideoData();
  }, [videoId]);

  // Fetch all videos for recommendations
  useEffect(() => {
    fetch("http://localhost:5000/api/videos")
      .then((res) => res.json())
      .then((videos) => setAllVideos(videos.filter((v) => v.status === "ready" && v.id !== videoId)))
      .catch(() => {});
  }, [videoId]);

  // Pick random recommended videos - memoized to prevent reshuffling on re-renders
  const recommended = useMemo(() => {
    const shuffled = allVideos.slice().sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 5);
  }, [allVideos]);

  // Format date util (from Home)
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const diff = Math.floor((Date.now() - date) / (1000 * 60 * 60 * 24));
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    if (diff < 7) return `${diff} days ago`;
    if (diff < 30) return `${Math.floor(diff / 7)} weeks ago`;
    return `${Math.floor(diff / 30)} months ago`;
  };

  // Memoize videoPlayerOptions to prevent recreation on re-renders
  const videoPlayerOptions = useMemo(() => ({
    controls: true,
    responsive: true,
    fluid: true,
    sources: [
      {
        src: videoLink,
        type: "application/x-mpegURL",
      },
    ],
  }), [videoLink]);

  const handlePlayerReady = async (player) => {
    playerRef.current = player;
    const userId = getAnonymousUserId();

    // 🔑 Restore progress AFTER metadata loads
    player.one("loadedmetadata", async () => {
      const res = await fetch(
        `http://localhost:5000/progress/${videoId}/${userId}`
      );
      const data = await res.json();

      if (data.lastTime > 0) {
        player.currentTime(data.lastTime);
      }
    });

    // Save progress every 5s
    const interval = setInterval(() => {
      if (!player.paused()) {
        fetch("http://localhost:5000/progress", {
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

    player.on("pause", () => {
      fetch("http://localhost:5000/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          videoId,
          lastTime: player.currentTime(),
        }),
      });
    });

    player.on("dispose", () => clearInterval(interval));
  };

  return (
    <div className="flex flex-col items-center bg-neutral-50 dark:bg-[#0f0f0f] min-h-screen w-full text-neutral-900 dark:text-neutral-100">
      <div className="w-full max-w-6xl flex flex-col md:flex-row gap-8 mt-8 px-4">
        {/* Video Section */}
        <div className="flex-1 flex flex-col">
          <div className="rounded-xl overflow-hidden bg-black shadow-lg">
            <VideoPlayer options={videoPlayerOptions} onReady={handlePlayerReady} />
          </div>
          <div className="mt-6 bg-neutral-100 dark:bg-[#181818] rounded-xl p-6 shadow-md">
            {error ? (
              <p className="text-red-500 font-semibold">{error}</p>
            ) : (
              <>
                <h1 className="text-2xl md:text-3xl font-bold mb-2">{videoData.title}</h1>
                <div>
                  <p className={`text-gray-700 dark:text-gray-300 text-base md:text-lg whitespace-pre-line ${descExpanded ? '' : 'line-clamp-3'}`}>{videoData.description}</p>
                  {videoData.description && videoData.description.length > 120 && (
                    <button
                      type="button"
                      className="mt-2 text-indigo-600 dark:text-indigo-400 hover:underline text-sm font-medium"
                      onClick={() => setDescExpanded((v) => !v)}
                    >
                      {descExpanded ? 'Show less' : 'Show more'}
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
            <h2 className="text-lg font-semibold mb-4 text-neutral-900 dark:text-neutral-100">Recommended</h2>
            {recommended.length === 0 ? (
              <span className="text-gray-400 text-base">No recommendations</span>
            ) : (
              <div className="flex flex-col gap-4">
                {recommended.map((video) => (
                  <Link key={video.id} to={`/watch/${video.id}`} className="flex gap-3 group">
                    <div className="w-28 h-16 rounded-lg overflow-hidden bg-neutral-200 dark:bg-neutral-800 flex-shrink-0">
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        loading="lazy"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold leading-tight line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{video.title}</h3>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">Channel Name</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">0 views · {formatDate(video.created_at)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Watch;