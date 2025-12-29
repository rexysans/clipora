import VideoPlayer from "../components/VideoPlayer";
import { useRef, useState, useEffect } from "react";


function Watch() {
  const playerRef = useRef(null);
  const videoId = "4cc6ecd3-24c4-412f-bdf8-76c7733692a6"; // Could be from URL params
  const videoLink = `http://localhost:5000/hls/${videoId}/master.m3u8`;
  
  const [videoData, setVideoData] = useState({
    title: "Loading...",
    description: "Loading...",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVideoData = async () => {
      try {
        const response = await fetch(`http://localhost:5000/videos/${videoId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch video data");
        }
        const data = await response.json();
        setVideoData({
          title: data.title,
          description: data.description || "No description available",
        });
        setLoading(false);
      } catch (err) {
        console.error("Error fetching video data:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchVideoData();
  }, [videoId]);

  const videoPlayerOptions = {
    controls: true,
    responsive: true,
    fluid: true,
    sources: [
      {
        src: videoLink,
        type: "application/x-mpegURL",
      },
    ],
  };

  const handlePlayerReady = (player) => {
    playerRef.current = player;

    // You can handle player events here, for example:
    player.on("waiting", () => {
      videojs.log("player is waiting");
    });

    player.on("dispose", () => {
      videojs.log("player will dispose");
    });
  };

  return (
    <>
      <div style={{ padding: "20px" }}>
        {error ? (
          <p style={{ color: "red" }}>Error: {error}</p>
        ) : (
          <>
            <h1>{videoData.title}</h1>
            <p style={{ color: "#666", marginTop: "10px" }}>
              {videoData.description}
            </p>
          </>
        )}
      </div>
      <VideoPlayer options={videoPlayerOptions} onReady={handlePlayerReady} />
    </>
  );
}

export default Watch;