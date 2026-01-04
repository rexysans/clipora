import VideoPlayer from "../../components/VideoPlayer/VideoPlayer";
import { useRef, useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import { API_ENDPOINTS } from "../../config/api";
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

const VIEW_THRESHOLD = 20;

function Watch() {
  const playerRef = useRef(null);
  const { videoId } = useParams();
  const navigate = useNavigate();
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
        console.log('Video data received:', data);
        console.log('Uploader data:', data.uploader);
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

    try {
      const res = await fetch(
        API_ENDPOINTS.PROGRESS_BY_VIDEO_USER(videoId, userId)
      );
      if (res.ok) {
        const data = await res.json();
        if (data.progress_seconds > 0) {
          player.currentTime(data.progress_seconds);
        }
      }
    } catch (err) {
      console.error("Failed to restore progress:", err);
    }

    let progressInterval;

    player.on("play", () => {
      startViewTracking();

      progressInterval = setInterval(() => {
        const currentTime = player.currentTime();
        fetch(API_ENDPOINTS.PROGRESS, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            videoId,
            userId,
            progressSeconds: currentTime,
          }),
        }).catch(() => {});
      }, 5000);
    });

    player.on("pause", () => {
      cancelViewTracking();
      clearInterval(progressInterval);
    });

    player.on("seeking", () => {
      cancelViewTracking();
    });

    player.on("dispose", () => {
      clearInterval(progressInterval);
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

                  {/* Uploader Info - Clickable */}
                  {videoData.uploader && (
                    <div className="flex items-center justify-between mb-4 p-3 -ml-3">
                      <Link
                        to={`/channel/${videoData.uploader.id}`}
                        className="flex items-center gap-3 hover:bg-neutral-200 dark:hover:bg-neutral-700 p-3 rounded-lg transition-colors -ml-3"
                      >
                        <img
                          src={videoData.uploader.avatar}
                          alt={videoData.uploader.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-semibold text-base">
                            {videoData.uploader.name}
                          </p>
                          <p className="text-xs text-neutral-600 dark:text-neutral-400">
                            {videoData.uploader.followerCount || 0} {videoData.uploader.followerName || 'Subscribers'}
                          </p>
                        </div>
                      </Link>
                      {!isOwner && (
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