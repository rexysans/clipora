import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faCheck } from "@fortawesome/free-solid-svg-icons";
import { API_ENDPOINTS } from "../../config/api";

export default function UsernameModal({ user, onComplete, onSkip }) {
  const [username, setUsername] = useState("");
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Check username availability with debounce
  useEffect(() => {
    if (username.length < 3) {
      setAvailable(null);
      setError("");
      return;
    }

    // Validate format
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
  }, [username]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!available || saving) return;

    setSaving(true);
    setError("");

    try {
      const response = await fetch(API_ENDPOINTS.AUTH.UPDATE_USERNAME, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to set username");
      }

      onComplete(username);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-lg max-w-md w-full p-6 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
            Choose Your Username
          </h2>
          {onSkip && (
            <button
              onClick={onSkip}
              className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          )}
        </div>

        <p className="text-neutral-600 dark:text-neutral-400 mb-6">
          Your username will be visible to others and can be changed later in settings.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Username
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                placeholder="Enter username"
                className="w-full px-4 py-2 pr-10 border border-neutral-300 dark:border-neutral-700 rounded-lg 
                  bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white
                  focus:outline-none focus:ring-2 focus:ring-indigo-500"
                maxLength={20}
              />
              {username.length >= 3 && (
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
            {error && (
              <p className="text-red-500 text-sm mt-1">{error}</p>
            )}
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              3-20 characters, lowercase letters, numbers, and underscores
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={!available || saving}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-neutral-400 
                text-white font-medium py-2 px-4 rounded-lg transition-colors
                disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Continue"}
            </button>
            {onSkip && (
              <button
                type="button"
                onClick={onSkip}
                className="px-4 py-2 text-neutral-600 dark:text-neutral-400 
                  hover:text-neutral-900 dark:hover:text-white transition-colors"
              >
                Skip for now
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
