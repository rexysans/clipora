export default function VideoCardSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Thumbnail skeleton */}
      <div className="bg-neutral-300 dark:bg-neutral-700 aspect-video rounded-lg mb-3"></div>
      
      {/* Content skeleton */}
      <div className="flex gap-3">
        {/* Avatar skeleton */}
        <div className="w-9 h-9 bg-neutral-300 dark:bg-neutral-700 rounded-full flex-shrink-0"></div>
        
        {/* Text content skeleton */}
        <div className="flex-1 space-y-2">
          {/* Title lines */}
          <div className="h-4 bg-neutral-300 dark:bg-neutral-700 rounded w-full"></div>
          <div className="h-4 bg-neutral-300 dark:bg-neutral-700 rounded w-3/4"></div>
          
          {/* Channel name and views */}
          <div className="h-3 bg-neutral-300 dark:bg-neutral-700 rounded w-1/2"></div>
        </div>
      </div>
    </div>
  );
}
