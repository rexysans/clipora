// src/components/UI/ErrorMessage.jsx
export default function ErrorMessage({ message }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-neutral-50 dark:bg-[#0f0f0f] px-4">
      <div className="max-w-md w-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <svg
            className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-1">
              Error
            </h3>
            <p className="text-red-800 dark:text-red-300">{message}</p>
          </div>
        </div>
      </div>
    </div>
  );
}