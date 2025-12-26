const video = document.getElementById("video");
const videoId = "2c3e24f1-9a2a-47fc-88ea-2ae82ffb5873";

const hlsUrl = `http://localhost:5000/hls/${videoId}/index.m3u8`;

if (Hls.isSupported()) {
  const hls = new Hls();
  hls.loadSource(hlsUrl);
  hls.attachMedia(video);

  hls.on(Hls.Events.MANIFEST_PARSED, () => {
    video.play();
  });
} else if (video.canPlayType("application/vnd.apple.mpegurl")) {
  // Safari fallback
  video.src = hlsUrl;
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
}
