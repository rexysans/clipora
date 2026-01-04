// frontend/src/pages/Channel/Channel.jsx
import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faThumbsUp,
  faEdit,
  faTrash,
  faEllipsisV,
} from "@fortawesome/free-solid-svg-icons";
import Navbar from "../../components/Navbar/Navbar";
import Loader from "../../components/UI/Loader";
import ErrorMessage from "../../components/UI/ErrorMessage";
import ConfirmModal from "../../components/UI/ConfirmModal";
import VideoEditModal from "../../components/UI/VideoEditModal";
import FollowButton from "../../components/UI/FollowButton";
import FollowerSettingsModal from "../../components/UI/FollowerSettingsModal";
import { API_ENDPOINTS } from "../../config/api";
import { useAuth } from "../../app/AuthContext";
import ProcessingVideoCard from "../../components/UI/ProcessingVideoCard";

export default function Channel() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [channelData, setChannelData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeVideoMenu, setActiveVideoMenu] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    videoId: null,
  });
  const [followerSettingsOpen, setFollowerSettingsOpen] = useState(false);

  const isOwnChannel = user && user.id === userId;

  useEffect(() => {
    const fetchChannelData = async () => {
      try {
        setLoading(true);
        const response = await fetch(API_ENDPOINTS.VIDEOS_BY_USER(userId), {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch channel data");
        }

        const data = await response.json();
        setChannelData(data);
      } catch (err) {
        console.error("Error fetching channel:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchChannelData();
  }, [userId]);

  const handleEditVideo = async (updatedData) => {
    try {
      const res = await fetch(API_ENDPOINTS.VIDEO_UPDATE(editingVideo.id), {
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

      // Update video in the list
      setChannelData((prev) => ({
        ...prev,
        videos: prev.videos.map((v) =>
          v.id === editingVideo.id
            ? { ...v, title: data.title, description: data.description }
            : v
        ),
      }));
    } catch (err) {
      throw err;
    }
  };

  // Handle thumbnail update
  const handleThumbnailUpdate = async (thumbnailFile) => {
    if (!user) {
      throw new Error("You must be logged in to update thumbnail");
    }

    const formData = new FormData();
    formData.append("thumbnail", thumbnailFile);

    const response = await fetch(
      API_ENDPOINTS.VIDEO_THUMBNAIL(editingVideo.id),
      {
        method: "POST",
        credentials: "include",
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to upload thumbnail");
    }

    const data = await response.json();

    // Update video thumbnail in the list
    setChannelData((prev) => ({
      ...prev,
      videos: prev.videos.map((v) =>
        v.id === editingVideo.id ? { ...v, thumbnailUrl: data.thumbnailUrl } : v
      ),
    }));

    return data;
  };

  // Add this new handler after handleThumbnailUpdate
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

    // Update video thumbnail in the list (revert to default)
    setChannelData((prev) => ({
      ...prev,
      videos: prev.videos.map((v) =>
        v.id === videoId ? { ...v, thumbnailUrl: data.thumbnailUrl } : v
      ),
    }));

    return data;
  };

  const handleDeleteVideo = async () => {
    try {
      const res = await fetch(API_ENDPOINTS.VIDEO_DELETE(deleteModal.videoId), {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete video");
      }

      // Remove video from the list
      setChannelData((prev) => ({
        ...prev,
        videos: prev.videos.filter((v) => v.id !== deleteModal.videoId),
      }));

      setDeleteModal({ isOpen: false, videoId: null });
    } catch (err) {
      console.error("Failed to delete video:", err);
      alert(err.message || "Failed to delete video");
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)] bg-neutral-50 dark:bg-[#0f0f0f]">
          <Loader size="lg" />
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)] bg-neutral-50 dark:bg-[#0f0f0f] p-6">
          <ErrorMessage message={error} />
        </div>
      </>
    );
  }

  const { user: channelUser, videos } = channelData;
  // After the readyVideos filter, add this:
  const processingVideos = videos.filter(
    (v) => v.status === "processing" || v.status === "uploaded"
  );
  const readyVideos = videos.filter((v) => v.status === "ready");

  return (
    <>
      <Navbar />

      {/* Delete Video Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, videoId: null })}
        onConfirm={handleDeleteVideo}
        title="Delete Video"
        message="Are you sure you want to delete this video? This action cannot be undone and will remove all comments and reactions."
      />

      {/* Edit Video Modal */}
      <VideoEditModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingVideo(null);
        }}
        onSave={handleEditVideo}
        onThumbnailUpdate={handleThumbnailUpdate}
        onThumbnailDelete={handleThumbnailDelete} // Add this line
        video={editingVideo}
      />

      <main className="min-h-screen bg-neutral-50 dark:bg-[#0f0f0f] text-neutral-900 dark:text-neutral-100">
        <div className="max-w-[1600px] mx-auto px-6 py-8">
          {/* Channel Header */}
          <div className="mb-8 pb-6 border-b border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <img
                  src={channelUser.avatar}
                  alt={channelUser.name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-neutral-800 shadow-lg"
                />
                <div>
                  <h1 className="text-3xl font-bold mb-2">{channelUser.name}</h1>
                  <p className="text-neutral-600 dark:text-neutral-400 mb-2">
                    {readyVideos.length}{" "}
                    {readyVideos.length === 1 ? "video" : "videos"}
                  </p>
                  {isOwnChannel && (
                    <p className="text-sm text-indigo-600 dark:text-indigo-400">
                      Your Channel
                    </p>
                  )}
                </div>
              </div>
              
              {/* Follow Button and Settings */}
              <div className="flex items-center gap-3">
                <FollowButton
                  userId={userId}
                  initialFollowerCount={channelUser.followerCount}
                  followerName={channelUser.followerName}
                  onFollowChange={(isFollowing, newCount) => {
                    setChannelData((prev) => ({
                      ...prev,
                      user: {
                        ...prev.user,
                        followerCount: newCount,
                      },
                    }));
                  }}
                />
                {isOwnChannel && (
                  <button
                    onClick={() => setFollowerSettingsOpen(true)}
                    className="px-4 py-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition"
                  >
                    Customize
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Follower Settings Modal */}
          <FollowerSettingsModal
            isOpen={followerSettingsOpen}
            onClose={() => setFollowerSettingsOpen(false)}
            currentFollowerName={channelUser.followerName}
            onUpdate={(newName) => {
              setChannelData((prev) => ({
                ...prev,
                user: {
                  ...prev.user,
                  followerName: newName,
                },
              }));
            }}
          />

          {/* Processing Videos Section */}
          {processingVideos.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Processing Videos</h2>
              <div className="space-y-4">
                {processingVideos.map((video) => (
                  <ProcessingVideoCard key={video.id} video={video} />
                ))}
              </div>
            </div>
          )}

          {/* Videos Grid */}
          {readyVideos.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-neutral-500 dark:text-neutral-400 text-lg">
                This channel hasn't uploaded any videos yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {readyVideos.map((video) => {
                const likePercentage =
                  video.likes + video.dislikes > 0
                    ? (video.likes / (video.likes + video.dislikes)) * 100
                    : 0;

                return (
                  <div
                    key={video.id}
                    className="group bg-white dark:bg-neutral-900 rounded-lg shadow hover:shadow-lg transition-shadow"
                  >
                    {/* Thumbnail */}
                    <Link to={`/watch/${video.id}`}>
                      <div className="relative aspect-video bg-neutral-300 dark:bg-neutral-700 rounded-t-lg overflow-hidden">
                        {video.thumbnailUrl ? (
                          <img
                            src={video.thumbnailUrl}
                            alt={video.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-neutral-500">
                            No Thumbnail
                          </div>
                        )}
                      </div>
                    </Link>

                    {/* Video Info */}
                    <div className="p-4">
                      {/* Title and Menu */}
                      <div className="flex items-start gap-2 mb-2">
                        <Link
                          to={`/watch/${video.id}`}
                          className="flex-1 min-w-0"
                        >
                          <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {video.title}
                          </h3>
                        </Link>

                        {/* Owner Actions */}
                        {isOwnChannel && (
                          <div className="relative flex-shrink-0">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setActiveVideoMenu(
                                  activeVideoMenu === video.id ? null : video.id
                                );
                              }}
                              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                            >
                              <FontAwesomeIcon
                                icon={faEllipsisV}
                                className="text-xs text-neutral-600 dark:text-neutral-400"
                              />
                            </button>

                            {activeVideoMenu === video.id && (
                              <>
                                {/* Backdrop to close menu */}
                                <div
                                  className="fixed inset-0 z-30"
                                  onClick={() => setActiveVideoMenu(null)}
                                />

                                {/* Dropdown Menu */}
                                <div className="absolute right-0 top-10 w-44 bg-white dark:bg-neutral-800 rounded-lg shadow-2xl border border-neutral-200 dark:border-neutral-700 py-1 z-40 overflow-visible">
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setEditingVideo(video);
                                      setEditModalOpen(true);
                                      setActiveVideoMenu(null);
                                    }}
                                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-3 text-neutral-900 dark:text-neutral-100 transition"
                                  >
                                    <FontAwesomeIcon
                                      icon={faEdit}
                                      className="text-xs w-4"
                                    />
                                    <span>Edit Video</span>
                                  </button>
                                  <div className="h-px bg-neutral-200 dark:bg-neutral-700 my-1" />
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setDeleteModal({
                                        isOpen: true,
                                        videoId: video.id,
                                      });
                                      setActiveVideoMenu(null);
                                    }}
                                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 text-red-600 dark:text-red-400 transition"
                                  >
                                    <FontAwesomeIcon
                                      icon={faTrash}
                                      className="text-xs w-4"
                                    />
                                    <span>Delete Video</span>
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                        <div className="flex items-center gap-1.5">
                          <FontAwesomeIcon icon={faEye} className="text-xs" />
                          <span>{video.views.toLocaleString()} views</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <FontAwesomeIcon
                            icon={faThumbsUp}
                            className="text-xs"
                          />
                          <span>{video.likes.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Like Bar */}
                      {video.likes + video.dislikes > 0 && (
                        <div className="w-full h-1 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-600 dark:bg-indigo-400 transition-all"
                            style={{ width: `${likePercentage}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
