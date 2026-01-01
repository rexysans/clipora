export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const API_ENDPOINTS = {
  AUTH_ME: `${API_BASE_URL}/auth/me`,
  AUTH_LOGOUT: `${API_BASE_URL}/auth/logout`,
  AUTH_GOOGLE: `${API_BASE_URL}/auth/google`,
  VIDEOS: `${API_BASE_URL}/api/videos`,
  VIDEOS_UPLOAD: `${API_BASE_URL}/videos/upload`,
  VIDEO_BY_ID: (id) => `${API_BASE_URL}/videos/${id}`,
  PROGRESS_BY_VIDEO_USER: (videoId, userId) => `${API_BASE_URL}/progress/${videoId}/${userId}`,
  PROGRESS: `${API_BASE_URL}/progress`,
};