import VideoPlayer from "../../components/VideoPlayer/VideoPlayer";
import { useRef, useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import { API_ENDPOINTS} from "../../config/api";
import { useAuth } from "../../app/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faThumbsUp,
  faThumbsDown,
  faEdit,
  faTrash,
  faEllipsisV,
} from "@fortawesome/free-solid-svg-icons";
import ConfirmModal from "../../components/UI/ConfirmModal";
import VideoEditModal from "../../components/UI/VideoEditModal";
import RecommendedVideos from "../../components/VideoPlayer/RecommendedVideos";
import CommentSection from "../../components/Comments/CommentSection";
import FollowButton from "../../components/UI/FollowButton";
import WatchLaterButton from "../../components/UI/WatchLaterButton";

const VIEW_THRESHOLD = 5; // 5 seconds - reasonable for both short and long videos

function Watch() {
  const playerRef = useRef(null);
  const { videoId } = useParams();
  const navigate = useNavigate();
  const videoLink = API_ENDPOINTS.HLS_STREAM(videoId);
  const { user } = useAuth();

  const viewTimerStarted = useRef(false);
  const viewTimeoutId = useRef(null);
  const currentVideoIdRef = useRef(videoId); // Track current videoId for event listeners

  function getAnonymousUserId() {
    let id = localStorage.getItem("anon_user_id");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("anon_user_id", id);
    }
    return id;
  }

  const [videoData, setVideoData] = useState({
    title: "Loading...",
    description: "",
    views: 0,
    likes: 0,
    dislikes: 0,
    commentCount: 0,
    userReaction: null,
    uploader: null,
    thumbnailUrl: null,
  });
  const [error, setError] = useState(null);
  const [descExpanded, setDescExpanded] = useState(false);
  const [allVideos, setAllVideos] = useState([]);

  // Video menu state
  const [showVideoMenu, setShowVideoMenu] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteVideoModal, setDeleteVideoModal] = useState(false);

  // Comments state
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [postingComment, setPostingComment] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState(new Set());

  // Modal state
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    commentId: null,
    isReply: false,
    parentId: null,
  });

  // Check if current user owns the video
  const isOwner = user && videoData.uploader && user.id === videoData.uploader.id;

  useEffect(() => {
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
          commentCount: data.commentCount || 0,
          userReaction: data.userReaction || null,
          uploader: data.uploader || null,
          thumbnailUrl: data.thumbnailUrl || null,
        });
      } catch (err) {
        setError("Failed to load video metadata");
      }
    };
    fetchVideoData();
  }, [videoId, user]);

  // Fetch comments
  useEffect(() => {
    const fetchComments = async () => {
      setLoadingComments(true);
      setComments([]); // Clear previous comments
      try {
        const res = await fetch(API_ENDPOINTS.VIDEO_COMMENTS(videoId));
        const data = await res.json();
        setComments(data);
      } catch (err) {
        console.error("Failed to load comments:", err);
        setComments([]); // Ensure empty on error
      } finally {
        setLoadingComments(false);
      }
    };
    fetchComments();
  }, [videoId]);

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

  // Pick recommended videos - use stable sort with date
  const recommended = useMemo(() => {
    return allVideos
      .slice()
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5);
  }, [allVideos]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return "just now";
    if (diffMins < 60)
      return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    if (diffDays < 30)
      return `${Math.floor(diffDays / 7)} week${
        Math.floor(diffDays / 7) > 1 ? "s" : ""
      } ago`;
    return `${Math.floor(diffDays / 30)} month${
      Math.floor(diffDays / 30) > 1 ? "s" : ""
    } ago`;
  };

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

  const toggleReplies = (commentId) => {
    setExpandedReplies((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  const handleReaction = async (reactionType) => {
    if (!user) {
      window.location.href = "/login";
      return;
    }

    try {
      const reaction =
        videoData.userReaction === reactionType ? "remove" : reactionType;

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

  // Edit video
  const handleEditVideo = async (updatedData) => {
    try {
      const res = await fetch(API_ENDPOINTS.VIDEO_UPDATE(videoId), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updatedData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update video");
      }

      const data = await res.json();
      setVideoData((prev) => ({
        ...prev,
        title: data.title,
        description: data.description,
      }));
    } catch (err) {
      throw err;
    }
  };

  // Update thumbnail
  const handleThumbnailUpdate = async (thumbnailFile) => {
    if (!user) {
      throw new Error("You must be logged in to update thumbnail");
    }

    const formData = new FormData();
    formData.append("thumbnail", thumbnailFile);

    const response = await fetch(API_ENDPOINTS.VIDEO_THUMBNAIL(videoId), {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to upload thumbnail");
    }

    const data = await response.json();

    // Update video state with new thumbnail URL
    setVideoData((prev) => ({
      ...prev,
      thumbnailUrl: data.thumbnailUrl,
    }));

    return data;
  };

// Delete thumbnail (revert to default)
const handleThumbnailDelete = async (videoId) => {
  if (!user) {
    throw new Error("You must be logged in to delete thumbnail");
  }

  const response = await fetch(API_ENDPOINTS.VIDEO_THUMBNAIL(videoId), {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete thumbnail");
  }

  const data = await response.json();

  // Update video state with new thumbnail URL (default or null)
  setVideoData((prev) => ({
    ...prev,
    thumbnailUrl: data.thumbnailUrl,
  }));

  return data;
};

  // Delete video
  const handleDeleteVideo = async () => {
    try {
      const res = await fetch(API_ENDPOINTS.VIDEO_DELETE(videoId), {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete video");
      }

      // Redirect to home after deletion
      navigate("/");
    } catch (err) {
      console.error("Failed to delete video:", err);
      alert(err.message || "Failed to delete video");
    }
  };

  // Post comment
  const handlePostComment = async (content) => {
    if (!user) {
      window.location.href = "/login";
      return;
    }

    if (!content || !content.trim()) return;

    setPostingComment(true);
    try {
      const res = await fetch(API_ENDPOINTS.VIDEO_COMMENTS(videoId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: content.trim() }),
      });

      if (res.ok) {
        const newComment = await res.json();
        console.log('New comment posted:', newComment);
        setComments(prev => [newComment, ...prev]);
        setVideoData((prev) => ({
          ...prev,
          commentCount: prev.commentCount + 1,
        }));
      } else {
        const error = await res.json();
        console.error('Failed to post comment:', error);
        alert(error.error || 'Failed to post comment');
      }
    } catch (err) {
      console.error("Failed to post comment:", err);
      alert('Failed to post comment. Please try again.');
    } finally {
      setPostingComment(false);
    }
  };

  // Post reply
  const handlePostReply = async (parentCommentId, content) => {
    if (!user) {
      window.location.href = "/login";
      return;
    }

    try {
      const res = await fetch(API_ENDPOINTS.VIDEO_COMMENTS(videoId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          content,
          parentCommentId,
        }),
      });

      if (res.ok) {
        const newReply = await res.json();

        setComments((prevComments) => {
          return prevComments.map((comment) => {
            if (comment.id === parentCommentId) {
              return {
                ...comment,
                replies: [...(comment.replies || []), newReply],
                reply_count: (comment.reply_count || 0) + 1,
              };
            }
            return comment;
          });
        });

        setVideoData((prev) => ({
          ...prev,
          commentCount: prev.commentCount + 1,
        }));
      }
    } catch (err) {
      console.error("Failed to post reply:", err);
    }
  };

  // Edit comment
  const handleEditComment = async (commentId, newContent, isReply, parentId) => {
    if (!user) return;

    try {
      const res = await fetch(
        API_ENDPOINTS.COMMENT_BY_ID(videoId, commentId),
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ content: newContent }),
        }
      );

      if (res.ok) {
        const updatedComment = await res.json();

        if (isReply && parentId) {
          setComments((prevComments) =>
            prevComments.map((comment) => {
              if (comment.id === parentId) {
                return {
                  ...comment,
                  replies: comment.replies.map((reply) =>
                    reply.id === commentId ? updatedComment : reply
                  ),
                };
              }
              return comment;
            })
          );
        } else {
          setComments((prevComments) =>
            prevComments.map((comment) =>
              comment.id === commentId
                ? { ...comment, ...updatedComment }
                : comment
            )
          );
        }
      }
    } catch (err) {
      console.error("Failed to edit comment:", err);
    }
  };

  // Delete comment
  const openDeleteModal = (commentId, isReply, parentId) => {
    setDeleteModal({
      isOpen: true,
      commentId,
      isReply,
      parentId,
    });
  };

  const handleDeleteComment = async () => {
    const { commentId, isReply, parentId } = deleteModal;
    if (!user || !commentId) return;

    try {
      const res = await fetch(
        API_ENDPOINTS.COMMENT_BY_ID(videoId, commentId),
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (res.ok) {
        const data = await res.json();

        if (isReply && parentId) {
          setComments((prevComments) =>
            prevComments.map((comment) => {
              if (comment.id === parentId) {
                return {
                  ...comment,
                  replies: comment.replies.filter((r) => r.id !== commentId),
                  reply_count: Math.max(0, (comment.reply_count || 1) - 1),
                };
              }
              return comment;
            })
          );
        } else {
          setComments((prevComments) =>
            prevComments.filter((c) => c.id !== commentId)
          );
        }

        setVideoData((prev) => ({
          ...prev,
          commentCount: Math.max(0, prev.commentCount - data.deletedCount),
        }));
      }
    } catch (err) {
      console.error("Failed to delete comment:", err);
    } finally {
      setDeleteModal({ isOpen: false, commentId: null, isReply: false, parentId: null });
    }
  };

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

  const startViewTracking = () => {
    if (!user) {
      console.log('[View] User not logged in, skipping view tracking');
      return;
    }
    if (viewTimerStarted.current) {
      console.log('[View] View tracking already started');
      return;
    }

    console.log('[View] Starting view tracking timer (5 seconds)');
    viewTimerStarted.current = true;
    const trackingVideoId = currentVideoIdRef.current; // Capture current videoId

    viewTimeoutId.current = setTimeout(() => {
      console.log('[View] 5 seconds elapsed, tracking view for video:', trackingVideoId);
      fetch(API_ENDPOINTS.VIDEO_VIEW(trackingVideoId), {
        method: "POST",
        credentials: "include",
      })
        .then(async (res) => {
          if (res.status === 201) {
            console.log('[View] View tracked successfully - NEW view added');
            // Only update if still on the same video
            if (trackingVideoId === currentVideoIdRef.current) {
              setVideoData((prev) => ({ ...prev, views: prev.views + 1 }));
            }
          } else if (res.status === 204) {
            console.log('[View] View already tracked for this user on this video');
          } else {
            const errorData = await res.json().catch(() => ({}));
            console.log('[View] View tracking response:', res.status, errorData);
          }
        })
        .catch((err) => {
          console.error('[View] Failed to track view:', err);
        });
    }, VIEW_THRESHOLD * 1000);
  };

  const cancelViewTracking = () => {
    if (viewTimeoutId.current) {
      clearTimeout(viewTimeoutId.current);
      viewTimeoutId.current = null;
      viewTimerStarted.current = false;
      console.log('[View] View tracking canceled');
    }
  };

  const handlePlayerReady = async (player) => {
    playerRef.current = player;
    // Use authenticated user ID if logged in, otherwise use anonymous ID
    const userId = user?.id || getAnonymousUserId();

    // Function to save progress
    const saveProgress = () => {
      if (!player || player.isDisposed()) return;
      const currentTime = player.currentTime();
      if (currentTime > 0) {
        fetch(API_ENDPOINTS.PROGRESS, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            videoId,
            userId,
            lastTime: currentTime,
          }),
        }).catch(() => {});
      }
    };

    // Fetch saved progress
    let savedProgress = 0;
    try {
      const res = await fetch(
        API_ENDPOINTS.PROGRESS_BY_VIDEO_USER(videoId, userId)
      );
      if (res.ok) {
        const data = await res.json();
        console.log('[Progress] Fetched from backend:', data);
        savedProgress = data.lastTime || 0;
      }
    } catch (err) {
      console.error("Failed to restore progress:", err);
    }

    // If there's saved progress, seek to it when the stream is ready
    if (savedProgress > 0) {
      console.log('[Progress] Will seek to:', savedProgress);
      
      const trySeek = () => {
        try {
          const duration = player.duration();
          console.log('[Progress] Duration:', duration, 'Seeking to:', savedProgress);
          
          if (duration && duration > savedProgress) {
            player.currentTime(savedProgress);
            console.log('[Progress] Successfully seeked to:', savedProgress);
          } else {
            console.log('[Progress] Cannot seek - duration not ready or invalid');
          }
        } catch (e) {
          console.error('[Progress] Seek failed:', e);
        }
      };

      // Try multiple events to ensure we catch when the stream is ready
      if (player.readyState() >= 3) {
        // HAVE_FUTURE_DATA or better - can seek
        setTimeout(trySeek, 100);
      } else {
        // Wait for the player to have enough data
        player.one('canplay', () => {
          setTimeout(trySeek, 100);
        });
      }
    }

    let progressInterval;

    player.on("play", () => {
      startViewTracking();

      progressInterval = setInterval(() => {
        if (!player || player.isDisposed()) {
          clearInterval(progressInterval);
          return;
        }
        saveProgress();
      }, 5000);
    });

    player.on("pause", () => {
      // Don't cancel view tracking on pause - let it complete
      clearInterval(progressInterval);
      // Save progress immediately when paused
      saveProgress();
    });

    // Don't cancel view tracking on seeking - let it complete
    // (removed player.on("seeking") handler to allow view tracking to persist)

    player.on("dispose", () => {
      clearInterval(progressInterval);
      cancelViewTracking();
      // Save progress immediately before player is disposed
      saveProgress();
    });

    // Save progress when user leaves the page
    const handleBeforeUnload = () => {
      saveProgress();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup function to remove event listener
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      saveProgress();
    };
  };

  // Handle progress restoration when videoId changes (e.g., clicking recommended videos)
  useEffect(() => {
    const restoreProgress = async () => {
      if (!playerRef.current || playerRef.current.isDisposed()) return;
      
      const player = playerRef.current;
      const userId = user?.id || getAnonymousUserId();

      try {
        const res = await fetch(
          API_ENDPOINTS.PROGRESS_BY_VIDEO_USER(videoId, userId)
        );
        if (res.ok) {
          const data = await res.json();
          console.log('[Progress] Restored on videoId change:', data);
          
          if (data.lastTime > 0) {
            const trySeek = () => {
              try {
                const duration = player.duration();
                if (duration && duration > data.lastTime) {
                  player.currentTime(data.lastTime);
                  console.log('[Progress] Seeked to:', data.lastTime);
                }
              } catch (e) {
                console.error('[Progress] Seek failed:', e);
              }
            };

            if (player.readyState() >= 3) {
              setTimeout(trySeek, 100);
            } else {
              player.one('canplay', () => {
                setTimeout(trySeek, 100);
              });
            }
          }
        }
      } catch (err) {
        console.error("Failed to restore progress:", err);
      }
    };

    // Small delay to ensure player has loaded the new source
    const timer = setTimeout(restoreProgress, 200);
    return () => clearTimeout(timer);
  }, [videoId, user]);

  // Cleanup on unmount only (not on videoId change)
  useEffect(() => {
    return () => {
      cancelViewTracking();
    };
  }, []);

  // Reset view tracking when videoId changes
  useEffect(() => {
    currentVideoIdRef.current = videoId; // Update ref with current videoId
    viewTimerStarted.current = false;
    if (viewTimeoutId.current) {
      clearTimeout(viewTimeoutId.current);
      viewTimeoutId.current = null;
    }
  }, [videoId]);

  return (
    <>
      <Navbar />

      {/* Delete Comment Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
        onConfirm={handleDeleteComment}
        title="Delete Comment"
        message="Are you sure you want to delete this comment? This action cannot be undone."
      />

      {/* Delete Video Modal */}
      <ConfirmModal
        isOpen={deleteVideoModal}
        onClose={() => setDeleteVideoModal(false)}
        onConfirm={handleDeleteVideo}
        title="Delete Video"
        message="Are you sure you want to delete this video? This action cannot be undone and will remove all comments and reactions."
      />

      {/* Edit Video Modal */}
<VideoEditModal
  isOpen={editModalOpen}
  onClose={() => setEditModalOpen(false)}
  onSave={handleEditVideo}
  onThumbnailUpdate={handleThumbnailUpdate}
  onThumbnailDelete={handleThumbnailDelete}  // Add this line
  video={{
    id: videoId,
    title: videoData.title,
    description: videoData.description,
    thumbnailUrl: videoData.thumbnailUrl,
  }}
/>

      <div className="flex flex-col items-center bg-neutral-50 dark:bg-[#0f0f0f] min-h-screen w-full text-neutral-900 dark:text-neutral-100">
        <div className="w-full max-w-[90rem] flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8 mt-4 sm:mt-6 lg:mt-8 px-4 sm:px-6">
          {/* Video Section */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="rounded-lg sm:rounded-xl overflow-hidden bg-black shadow-lg aspect-video">
              <VideoPlayer
                options={videoPlayerOptions}
                onReady={handlePlayerReady}
              />
            </div>

            {/* Video Info */}
            <div className="mt-4 sm:mt-6 bg-neutral-100 dark:bg-[#181818] rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-md">
              {error ? (
                <p className="text-red-500 font-semibold text-sm sm:text-base">{error}</p>
              ) : (
                <>
                  {/* Title and Menu */}
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h1 className="text-2xl md:text-3xl font-bold flex-1">
                      {videoData.title}
                    </h1>
                    
                    {/* Owner Actions */}
                    {isOwner && (
                      <div className="relative">
                        <button
                          onClick={() => setShowVideoMenu(!showVideoMenu)}
                          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 transition"
                        >
                          <FontAwesomeIcon
                            icon={faEllipsisV}
                            className="text-neutral-600 dark:text-neutral-400"
                          />
                        </button>

                        {showVideoMenu && (
                          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-neutral-200 dark:border-neutral-700 py-2 z-10">
                            <button
                              onClick={() => {
                                setEditModalOpen(true);
                                setShowVideoMenu(false);
                              }}
                              className="w-full px-4 py-2 text-left hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-3 text-neutral-900 dark:text-neutral-100"
                            >
                              <FontAwesomeIcon icon={faEdit} className="text-sm" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => {
                                setDeleteVideoModal(true);
                                setShowVideoMenu(false);
                              }}
                              className="w-full px-4 py-2 text-left hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 text-red-600 dark:text-red-400"
                            >
                              <FontAwesomeIcon icon={faTrash} className="text-sm" />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400">
                      <span className="font-semibold">
                        {formatViews(videoData.views)} views
                      </span>
                    </div>

                    {/* Like/Dislike/Watch Later Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleReaction("like")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full border transition ${
                          videoData.userReaction === "like"
                            ? "bg-accent text-white border-accent"
                            : "bg-neutral-200 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-700"
                        }`}
                      >
                        <FontAwesomeIcon icon={faThumbsUp} />
                        <span className="text-sm font-semibold">
                          {formatCount(videoData.likes)}
                        </span>
                      </button>

                      <button
                        onClick={() => handleReaction("dislike")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full border transition ${
                          videoData.userReaction === "dislike"
                            ? "bg-red-600 text-white border-red-600"
                            : "bg-neutral-200 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-700"
                        }`}
                      >
                        <FontAwesomeIcon icon={faThumbsDown} />
                        <span className="text-sm font-semibold">
                          {formatCount(videoData.dislikes)}
                        </span>
                      </button>
                      
                      <WatchLaterButton 
                        videoId={videoId} 
                        className="w-10 h-10 bg-neutral-200 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-700"
                      />
                    </div>
                  </div>

                  {/* Uploader Info - Clickable */}
                  {videoData.uploader && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 p-3 -ml-3">
                      <Link
                        to={`/channel/${videoData.uploader.id}`}
                        className="flex items-center gap-3 hover:bg-neutral-200 dark:hover:bg-neutral-700 p-3 rounded-lg transition-colors -ml-3 w-full sm:w-auto"
                      >
                        <img
                          src={videoData.uploader.avatar}
                          alt={videoData.uploader.name}
                          className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-base truncate">
                            {videoData.uploader.name}
                          </p>
                          <p className="text-xs text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                            {videoData.uploader.followerCount || 0} {videoData.uploader.followerName || 'Subscribers'}
                          </p>
                        </div>
                      </Link>
                      {!isOwner && (
                        <div className="w-full sm:w-auto sm:ml-3">
                          <FollowButton
                            userId={videoData.uploader.id}
                            initialFollowerCount={videoData.uploader.followerCount || 0}
                            followerName={videoData.uploader.followerName || 'Subscribers'}
                            onFollowChange={(isFollowing, newCount) => {
                              setVideoData(prev => ({
                                ...prev,
                                uploader: {
                                  ...prev.uploader,
                                  followerCount: newCount
                                }
                              }));
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <p
                      className={`text-gray-700 dark:text-gray-300 text-base md:text-lg whitespace-pre-line ${
                        descExpanded ? "" : "line-clamp-3"
                      }`}
                    >
                      {videoData.description || "No description available"}
                    </p>
                    {videoData.description &&
                      videoData.description.length > 120 && (
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

            {/* Recommended videos - Show on mobile before comments */}
            <div className="w-full max-w-5xl mx-auto block lg:hidden">
              <RecommendedVideos videos={recommended} currentVideoId={videoId} />
            </div>

            {/* Comments Section */}
            <div className="w-full max-w-5xl mx-auto">
              <CommentSection
                videoId={videoId}
                user={user}
                comments={comments}
                commentCount={videoData.commentCount}
                loadingComments={loadingComments}
                postingComment={postingComment}
                onPostComment={handlePostComment}
                onPostReply={handlePostReply}
                onEditComment={handleEditComment}
                onDeleteComment={(commentId, isReply, parentId) =>
                  openDeleteModal(commentId, isReply, parentId)
                }
              />
            </div>
          </div>

          {/* Sidebar: Recommended videos - Desktop only */}
          <div className="hidden lg:block">
            <RecommendedVideos videos={recommended} currentVideoId={videoId} />
          </div>
        </div>
      </div>
    </>
  );
}
export default Watch;