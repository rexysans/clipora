import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import { API_ENDPOINTS } from "../../config/api";
import { useAuth } from "../../app/AuthContext";
import Loader from "../../components/UI/Loader";

function Following() {
  const { user } = useAuth();
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFollowing = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(API_ENDPOINTS.USER_FOLLOWING(user.id), {
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error("Failed to fetch following list");
        }

        const data = await res.json();
        
        // Fetch follower count for each channel
        const channelsWithDetails = await Promise.all(
          data.map(async (channel) => {
            try {
              const followerRes = await fetch(
                API_ENDPOINTS.USER_FOLLOWERS(channel.id),
                { credentials: "include" }
              );
              
              let followerCount = 0;
              if (followerRes.ok) {
                const followers = await followerRes.json();
                followerCount = followers.length || 0;
              }
              
              return {
                ...channel,
                follower_count: followerCount,
                // follower_name is already returned by the backend
              };
            } catch (err) {
              console.error(`Failed to fetch details for channel ${channel.id}:`, err);
              return {
                ...channel,
                follower_count: 0,
              };
            }
          })
        );
        
        setFollowing(channelsWithDetails);
      } catch (err) {
        console.error("Error fetching following:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFollowing();
  }, [user]);

  if (!user) {
    return (
      <>
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-50 dark:bg-bg px-4">
          <div className="text-center max-w-md">
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white mb-4">
              Sign in to see channels you follow
            </h1>
            <p className="text-neutral-600 dark:text-textSecondary mb-6">
              Log in to view and manage the channels you're following
            </p>
            <Link
              to="/login"
              className="inline-block px-6 py-3 bg-accent hover:bg-accentSoft text-white font-semibold rounded-lg transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-neutral-50 dark:bg-bg text-neutral-900 dark:text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">
              Following
            </h1>
            <p className="text-neutral-600 dark:text-textSecondary">
              Channels you follow
            </p>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader size="lg" />
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-red-500 dark:text-red-400 text-lg">{error}</p>
            </div>
          ) : following.length === 0 ? (
            <div className="text-center py-20">
              <div className="max-w-md mx-auto">
                <svg
                  className="w-20 h-20 mx-auto mb-4 text-neutral-400 dark:text-neutral-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <h2 className="text-xl font-semibold mb-2">
                  You're not following anyone yet
                </h2>
                <p className="text-neutral-600 dark:text-textSecondary mb-6">
                  Discover channels and follow them to see their content here
                </p>
                <Link
                  to="/"
                  className="inline-block px-6 py-3 bg-accent hover:bg-accentSoft text-white font-semibold rounded-lg transition-colors"
                >
                  Explore Channels
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {following.map((channel) => (
                <Link
                  key={channel.id}
                  to={`/channel/${channel.id}`}
                  className="group bg-white dark:bg-surface rounded-xl p-4 sm:p-6 hover:shadow-lg dark:hover:shadow-2xl transition-all border border-neutral-200 dark:border-neutral-800"
                >
                  {/* Avatar */}
                  <div className="flex flex-col items-center text-center">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full mb-4 overflow-hidden bg-neutral-200 dark:bg-neutral-700 group-hover:scale-105 transition-transform">
                      {channel.avatar_url ? (
                        <img
                          src={channel.avatar_url}
                          alt={channel.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl sm:text-4xl font-bold text-neutral-500 dark:text-neutral-400">
                          {channel.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                      )}
                    </div>
                    
                    {/* Channel Name */}
                    <h3 className="text-lg sm:text-xl font-semibold mb-2 group-hover:text-accent transition-colors line-clamp-2">
                      {channel.name}
                    </h3>

                    {/* Follower Count */}
                    <p className="text-sm text-neutral-600 dark:text-textSecondary">
                      {channel.follower_count || 0}{" "}
                      {channel.follower_name || "Followers"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default Following;