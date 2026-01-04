import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faCheck } from "@fortawesome/free-solid-svg-icons";
import { API_ENDPOINTS } from "../../config/api";
import { useAuth } from "../../app/AuthContext";

function WatchLaterButton({ videoId, className = "" }) {
  const { user } = useAuth();
  const [inWatchLater, setInWatchLater] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      checkWatchLaterStatus();
    }
  }, [user, videoId]);

  const checkWatchLaterStatus = async () => {
    try {
      const res = await fetch(API_ENDPOINTS.VIDEO_WATCH_LATER_STATUS(videoId), {
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setInWatchLater(data.inWatchLater);
      }
    } catch (err) {
      console.error("Error checking watch later status:", err);
    }
  };

  const handleToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      alert("Please sign in to save videos");
      return;
    }

    if (loading) return;

    setLoading(true);

    try {
      if (inWatchLater) {
        const res = await fetch(API_ENDPOINTS.VIDEO_WATCH_LATER(videoId), {
          method: "DELETE",
          credentials: "include",
        });

        if (res.ok) {
          setInWatchLater(false);
        }
      } else {
        const res = await fetch(API_ENDPOINTS.VIDEO_WATCH_LATER(videoId), {
          method: "POST",
          credentials: "include",
        });

        if (res.ok) {
          setInWatchLater(true);
        }
      }
    } catch (err) {
      console.error("Error toggling watch later:", err);
      alert("Failed to update watch later");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`
        w-8 h-8 rounded-full 
        bg-black/70 hover:bg-black/90 
        flex items-center justify-center 
        transition-all
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      title={inWatchLater ? "Remove from Watch Later" : "Add to Watch Later"}
    >
      <FontAwesomeIcon
        icon={inWatchLater ? faCheck : faPlus}
        className={`text-sm ${inWatchLater ? "text-accent" : "text-white"}`}
      />
    </button>
  );
}

export default WatchLaterButton;
