import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

export default function NotFound() {
  // Initialize theme from localStorage immediately
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved ? saved === "dark" : true;
  });
  
  // Apply theme whenever it changes
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-50 dark:bg-[#0f0f0f] text-neutral-900 dark:text-neutral-100 px-4">
      <div className="max-w-2xl w-full flex flex-col items-center text-center">
        {/* Custom 404 SVG Illustration */}
        <svg
          className="w-full max-w-md h-auto mb-8"
          viewBox="0 0 400 300"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Background Circle */}
          <circle cx="200" cy="150" r="120" fill="currentColor" className="text-indigo-100 dark:text-indigo-950" opacity="0.3" />
          
          {/* Play Button (Broken) */}
          <g className="text-indigo-600 dark:text-indigo-400">
            <path
              d="M150 80 L150 140 L120 110 Z"
              fill="currentColor"
              opacity="0.8"
            />
            <path
              d="M250 160 L250 220 L280 190 Z"
              fill="currentColor"
              opacity="0.8"
            />
          </g>
          
          {/* Large 404 Text */}
          <text
            x="200"
            y="170"
            fontSize="72"
            fontWeight="bold"
            fill="currentColor"
            className="text-neutral-800 dark:text-neutral-200"
            textAnchor="middle"
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            404
          </text>
          
          {/* Video Film Strip Decoration */}
          <rect x="60" y="60" width="40" height="6" rx="3" fill="currentColor" className="text-indigo-500 dark:text-indigo-500" opacity="0.6" />
          <rect x="300" y="200" width="40" height="6" rx="3" fill="currentColor" className="text-indigo-500 dark:text-indigo-500" opacity="0.6" />
          
          {/* Small circles decoration */}
          <circle cx="80" cy="220" r="8" fill="currentColor" className="text-indigo-400 dark:text-indigo-600" opacity="0.5" />
          <circle cx="320" cy="80" r="6" fill="currentColor" className="text-indigo-400 dark:text-indigo-600" opacity="0.5" />
          <circle cx="100" cy="100" r="4" fill="currentColor" className="text-indigo-300 dark:text-indigo-700" opacity="0.4" />
          <circle cx="300" cy="130" r="5" fill="currentColor" className="text-indigo-300 dark:text-indigo-700" opacity="0.4" />
        </svg>

        {/* Text Content */}
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-neutral-900 dark:text-neutral-100">
          Page Not Found
        </h1>
        <p className="text-lg md:text-xl text-neutral-600 dark:text-neutral-400 mb-8 max-w-md">
          Sorry, the page you're looking for doesn't exist or has been moved.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            to="/"
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-semibold rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
          >
            Back to Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="px-8 py-3 bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-900 dark:text-neutral-100 font-semibold rounded-lg transition-colors duration-200"
          >
            Go Back
          </button>
        </div>

        {/* Additional Help Text */}
        <p className="mt-12 text-sm text-neutral-500 dark:text-neutral-500">
          Error Code: 404 • Page Not Found
        </p>
      </div>
    </div>
  );
}
