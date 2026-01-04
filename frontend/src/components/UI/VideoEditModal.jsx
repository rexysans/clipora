// frontend/src/components/UI/VideoEditModal.jsx
import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faSave, faImage, faTrash } from "@fortawesome/free-solid-svg-icons";
import { API_ENDPOINTS } from "../../config/api";

export default function VideoEditModal({ isOpen, onClose, onSave, video, onThumbnailUpdate, onThumbnailDelete }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (video) {
      setTitle(video.title || "");
      setDescription(video.description || "");
      setThumbnailPreview(video.thumbnailUrl || null);
      setThumbnailFile(null);
    }
  }, [video]);

  const handleThumbnailSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB");
      return;
    }

    setThumbnailFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setThumbnailPreview(reader.result);
    };
    reader.readAsDataURL(file);
    setError(null);
  };

  const handleRemoveThumbnail = async () => {
    if (!video?.id || !onThumbnailDelete) {
      // Fallback to local state update only
      setThumbnailFile(null);
      setThumbnailPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }
    
    try {
      setUploadingThumbnail(true);
      setError(null);
      
      // Call the parent's thumbnail delete handler
      const data = await onThumbnailDelete(video.id);
      
      // Update preview with the default thumbnail or null
      setThumbnailPreview(data.thumbnailUrl || null);
      setThumbnailFile(null);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      setError(err.message || "Failed to remove thumbnail");
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    if (title.length > 200) {
      setError("Title too long (max 200 characters)");
      return;
    }

    if (description.length > 5000) {
      setError("Description too long (max 5000 characters)");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Save video details (title, description)
      await onSave({ title: title.trim(), description: description.trim() });

      // Upload thumbnail if a new one was selected
      if (thumbnailFile && onThumbnailUpdate) {
        setUploadingThumbnail(true);
        await onThumbnailUpdate(thumbnailFile);
      }

      onClose();
    } catch (err) {
      setError(err.message || "Failed to save changes");
    } finally {
      setSaving(false);
      setUploadingThumbnail(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
            Edit Video
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          >
            <FontAwesomeIcon
              icon={faTimes}
              className="text-neutral-600 dark:text-neutral-400"
            />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
            </div>
          )}

          {/* Thumbnail Upload */}
          <div>
            <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
              Thumbnail
            </label>
            
            {thumbnailPreview ? (
              <div className="relative group">
                <img
                  src={thumbnailPreview}
                  alt="Thumbnail preview"
                  className="w-full h-48 object-cover rounded-lg border-2 border-neutral-300 dark:border-neutral-700"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingThumbnail}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FontAwesomeIcon icon={faImage} className="mr-2" />
                    Change
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveThumbnail}
                    disabled={uploadingThumbnail}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FontAwesomeIcon icon={faTrash} className="mr-2" />
                    {uploadingThumbnail ? "Removing..." : "Remove"}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-48 border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-indigo-500 dark:hover:border-indigo-400 transition group"
              >
                <FontAwesomeIcon
                  icon={faImage}
                  className="text-4xl text-neutral-400 dark:text-neutral-600 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition"
                />
                <p className="text-neutral-600 dark:text-neutral-400 font-medium">
                  Click to upload thumbnail
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-500">
                  PNG, JPG, GIF, WebP (Max 5MB)
                </p>
              </button>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleThumbnailSelect}
              className="hidden"
            />
          </div>

          {/* Title */}
          <div>
            <label
              htmlFor="video-title"
              className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2"
            >
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="video-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              placeholder="Enter video title"
              className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
            />
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              {title.length}/200 characters
            </p>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="video-description"
              className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2"
            >
              Description
            </label>
            <textarea
              id="video-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={5000}
              rows={8}
              placeholder="Tell viewers about your video"
              className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 resize-none"
            />
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              {description.length}/5000 characters
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={saving || uploadingThumbnail}
            className="px-6 py-2.5 rounded-lg font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || uploadingThumbnail || !title.trim()}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faSave} />
            {uploadingThumbnail ? "Uploading..." : saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}