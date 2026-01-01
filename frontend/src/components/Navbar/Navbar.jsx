// frontend/src/components/Navbar/Navbar.jsx
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSun, faMoon, faRightFromBracket, faCloudArrowUp } from "@fortawesome/free-solid-svg-icons";
import { useTheme } from "../../app/ThemeContext";
import { useAuth } from "../../app/AuthContext";

export default function Navbar() {
  const { dark, setDark } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-10 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0f0f0f]">
      <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          {/* Video Play Icon SVG */}
          <svg
            className="w-8 h-8 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform"
            viewBox="0 0 24 24"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" opacity="0.2"/>
            <path d="M10 8.5L15.5 12L10 15.5V8.5Z" />
          </svg>
          
          <span className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            StreamFlix
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {user && (
            <>
              {/* Upload Button */}
              <Link
                to="/upload"
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 
                  text-white font-semibold rounded-lg transition-colors"
              >
                <FontAwesomeIcon icon={faCloudArrowUp} className="text-sm" />
                <span className="hidden sm:inline">Upload</span>
              </Link>

              {/* User Profile Section - Now Clickable */}
              <Link
                to={`/channel/${user.id}`}
                className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
              >
                <img
                  src={user.avatar_url}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover border-2 border-white dark:border-neutral-700"
                />
                <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100 max-w-[150px] truncate">
                  {user.name}
                </span>
              </Link>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                aria-label="Logout"
                title="Logout"
                className="flex items-center justify-center w-9 h-9 rounded-full
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
            className="flex items-center justify-center w-9 h-9 rounded-full
              border border-neutral-300 dark:border-neutral-700
              text-neutral-700 dark:text-neutral-300
              hover:bg-neutral-200 dark:hover:bg-neutral-800 transition"
          >
            <FontAwesomeIcon icon={dark ? faSun : faMoon} className="text-sm" />
          </button>
        </div>
      </div>
    </header>
  );
}