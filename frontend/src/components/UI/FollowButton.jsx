import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserPlus, faUserCheck } from "@fortawesome/free-solid-svg-icons";
import { API_ENDPOINTS } from "../../config/api";
import { useAuth } from "../../app/AuthContext";

export default function FollowButton({ userId, initialFollowerCount, followerName = "Followers", onFollowChange }) {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(initialFollowerCount || 0);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const checkFollowStatus = async () => {
      try {
        const res = await fetch(API_ENDPOINTS.USER_FOLLOW_STATUS(userId), {
          credentials: "include",
        });
        if (res.ok && isMounted) {
          const data = await res.json();
          setIsFollowing(data.isFollowing);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Failed to check follow status:", err);
        }
      } finally {
        if (isMounted) {
          setCheckingStatus(false);
        }
      }
    };

    if (user && userId && user.id !== userId) {
      checkFollowStatus();
    } else {
      setCheckingStatus(false);
    }

    return () => {
      isMounted = false;
    };
  }, [user, userId]);

  const handleFollow = async () => {
    if (!user) {
      alert("Please log in to follow this channel");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(API_ENDPOINTS.USER_FOLLOW(userId), {
        method: isFollowing ? "DELETE" : "POST",
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setIsFollowing(data.isFollowing);
        setFollowerCount(data.followerCount);
        if (onFollowChange) {
          onFollowChange(data.isFollowing, data.followerCount);
        }
      } else {
        const error = await res.json();
        alert(error.error || "Failed to update follow status");
      }
    } catch (err) {
      console.error("Failed to update follow:", err);
      alert("Failed to update follow status");
    } finally {
      setLoading(false);
    }
  };

  // Don't show follow button for own channel or when not logged in on someone else's channel
  if (!user || user.id === userId) {
    return (
      <div className="text-sm text-neutral-600 dark:text-neutral-400">
        <span className="font-semibold text-neutral-900 dark:text-neutral-100">
          {followerCount.toLocaleString()}
        </span>{" "}
        {followerName}
      </div>
    );
  }

  if (checkingStatus) {
    return (
      <button
        disabled
        className="px-6 py-2 bg-neutral-200 dark:bg-neutral-700 text-neutral-400 dark:text-neutral-500 font-semibold rounded-lg cursor-not-allowed"
      >
        Loading...
      </button>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <div className="text-sm text-neutral-600 dark:text-neutral-400">
        <span className="font-semibold text-neutral-900 dark:text-neutral-100">
          {followerCount.toLocaleString()}
        </span>{" "}
        {followerName}
      </div>
      <button
        onClick={handleFollow}
        disabled={loading}
        className={`
          px-6 py-2 font-semibold rounded-lg transition-all
          ${
            isFollowing
              ? "bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-600"
              : "bg-accent hover:bg-accentSoft text-white"
          }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        {loading ? (
          "Loading..."
        ) : (
          <>
            <FontAwesomeIcon
              icon={isFollowing ? faUserCheck : faUserPlus}
              className="mr-2"
            />
            {isFollowing ? "Following" : "Follow"}
          </>
        )}
      </button>
    </div>
  );
}