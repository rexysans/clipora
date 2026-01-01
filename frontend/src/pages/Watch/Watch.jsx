import VideoPlayer from "../../components/VideoPlayer/VideoPlayer";
import { useRef, useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import { API_ENDPOINTS } from "../../config/api";
import { useAuth } from "../../app/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faThumbsUp,
  faThumbsDown,
  faComment,
  faReply,
  faEdit,
  faTrash,
  faPaperPlane,
  faChevronDown,
  faChevronUp,
} from "@fortawesome/free-solid-svg-icons";
import ConfirmModal from "../../components/UI/ConfirmModal";
import RecommendedVideos from "../../components/VideoPlayer/RecommendedVideos";
import CommentSection from "../../components/Comments/CommentSection";

const VIEW_THRESHOLD = 20;

function Watch() {
  const playerRef = useRef(null);
  const { videoId } = useParams();
  const videoLink = `http://localhost:8080/hls/${videoId}/master.m3u8`;
  const { user } = useAuth();

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

  const [videoData, setVideoData] = useState({
    title: "Loading...",
    description: "",
    views: 0,
    likes: 0,
    dislikes: 0,
    commentCount: 0,
    userReaction: null,
  });
  const [error, setError] = useState(null);
  const [descExpanded, setDescExpanded] = useState(false);
  const [allVideos, setAllVideos] = useState([]);

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
      try {
        const res = await fetch(API_ENDPOINTS.VIDEO_COMMENTS(videoId));
        const data = await res.json();
        setComments(data);
      } catch (err) {
        console.error("Failed to load comments:", err);
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
    // Sort by created_at consistently instead of random
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

  // Post comment
  const handlePostComment = async () => {
    if (!user) {
      window.location.href = "/login";
      return;
    }

    if (!commentText.trim()) return;

    setPostingComment(true);
    try {
      const res = await fetch(API_ENDPOINTS.VIDEO_COMMENTS(videoId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: commentText }),
      });

      if (res.ok) {
        const newComment = await res.json();
        setComments([newComment, ...comments]);
        setCommentText("");
        setVideoData((prev) => ({
          ...prev,
          commentCount: prev.commentCount + 1,
        }));
      }
    } catch (err) {
      console.error("Failed to post comment:", err);
    } finally {
      setPostingComment(false);
    }
  };

  // Post reply
  const handlePostReply = async (parentId) => {
    if (!user) {
      window.location.href = "/login";
      return;
    }

    if (!replyText.trim()) return;

    try {
      const res = await fetch(API_ENDPOINTS.VIDEO_COMMENTS(videoId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          content: replyText,
          parentCommentId: parentId,
        }),
      });

      if (res.ok) {
        const newReply = await res.json();
        setComments(
          comments.map((c) => {
            if (c.id === parentId) {
              return {
                ...c,
                replies: [...c.replies, newReply],
                replyCount: c.replyCount + 1,
              };
            }
            return c;
          })
        );
        setReplyText("");
        setReplyingTo(null);
        setVideoData((prev) => ({
          ...prev,
          commentCount: prev.commentCount + 1,
        }));
        // Auto-expand replies when user posts a reply
        setExpandedReplies((prev) => new Set(prev).add(parentId));
      }
    } catch (err) {
      console.error("Failed to post reply:", err);
    }
  };

  // Open delete modal
  const openDeleteModal = (commentId, isReply = false, parentId = null) => {
    setDeleteModal({
      isOpen: true,
      commentId,
      isReply,
      parentId,
    });
  };

  // Delete comment
  const handleDeleteComment = async () => {
    const { commentId, isReply, parentId } = deleteModal;

    try {
      const res = await fetch(API_ENDPOINTS.COMMENT_BY_ID(videoId, commentId), {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        if (isReply) {
          setComments(
            comments.map((c) => {
              if (c.id === parentId) {
                return {
                  ...c,
                  replies: c.replies.filter((r) => r.id !== commentId),
                  replyCount: c.replyCount - 1,
                };
              }
              return c;
            })
          );
        } else {
          const deletedComment = comments.find((c) => c.id === commentId);
          const totalDeleted = 1 + (deletedComment?.replyCount || 0);
          setComments(comments.filter((c) => c.id !== commentId));
          setVideoData((prev) => ({
            ...prev,
            commentCount: prev.commentCount - totalDeleted,
          }));
        }
      }
    } catch (err) {
      console.error("Failed to delete comment:", err);
    }
  };

  // Edit comment
  const handleEditComment = async (commentId, isReply, parentId) => {
    if (!editText.trim()) return;

    try {
      const res = await fetch(API_ENDPOINTS.COMMENT_BY_ID(videoId, commentId), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: editText }),
      });

      if (res.ok) {
        const updated = await res.json();
        if (isReply) {
          setComments(
            comments.map((c) => {
              if (c.id === parentId) {
                return {
                  ...c,
                  replies: c.replies.map((r) =>
                    r.id === commentId
                      ? {
                          ...r,
                          content: updated.content,
                          updatedAt: updated.updatedAt,
                        }
                      : r
                  ),
                };
              }
              return c;
            })
          );
        } else {
          setComments(
            comments.map((c) =>
              c.id === commentId
                ? {
                    ...c,
                    content: updated.content,
                    updatedAt: updated.updatedAt,
                  }
                : c
            )
          );
        }
        setEditingComment(null);
        setEditText("");
      }
    } catch (err) {
      console.error("Failed to edit comment:", err);
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

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
        onConfirm={handleDeleteComment}
        title="Delete Comment"
        message="Are you sure you want to delete this comment? This action cannot be undone."
      />

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

            {/* Video Info */}
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
                        onClick={() => handleReaction("like")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full border transition ${
                          videoData.userReaction === "like"
                            ? "bg-indigo-600 text-white border-indigo-600"
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

            {/* Comments Section */}
            <CommentSection
              videoId={videoId}
              user={user}
              comments={comments}
              commentCount={videoData.commentCount}
              onPostComment={handlePostComment}
              onPostReply={handlePostReply}
              onEditComment={handleEditComment}
              onDeleteComment={(commentId, isReply, parentId) =>
                openDeleteModal(commentId, isReply, parentId)
              }
            />
          </div>

          {/* Sidebar: Recommended videos */}
          <RecommendedVideos videos={allVideos} currentVideoId={videoId} />
        </div>
      </div>
    </>
  );
}

export default Watch;
