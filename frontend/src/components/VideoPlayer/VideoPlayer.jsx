import React, { useRef, useEffect } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import "./VideoPlayer.css";
import "videojs-contrib-quality-levels";

// --- 1. Define Classes OUTSIDE the component ---

const MenuButton = videojs.getComponent("MenuButton");
const MenuItem = videojs.getComponent("MenuItem");

// Helper: Reset selection on all siblings
const resetSelection = (menuItem) => {
  const parent = menuItem.parentComponent_;
  if (parent) {
    parent.children().forEach((child) => {
      if (child !== menuItem) child.selected(false);
    });
  }
};

class QualityMenuItem extends MenuItem {
  constructor(player, options) {
    super(player, options);
    this.qualityLevel = options.qualityLevel;
    this.levels = options.levels;
  }

  handleClick() {
    // Enable only this level
    for (let i = 0; i < this.levels.length; i++) {
      this.levels[i].enabled = false;
    }
    this.qualityLevel.enabled = true;

    // Update UI
    resetSelection(this);
    this.selected(true);
  }
}

class AutoMenuItem extends MenuItem {
  constructor(player, options) {
    super(player, options);
    this.levels = options.levels;
  }

  handleClick() {
    // Enable ALL levels for Auto mode
    for (let i = 0; i < this.levels.length; i++) {
      this.levels[i].enabled = true;
    }

    // Update UI
    resetSelection(this);
    this.selected(true);
  }
}

class QualityMenuButton extends MenuButton {
  constructor(player, options) {
    super(player, options);
    // Update when levels are added/removed
    player.qualityLevels().on('addqualitylevel', () => this.update());
    player.qualityLevels().on('removequalitylevel', () => this.update());
  }

  // --- CRITICAL FIX FOR HOVER ---
  update() {
    // 1. Remove the old menu if it exists
    if (this.menu) {
      this.removeChild(this.menu);
      this.menu.dispose();
      this.menu = null;
    }

    // 2. Create a NEW menu immediately (this calls createItems internally)
    const menu = this.createMenu();
    this.menu = menu;

    // 3. Add the new menu to the button (Required for Hover to work)
    this.addChild(menu);

    // 4. Update Visibility (Show button if we have items)
    if (this.items && this.items.length > 0) {
      this.show();
    } else {
      this.hide();
    }
  }

  createItems() {
    const levels = this.player().qualityLevels();
    const items = [];

    if (!levels || levels.length === 0) return items;

    // Check if Auto is active (all levels enabled)
    const isAuto = levels.length > 0 && levels[0].enabled && levels[levels.length - 1].enabled;

    // 1. Add Auto Option
    items.push(new AutoMenuItem(this.player(), {
      label: 'Auto',
      selectable: true,
      selected: isAuto,
      levels: levels
    }));

    // 2. Add Resolution Options (Sorted & Deduplicated)
    const addedHeights = new Set();
    const sortedLevels = Array.from(levels).sort((a, b) => b.height - a.height);

    for (const level of sortedLevels) {
      if (!level.height || addedHeights.has(level.height)) continue;

      const isSelected = level.enabled && !isAuto;

      items.push(new QualityMenuItem(this.player(), {
        label: `${level.height}p`,
        selectable: true,
        selected: isSelected,
        qualityLevel: level,
        levels: levels
      }));

      addedHeights.add(level.height);
    }

    return items;
  }

  buildCSSClass() {
    return `vjs-icon-cog ${super.buildCSSClass()}`;
  }
}

if (!videojs.getComponent("QualityMenuButton")) {
  videojs.registerComponent("QualityMenuButton", QualityMenuButton);
}

// --- 2. The React Component ---
export const VideoPlayer = (props) => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const { options, onReady } = props;

  useEffect(() => {
    if (!playerRef.current) {
      const videoElement = document.createElement("video-js");
      videoElement.classList.add("vjs-big-play-centered");

      if (!videoRef.current) return;
      videoRef.current.appendChild(videoElement);

      const playerOptions = {
        ...options,
        responsive: true,
        fluid: true,
        fill: false,
        aspectRatio: '16:9',
        controlBar: {
          volumePanel: {
            inline: false
          }
        }
      };

      const player = (playerRef.current = videojs(videoElement, playerOptions, () => {
        videojs.log("player is ready");
        onReady && onReady(player);

        player.on('fullscreenchange', () => {
          if (player.isFullscreen()) {
            if (screen.orientation && screen.orientation.lock) {
              screen.orientation.lock('landscape').catch(err => console.log(err));
            }
          } else {
            if (screen.orientation && screen.orientation.unlock) {
              screen.orientation.unlock();
            }
          }
        });
      }));

      const addGearButton = () => {
        if (player.controlBar.getChild("QualityMenuButton")) return;
        const index = player.controlBar.children_.length - 1;
        player.controlBar.addChild("QualityMenuButton", {}, index);
      };

      player.ready(() => {
        const qualityLevels = player.qualityLevels();

        if (qualityLevels.length > 0) addGearButton();

        qualityLevels.on("addqualitylevel", () => {
             addGearButton();
             // Manually trigger update to ensure button state is correct
             const btn = player.controlBar.getChild("QualityMenuButton");
             if (btn) btn.update();
        });

        player.one("loadedmetadata", () => {
            addGearButton();
            const btn = player.controlBar.getChild("QualityMenuButton");
            if (btn) btn.update();
        });

        const handleKeyPress = (e) => {
          if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

          switch(e.key.toLowerCase()) {
            case ' ': case 'k':
              e.preventDefault();
              player.paused() ? player.play() : player.pause();
              break;
            case 'f':
              e.preventDefault();
              player.isFullscreen() ? player.exitFullscreen() : player.requestFullscreen();
              break;
            case 'm':
              e.preventDefault();
              player.muted(!player.muted());
              break;
            case 'arrowleft':
              e.preventDefault();
              player.currentTime(Math.max(0, player.currentTime() - 5));
              break;
            case 'arrowright':
              e.preventDefault();
              player.currentTime(Math.min(player.duration(), player.currentTime() + 5));
              break;
            case 'arrowup':
              e.preventDefault();
              player.volume(Math.min(1, player.volume() + 0.1));
              break;
            case 'arrowdown':
              e.preventDefault();
              player.volume(Math.max(0, player.volume() - 0.1));
              break;
          }
        };

        document.addEventListener('keydown', handleKeyPress);
        player.on('dispose', () => {
          document.removeEventListener('keydown', handleKeyPress);
        });
      });

    } else {
      const player = playerRef.current;
      player.autoplay(options.autoplay);
      player.src(options.sources);

      setTimeout(() => {
         const btn = player.controlBar.getChild("QualityMenuButton");
         if (!btn) {
             const index = player.controlBar.children_.length - 1;
             player.controlBar.addChild("QualityMenuButton", {}, index);
         } else {
             btn.update();
         }
      }, 500);
    }
  }, [options, videoRef, onReady]);

  useEffect(() => {
    const player = playerRef.current;
    return () => {
      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
      }
    };
  }, []);

  return (
    <div data-vjs-player className="w-full aspect-video">
      <div ref={videoRef} className="w-full h-full" />
    </div>
  );
};

export default VideoPlayer;