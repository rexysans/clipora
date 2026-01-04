// frontend/src/config/api.js
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
export const HLS_BASE_URL = import.meta.env.VITE_HLS_BASE_URL || 'http://localhost:8080';

export const API_ENDPOINTS = {
  AUTH_ME: `${API_BASE_URL}/auth/me`,
  AUTH_LOGOUT: `${API_BASE_URL}/auth/logout`,
  AUTH_GOOGLE: `${API_BASE_URL}/auth/google`,
  VIDEOS: `${API_BASE_URL}/videos`,
  VIDEOS_UPLOAD: `${API_BASE_URL}/videos/upload`,
  VIDEO_BY_ID: (id) => `${API_BASE_URL}/videos/${id}`,
  VIDEO_UPDATE: (id) => `${API_BASE_URL}/videos/${id}`,
  VIDEO_DELETE: (id) => `${API_BASE_URL}/videos/${id}`,
  VIDEO_THUMBNAIL: (id) => `${API_BASE_URL}/videos/${id}/thumbnail`, // NEW
  VIDEOS_BY_USER: (userId) => `${API_BASE_URL}/videos/user/${userId}`,
  VIDEOS_LIKED_BY_USER: (userId) => `${API_BASE_URL}/videos/liked/${userId}`,
  VIDEOS_HISTORY: (userId) => `${API_BASE_URL}/videos/history/${userId}`,
  VIDEOS_WATCH_LATER: (userId) => `${API_BASE_URL}/videos/watch-later/${userId}`,
  VIDEO_VIEW: (id) => `${API_BASE_URL}/videos/${id}/view`,
  VIDEO_REACTION: (id) => `${API_BASE_URL}/videos/${id}/reaction`,
  VIDEO_WATCH_LATER: (id) => `${API_BASE_URL}/videos/${id}/watch-later`,
  VIDEO_WATCH_LATER_STATUS: (id) => `${API_BASE_URL}/videos/${id}/watch-later-status`,
  VIDEO_COMMENTS: (id) => `${API_BASE_URL}/videos/${id}/comments`,
  COMMENT_BY_ID: (videoId, commentId) => `${API_BASE_URL}/videos/${videoId}/comments/${commentId}`,
  PROGRESS_BY_VIDEO_USER: (videoId, userId) => `${API_BASE_URL}/progress/${videoId}/${userId}`,
  VIDEO_STATUS: (id) => `${API_BASE_URL}/videos/${id}/status`,
  PROGRESS: `${API_BASE_URL}/progress`,
  // Followers
  USER_FOLLOW: (userId) => `${API_BASE_URL}/users/${userId}/follow`,
  USER_FOLLOW_STATUS: (userId) => `${API_BASE_URL}/users/${userId}/follow-status`,
  USER_FOLLOWERS: (userId) => `${API_BASE_URL}/users/${userId}/followers`,
  USER_FOLLOWING: (userId) => `${API_BASE_URL}/users/${userId}/following`,
  USER_FOLLOWER_NAME: `${API_BASE_URL}/users/follower-name`,
  // Search
  SEARCH: `${API_BASE_URL}/search`,
  // HLS Stream
  HLS_STREAM: (videoId) => `${HLS_BASE_URL}/hls/${videoId}/master.m3u8`,
};