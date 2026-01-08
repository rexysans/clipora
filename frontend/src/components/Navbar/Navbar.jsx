// frontend/src/components/Navbar/Navbar.jsx
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSun, faMoon, faRightFromBracket, faCloudArrowUp, faSearch, faCog } from "@fortawesome/free-solid-svg-icons";
import UserIcon from "../../assets/UserIcon";
import { useTheme } from "../../app/ThemeContext";
import { useAuth } from "../../app/AuthContext";
import { useState } from "react";

export default function Navbar() {
  const { dark, setDark } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0f0f0f]">
      <div className="max-w-[90rem] mx-auto px-4 sm:px-6 py-2 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
        <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
          {/* Video Play Icon SVG */}
          <svg
            className="w-7 h-7 sm:w-8 sm:h-8 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform"
            viewBox="0 0 24 24"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" opacity="0.2"/>
            <path d="M10 8.5L15.5 12L10 15.5V8.5Z" />
          </svg>
          
          <span className="text-base sm:text-lg lg:text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            StreamFlix
          </span>
        </Link>

        {/* Search Bar - Hidden on mobile, shown on sm+ */}
        <form onSubmit={handleSearch} className="hidden sm:flex flex-1 max-w-2xl">
          <div className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search videos and channels..."
              className="w-full px-4 py-2 pr-12 rounded-full border border-neutral-300 dark:border-neutral-700 
                bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100
                placeholder-neutral-500 dark:placeholder-neutral-400
                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center
                text-neutral-600 dark:text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              <FontAwesomeIcon icon={faSearch} />
            </button>
          </div>
        </form>

        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {user && (
            <>
              {/* Upload Button - Icon only on mobile, full on sm+ */}
              <Link
                to="/upload"
                state={{ from: location.pathname }}
                className="flex items-center gap-2 px-3 py-2 sm:px-4 bg-indigo-600 hover:bg-indigo-700 
                  text-white font-semibold rounded-lg transition-colors text-sm"
              >
                <FontAwesomeIcon icon={faCloudArrowUp} className="text-sm" />
                <span className="hidden sm:inline">Upload</span>
              </Link>

              {/* User Profile Section - Compact on mobile */}
              <Link
                to={`/channel/${user.id}`}
                className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
              >
                {user.avatar_url && user.avatar_url.trim() !== '' ? (
                  <img
                    src={user.avatar_url}
                    alt=""
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border-2 border-white dark:border-neutral-700"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center border-2 border-white dark:border-neutral-700" style={{ display: (user.avatar_url && user.avatar_url.trim() !== '') ? 'none' : 'flex' }}>
                  <UserIcon className="w-4 h-4 text-white" />
                </div>
                <div className="hidden lg:flex flex-col max-w-[10rem]">
                  <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                    {user.name}
                  </span>
                  {user.username && (
                    <span className="text-xs text-neutral-600 dark:text-neutral-400 truncate">
                      @{user.username}
                    </span>
                  )}
                </div>
              </Link>

              {/* Settings Button */}
              <Link
                to="/settings"
                aria-label="Settings"
                title="Settings"
                className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full
                  border border-neutral-300 dark:border-neutral-700
                  text-neutral-700 dark:text-neutral-300
                  hover:bg-neutral-200 dark:hover:bg-neutral-800 transition"
              >
                <FontAwesomeIcon icon={faCog} className="text-sm" />
              </Link>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                aria-label="Logout"
                title="Logout"
                className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full
                  border border-neutral-300 dark:border-neutral-700
                  text-neutral-700 dark:text-neutral-300
                  hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-700 transition"
              >
                <FontAwesomeIcon icon={faRightFromBracket} className="text-sm" />
              </button>
            </>
          )}
          
          <button
            onClick={() => setDark((prev) => !prev)}
            aria-label="Toggle theme"
            className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full
              border border-neutral-300 dark:border-neutral-700
              text-neutral-700 dark:text-neutral-300
              hover:bg-neutral-200 dark:hover:bg-neutral-800 transition"
          >
            <FontAwesomeIcon icon={dark ? faSun : faMoon} className="text-sm" />
          </button>
        </div>
      </div>
      
      {/* Mobile Search - Below navbar on mobile only */}
      <div className="sm:hidden border-t border-neutral-200 dark:border-neutral-800 px-4 py-2">
        <form onSubmit={handleSearch} className="w-full">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full px-4 py-2 pr-10 rounded-full border border-neutral-300 dark:border-neutral-700 
                bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 text-sm
                placeholder-neutral-500 dark:placeholder-neutral-400
                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center
                text-neutral-600 dark:text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              <FontAwesomeIcon icon={faSearch} className="text-sm" />
            </button>
          </div>
        </form>
      </div>
    </header>
  );
}