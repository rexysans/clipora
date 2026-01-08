import { Link, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome,
  faHeart,
  faHistory,
  faClock,
  faUserFriends,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../../app/AuthContext";

function Sidebar() {
  const location = useLocation();
  const { user } = useAuth() || {};

  const menuItems = [
    {
      icon: faHome,
      label: "Home",
      path: "/",
    },
    {
      icon: faUserFriends,
      label: "Following",
      path: "/following",
      requireAuth: true,
    },
    {
      icon: faHeart,
      label: "Liked",
      path: "/liked",
      requireAuth: true,
    },
    {
      icon: faHistory,
      label: "History",
      path: "/history",
      requireAuth: true,
    },
    {
      icon: faClock,
      label: "Watch Later",
      path: "/watch-later",
      requireAuth: true,
    },
  ];

  const filteredItems = menuItems.filter(
    (item) => !item.requireAuth || user
  );

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Desktop Sidebar - Left side */}
      <aside
        className="
          hidden lg:block
          sticky top-0 h-screen w-64 flex-shrink-0
          bg-white dark:bg-surface 
          border-r border-neutral-200 dark:border-neutral-800
          overflow-y-auto
        "
      >
        <div className="flex flex-col h-full pt-24">
          <nav className="flex-1 px-3 py-4 space-y-1">
            {filteredItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium
                  ${
                    isActive(item.path)
                      ? "bg-accent text-white"
                      : "text-neutral-700 dark:text-textSecondary hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:text-neutral-900 dark:hover:text-white"
                  }
                `}
              >
                <FontAwesomeIcon icon={item.icon} className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Login prompt for non-authenticated users */}
          {!user && (
            <div className="px-3 py-4 border-t border-neutral-200 dark:border-neutral-800">
              <p className="text-sm text-neutral-600 dark:text-textSecondary mb-3 px-4">
                Sign in to access more features
              </p>
              <Link
                to="/login"
                className="block w-full px-4 py-2 text-center bg-accent hover:bg-accentSoft text-white font-semibold rounded-lg transition-colors"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Bottom Navigation - Bottom of screen */}
      <nav
        className="
          lg:hidden
          fixed bottom-0 left-0 right-0 z-40
          bg-white dark:bg-surface 
          border-t border-neutral-200 dark:border-neutral-800
          px-2 py-2
        "
      >
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {filteredItems.slice(0, 5).map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex flex-col items-center justify-center
                px-3 py-2 rounded-lg
                transition-all min-w-[60px]
                ${
                  isActive(item.path)
                    ? "text-accent"
                    : "text-neutral-600 dark:text-neutral-400"
                }
              `}
            >
              <FontAwesomeIcon 
                icon={item.icon} 
                className={`text-xl mb-1 ${isActive(item.path) ? "text-accent" : ""}`}
              />
              <span className="text-[10px] font-medium truncate max-w-[60px]">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}

export default Sidebar;
