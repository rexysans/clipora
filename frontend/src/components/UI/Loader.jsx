// src/components/UI/Loader.jsx
export default function Loader({ size = "md" }) {
  const sizeClasses = {
    sm: "w-6 h-6 border-2",
    md: "w-10 h-10 border-3",
    lg: "w-16 h-16 border-4"
  };

  return (
    <div className="flex items-center justify-center">
      <div
        className={`${sizeClasses[size]} border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin`}
      ></div>
    </div>
  );
}