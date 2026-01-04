import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faSave } from "@fortawesome/free-solid-svg-icons";
import { API_ENDPOINTS } from "../../config/api";

export default function FollowerSettingsModal({ isOpen, onClose, currentFollowerName, onUpdate }) {
  const [followerName, setFollowerName] = useState(currentFollowerName || "Followers");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async () => {
    if (!followerName.trim()) {
      setError("Follower name cannot be empty");
      return;
    }

    if (followerName.length > 50) {
      setError("Follower name too long (max 50 characters)");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(API_ENDPOINTS.USER_FOLLOWER_NAME, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ followerName: followerName.trim() }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update follower name");
      }

      const data = await res.json();
      onUpdate(data.followerName);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
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
      <div className="relative bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-6 py-4 flex items-center justify-between z-10 rounded-t-2xl">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
            Customize Follower Name
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
        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
            </div>
          )}

          <div>
            <label
              htmlFor="follower-name"
              className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2"
            >
              What do you want to call your followers?
            </label>
            <input
              id="follower-name"
              type="text"
              value={followerName}
              onChange={(e) => setFollowerName(e.target.value)}
              maxLength={50}
              placeholder="e.g., Subscribers, Fans, Members"
              className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
            />
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              {followerName.length}/50 characters
            </p>
          </div>

          <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Examples: Subscribers, Fans, Members, Squad, Crew, Community, Supporters
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 px-6 py-4 flex items-center justify-end gap-3 rounded-b-2xl">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-6 py-2.5 rounded-lg font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !followerName.trim()}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faSave} />
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
