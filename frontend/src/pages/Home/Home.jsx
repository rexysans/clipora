import { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { useInfiniteQuery } from "@tanstack/react-query";
import Navbar from "../../components/Navbar/Navbar";
import { API_ENDPOINTS } from "../../config/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faThumbsUp } from "@fortawesome/free-solid-svg-icons";
import WatchLaterButton from "../../components/UI/WatchLaterButton";
import UserIcon from "../../assets/UserIcon";
import VideoCardSkeleton from "../../components/UI/VideoCardSkeleton";

export default function Home() {
  const observerTarget = useRef(null);

  // Fetch videos with pagination using React Query
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ["videos"],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await fetch(`${API_ENDPOINTS.VIDEOS}?page=${pageParam}&limit=20`);
      if (!res.ok) throw new Error("Failed to load videos");
      return res.json();
    },
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore ? lastPage.pagination.page + 1 : undefined;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const diff = Math.floor((Date.now() - date) / (1000 * 60 * 60 * 24));
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    if (diff < 7) return `${diff} days ago`;
    if (diff < 30) return `${Math.floor(diff / 7)} weeks ago`;
    return `${Math.floor(diff / 30)} months ago`;
  };

  const formatViews = (count) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count;
  };

  const formatCount = (count) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count;
  };

  // Calculate like percentage for like bar
  const calculateLikePercentage = (likes, dislikes) => {
    const total = likes + dislikes;
    if (total === 0) return 0;
    return Math.round((likes / total) * 100);
  };

  // Flatten all pages of videos
  const allVideos = data?.pages.flatMap((page) => page.videos) || [];

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
        Failed to load videos
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans">
      <Navbar />

      <main className="max-w-[90rem] mx-auto px-4 sm:px-6 py-6 sm:py-8 lg:py-10">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold tracking-tight">
            Recommended
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Fresh uploads curated for you
          </p>
        </div>

        {/* CSS Grid with auto-fit for fluid responsiveness */}
        <div
          className="
            grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
            gap-x-4 gap-y-8
            sm:gap-x-6 sm:gap-y-10
            lg:gap-x-8 lg:gap-y-12
          "
        >
          {isLoading ? (
            // Show skeleton loaders on initial load
            Array.from({ length: 12 }).map((_, i) => (
              <VideoCardSkeleton key={i} />
            ))
          ) : (
            allVideos.map((video) => (
            <article key={video.id}>
              {/* Thumbnail - Link to video */}
              <Link to={`/watch/${video.id}`} className="group block relative">
                {/* Watch Later Button */}
                <WatchLaterButton 
                  videoId={video.id} 
                  className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100"
                />
                
                <div
                  className="
                    relative aspect-video xl:aspect-[16/10] rounded-xl overflow-hidden
                    bg-neutral-200 dark:bg-neutral-800
                    shadow-sm group-hover:shadow-lg
                    transition
                  "
                >
                  {video.thumbnailUrl ? (
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      loading="lazy"
                      className="
                        w-full h-full object-cover
                        transition-transform duration-300
                        group-hover:scale-105
                      "
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-400 dark:text-neutral-600">
                      <svg
                        className="w-16 h-16"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                      </svg>
                    </div>
                  )}
                </div>
              </Link>

              {/* Info */}
              <div className="flex gap-3 mt-3">
                {/* Uploader Avatar - Link to channel */}
                <Link
                  to={`/channel/${video.uploader.id}`}
                  className="flex-shrink-0"
                >
                  {video.uploader?.avatar && video.uploader.avatar.trim() !== '' ? (
                    <img
                      src={video.uploader.avatar}
                      alt=""
                      className="w-9 h-9 rounded-full object-cover hover:ring-2 hover:ring-indigo-500 transition"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center" style={{ display: (video.uploader?.avatar && video.uploader.avatar.trim() !== '') ? 'none' : 'flex' }}>
                    <UserIcon className="w-5 h-5 text-white" />
                  </div>
                </Link>

                <div className="min-w-0 flex-1">
                  {/* Video Title - Link to video */}
                  <Link to={`/watch/${video.id}`} className="group">
                    <h3
                      className="
                        text-[15px] font-semibold leading-snug
                        line-clamp-2
                        group-hover:text-indigo-600
                        dark:group-hover:text-indigo-400
                        transition-colors
                      "
                    >
                      {video.title}
                    </h3>
                  </Link>

                  {/* Channel Name - Link to channel */}
                  <Link
                    to={`/channel/${video.uploader?.id}`}
                    className="text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors inline-block mt-0.5"
                  >
                    {video.uploader?.name || "Unknown Channel"}
                    {video.uploader?.username && (
                      <span className="text-neutral-500 dark:text-neutral-500"> • @{video.uploader.username}</span>
                    )}
                  </Link>

                  <p className="text-xs text-neutral-500 mt-0.5">
                    {formatViews(video.views)} views · {formatDate(video.created_at)}
                  </p>

                  {/* Like/Dislike Info */}
                  {(video.likes > 0 || video.dislikes > 0) && (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
                        <FontAwesomeIcon icon={faThumbsUp} className="text-[10px]" />
                        <span className="font-medium">
                          {formatCount(video.likes)}
                        </span>
                        <span className="text-neutral-400 dark:text-neutral-600">
                          ({calculateLikePercentage(video.likes, video.dislikes)}%)
                        </span>
                      </div>
                      
                      {/* Like ratio bar */}
                      <div className="w-full h-1 bg-neutral-300 dark:bg-neutral-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 dark:bg-indigo-500 transition-all"
                          style={{
                            width: `${calculateLikePercentage(video.likes, video.dislikes)}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))
          )}
        </div>

        {/* Loading more indicator */}
        {isFetchingNextPage && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10 lg:gap-x-8 lg:gap-y-12 mt-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <VideoCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Intersection observer target for infinite scroll */}
        <div ref={observerTarget} className="h-10" />

        {allVideos.length === 0 && !isLoading && (
          <div className="text-center py-32 text-neutral-500 dark:text-neutral-400">
            No videos available
          </div>
        )}
      </main>
    </div>
  );
}