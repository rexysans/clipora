import { useState, useEffect } from "react";
import { useAuth } from "../../app/AuthContext";
import Navbar from "../../components/Navbar/Navbar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faTimes, faEdit } from "@fortawesome/free-solid-svg-icons";
import { API_ENDPOINTS } from "../../config/api";
import UserIcon from "../../assets/UserIcon";

export default function Settings() {
  const { user, updateUser } = useAuth();
  const [username, setUsername] = useState(user?.username || "");
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(!user?.username);

  useEffect(() => {
    if (username === user?.username) {
      setAvailable(null);
      setError("");
      return;
    }

    if (username.length < 3) {
      setAvailable(null);
      setError("");
      return;
    }

    if (!/^[a-z0-9_]{3,20}$/.test(username)) {
      setAvailable(false);
      setError("Username must be 3-20 characters, lowercase letters, numbers, and underscores only");
      return;
    }

    const timer = setTimeout(async () => {
      setChecking(true);
      setError("");
      try {
        const response = await fetch(
          `${API_ENDPOINTS.AUTH.CHECK_USERNAME}?username=${username}`,
          { credentials: "include" }
        );
        const data = await response.json();
        setAvailable(data.available);
        if (!data.available) {
          setError("Username already taken");
        }
      } catch (err) {
        setError("Failed to check username availability");
      } finally {
        setChecking(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [username, user?.username]);

  const handleSave = async (e) => {
    e.preventDefault();
    if ((!available && username !== user?.username) || saving) return;

    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      const response = await fetch(API_ENDPOINTS.AUTH.UPDATE_USERNAME, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update username");
      }

      updateUser({ username });
      setSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-screen bg-neutral-50 dark:bg-bg">
          <p className="text-neutral-600 dark:text-neutral-400">Please log in to access settings</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-neutral-50 dark:bg-bg pt-20 px-4 pb-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-8">
            Account Settings
          </h1>

          {/* Profile Section */}
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-6">
              Profile Information
            </h2>

            {/* Avatar */}
            <div className="flex items-center gap-4 mb-6">
              {user.avatar_url && user.avatar_url.trim() !== '' ? (
                <img
                  src={user.avatar_url}
                  alt=""
                  className="w-20 h-20 rounded-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center" style={{ display: (user.avatar_url && user.avatar_url.trim() !== '') ? 'none' : 'flex' }}>
                <UserIcon className="w-10 h-10 text-white" />
              </div>
              <div>
                <p className="font-medium text-neutral-900 dark:text-white">{user.name}</p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">{user.email}</p>
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Username
              </label>
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 pr-10 border border-neutral-300 dark:border-neutral-700 rounded-lg 
                      bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white
                      focus:outline-none focus:ring-2 focus:ring-indigo-500
                      disabled:bg-neutral-100 dark:disabled:bg-neutral-800 disabled:cursor-not-allowed"
                    maxLength={20}
                  />
                  {isEditing && username.length >= 3 && username !== user.username && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {checking ? (
                        <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      ) : available === true ? (
                        <FontAwesomeIcon icon={faCheck} className="text-green-500" />
                      ) : available === false ? (
                        <FontAwesomeIcon icon={faTimes} className="text-red-500" />
                      ) : null}
                    </div>
                  )}
                </div>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <FontAwesomeIcon icon={faEdit} />
                    Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      disabled={(!available && username !== user.username) || saving}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-neutral-400 
                        text-white rounded-lg transition-colors disabled:cursor-not-allowed"
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={() => {
                        setUsername(user.username || "");
                        setIsEditing(false);
                        setError("");
                      }}
                      className="px-4 py-2 border border-neutral-300 dark:border-neutral-700 
                        text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
              {error && (
                <p className="text-red-500 text-sm mt-2">{error}</p>
              )}
              {success && (
                <p className="text-green-500 text-sm mt-2">Username updated successfully!</p>
              )}
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                3-20 characters, lowercase letters, numbers, and underscores
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
