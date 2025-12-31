import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSun, faMoon } from "@fortawesome/free-solid-svg-icons";

export default function Navbar({ dark, setDark }) {
  return (
    <header className="sticky top-0 z-10 border-b border-neutral-200 dark:border-neutral-800 bg-white/90 dark:bg-neutral-950/80 backdrop-blur">
      <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center justify-between">
        <Link to="/" className="text-lg font-semibold tracking-tight">
          StreamFlix
        </Link>

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
    </header>
  );
}
