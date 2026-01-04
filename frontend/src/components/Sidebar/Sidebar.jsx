import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome,
  faHeart,
  faHistory,
  faClock,
  faUserFriends,
  faBars,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../../app/AuthContext";

function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

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
      label: "Liked Videos",
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
      {/* Mobile Hamburger Button - Fixed position */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-20 left-4 z-50 w-10 h-10 flex items-center justify-center rounded-lg bg-neutral-100 dark:bg-surface hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white transition-colors shadow-lg"
        aria-label="Toggle sidebar"
      >
        <FontAwesomeIcon icon={isOpen ? faTimes : faBars} />
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 h-screen bg-white dark:bg-surface border-r border-neutral-200 dark:border-neutral-800 z-40
          transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          w-64 flex-shrink-0
        `}
      >
        <div className="flex flex-col h-full pt-20 lg:pt-24">
          {/* Menu Items */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {filteredItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
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
                Sign in to like videos, comment, and subscribe.
              </p>
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="block w-full px-4 py-2 text-center bg-accent hover:bg-accentSoft text-white font-semibold rounded-lg transition-colors"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
