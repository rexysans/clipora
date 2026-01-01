import { useState } from "react";
import Navbar from "../../components/Navbar/Navbar";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCloudArrowUp, faVideo, faCheckCircle } from "@fortawesome/free-solid-svg-icons";
import { API_ENDPOINTS } from "../../config/api";

export default function Upload() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    video: null,
  });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("video/")) {
        setError("Please select a valid video file");
        return;
      }
      setFormData((prev) => ({ ...prev, video: file }));
      setError("");
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("video/")) {
      setFormData((prev) => ({ ...prev, video: file }));
      setError("");
    } else {
      setError("Please select a valid video file");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!formData.video) {
      setError("Please select a video file");
      return;
    }

    if (!formData.title.trim()) {
      setError("Please enter a title");
      return;
    }

    setUploading(true);

    try {
      const data = new FormData();
      data.append("video", formData.video);
      data.append("title", formData.title);
      if (formData.description) {
        data.append("description", formData.description);
      }

      const response = await fetch(API_ENDPOINTS.VIDEOS_UPLOAD, {
        method: "POST",
        credentials: "include",
        body: data,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const result = await response.json();
      setSuccess(true);
      
      // Reset form
      setFormData({ title: "", description: "", video: null });
      
      // Redirect to home after 2 seconds
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (err) {
      setError(err.message || "Failed to upload video");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-neutral-50 dark:bg-[#0f0f0f] py-8 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
              Upload Video
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400">
              Share your content with the world
            </p>
          </div>

          {/* Upload Form */}
          <form onSubmit={handleSubmit} className="bg-white dark:bg-[#181818] rounded-xl shadow-lg p-8">
            {/* Video File Upload Area */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
                Video File *
              </label>
              
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                  dragActive
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/10"
                    : "border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600"
                }`}
              >
                {formData.video ? (
                  <div className="space-y-3">
                    <FontAwesomeIcon
                      icon={faCheckCircle}
                      className="text-4xl text-green-500"
                    />
                    <p className="text-neutral-900 dark:text-neutral-100 font-medium">
                      {formData.video.name}
                    </p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      {(formData.video.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, video: null }))}
                      className="text-sm text-red-600 dark:text-red-400 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <FontAwesomeIcon
                      icon={faCloudArrowUp}
                      className="text-4xl text-neutral-400 dark:text-neutral-600"
                    />
                    <p className="text-neutral-900 dark:text-neutral-100">
                      Drag and drop your video here
                    </p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">or</p>
                    <label className="inline-block px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg cursor-pointer transition">
                      Browse Files
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Title Input */}
            <div className="mb-6">
              <label
                htmlFor="title"
                className="block text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2"
              >
                Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter video title"
                className="w-full px-4 py-3 rounded-lg border border-neutral-300 dark:border-neutral-700 
                  bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100
                  focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                required
              />
            </div>

            {/* Description Input */}
            <div className="mb-6">
              <label
                htmlFor="description"
                className="block text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2"
              >
                Description (Optional)
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Tell viewers about your video"
                rows="4"
                className="w-full px-4 py-3 rounded-lg border border-neutral-300 dark:border-neutral-700 
                  bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100
                  focus:outline-none focus:ring-2 focus:ring-indigo-500 transition resize-none"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-green-600 dark:text-green-400 text-sm">
                  Video uploaded successfully! Redirecting...
                </p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={uploading || success}
                className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-neutral-400 
                  text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faVideo} />
                    Upload Video
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate("/")}
                disabled={uploading}
                className="px-6 py-3 bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 
                  dark:hover:bg-neutral-700 text-neutral-900 dark:text-neutral-100 
                  font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}