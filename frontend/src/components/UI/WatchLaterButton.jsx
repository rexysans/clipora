import { useState, useEffect, useRef } from "react"; // Added useRef
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faCheck } from "@fortawesome/free-solid-svg-icons";
import { API_ENDPOINTS } from "../../config/api";
import { useAuth } from "../../app/AuthContext";

function WatchLaterButton({ videoId, className = "" }) {
  const { user } = useAuth();
  const [inWatchLater, setInWatchLater] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Ref to track mount status for the event handler
  const isMounted = useRef(true);

  useEffect(() => {
    // 1. Create AbortController
    const controller = new AbortController();
    const signal = controller.signal;

    // Reset ref on mount
    isMounted.current = true;

    const checkWatchLaterStatus = async () => {
      if (!user) return;
      
      try {
        // 2. Pass signal to fetch
        const res = await fetch(API_ENDPOINTS.VIDEO_WATCH_LATER_STATUS(videoId), {
          credentials: "include",
          signal: signal, 
        });

        if (res.ok) {
          const data = await res.json();
          // The AbortController handles the cleanup, but checking ref is double safety
          if (isMounted.current) {
            setInWatchLater(data.inWatchLater);
          }
        }
      } catch (err) {
        // 3. Ignore errors caused by aborting
        if (err.name === 'AbortError') return;
        console.error("Error checking watch later status:", err);
      }
    };

    checkWatchLaterStatus();

    return () => {
      // 4. Cancel the request and update ref on unmount
      controller.abort();
      isMounted.current = false;
    };
  }, [user, videoId]);

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
      const method = inWatchLater ? "DELETE" : "POST";
      const res = await fetch(API_ENDPOINTS.VIDEO_WATCH_LATER(videoId), {
        method,
        credentials: "include",
      });

      // 5. Check if still mounted before updating state after user interaction
      if (isMounted.current && res.ok) {
        setInWatchLater(!inWatchLater);
      }
    } catch (err) {
      console.error("Error toggling watch later:", err);
      alert("Failed to update watch later");
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
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