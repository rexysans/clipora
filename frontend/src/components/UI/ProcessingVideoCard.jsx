import { useState, useEffect } from "react";
import { API_ENDPOINTS } from "../../config/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner, faCheckCircle, faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";

export default function ProcessingVideoCard({ video }) {
  const [status, setStatus] = useState(video.status);
  const [progress, setProgress] = useState(video.processing_progress || 0);

  useEffect(() => {
    // Poll for both uploaded (queued) and processing status
    if (status === "uploaded" || status === "processing") {
      console.log(`[ProcessingVideoCard] Starting polling for video ${video.id} with status: ${status}, progress: ${progress}`);
      
      const interval = setInterval(async () => {
        try {
          const res = await fetch(API_ENDPOINTS.VIDEO_STATUS(video.id), {
            credentials: "include",
          });
          if (res.ok) {
            const data = await res.json();
            console.log(`[ProcessingVideoCard] Polling update for ${video.id}:`, data);
            setStatus(data.status);
            setProgress(data.progress);

            // Stop polling when ready or failed
            if (data.status === "ready" || data.status === "failed") {
              console.log(`[ProcessingVideoCard] Video ${video.id} finished with status: ${data.status}`);
              clearInterval(interval);
              // Reload page after completion
              if (data.status === "ready") {
                setTimeout(() => window.location.reload(), 1000);
              }
            }
          } else {
            console.error(`[ProcessingVideoCard] Failed to fetch status: ${res.status}`);
          }
        } catch (err) {
          console.error("[ProcessingVideoCard] Failed to fetch status:", err);
        }
      }, 2000); // Poll every 2 seconds

      return () => {
        console.log(`[ProcessingVideoCard] Stopping polling for video ${video.id}`);
        clearInterval(interval);
      };
    }
  }, [video.id, status]);

  const getStatusInfo = () => {
    switch (status) {
      case "uploaded":
        return {
          icon: faSpinner,
          text: "Waiting in queue...",
          color: "text-blue-600 dark:text-blue-400",
          bgColor: "bg-blue-50 dark:bg-blue-900/20",
        };
      case "processing":
        return {
          icon: faSpinner,
          text: `Processing... ${progress}%`,
          color: "text-indigo-600 dark:text-indigo-400",
          bgColor: "bg-indigo-50 dark:bg-indigo-900/20",
        };
      case "ready":
        return {
          icon: faCheckCircle,
          text: "Ready!",
          color: "text-green-600 dark:text-green-400",
          bgColor: "bg-green-50 dark:bg-green-900/20",
        };
      case "failed":
        return {
          icon: faExclamationTriangle,
          text: "Processing failed",
          color: "text-red-600 dark:text-red-400",
          bgColor: "bg-red-50 dark:bg-red-900/20",
        };
      default:
        return {
          icon: faSpinner,
          text: "Unknown status",
          color: "text-neutral-600 dark:text-neutral-400",
          bgColor: "bg-neutral-50 dark:bg-neutral-900/20",
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className={`${statusInfo.bgColor} rounded-lg p-6 border-2 border-neutral-200 dark:border-neutral-700`}>
      <div className="flex items-center gap-4">
        {/* Icon */}
        <div className={`${statusInfo.color} text-2xl`}>
          <FontAwesomeIcon 
            icon={statusInfo.icon} 
            className={status === "processing" || status === "uploaded" ? "animate-spin" : ""}
          />
        </div>

        {/* Video Info */}
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-neutral-900 dark:text-neutral-100 mb-1">
            {video.title}
          </h3>
          <p className={`text-sm font-medium ${statusInfo.color}`}>
            {statusInfo.text}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      {status === "processing" && (
        <div className="mt-4">
          <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-3 overflow-hidden">
            <div
              className="bg-indigo-600 dark:bg-indigo-400 h-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}