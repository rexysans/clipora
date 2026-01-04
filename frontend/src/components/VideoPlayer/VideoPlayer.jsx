import React, { useRef, useEffect } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import "./VideoPlayer.css";
import "videojs-contrib-quality-levels";

export const VideoPlayer = (props) => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const { options, onReady } = props;

  useEffect(() => {
    if (!playerRef.current) {
      const videoElement = document.createElement("video-js");
      videoElement.classList.add("vjs-big-play-centered");
      videoRef.current.appendChild(videoElement);

      const player = (playerRef.current = videojs(videoElement, options, () => {
        videojs.log("player is ready");
        onReady && onReady(player);
        
        // Add fullscreen event listeners for landscape orientation on mobile
        player.on('fullscreenchange', () => {
          if (player.isFullscreen()) {
            // Lock to landscape when entering fullscreen on mobile/tablet
            if (screen.orientation && screen.orientation.lock) {
              screen.orientation.lock('landscape').catch(err => {
                console.log('Orientation lock failed:', err);
              });
            }
          } else {
            // Unlock orientation when exiting fullscreen
            if (screen.orientation && screen.orientation.unlock) {
              screen.orientation.unlock();
            }
          }
        });
      }));

      const MenuButton = videojs.getComponent("MenuButton");
      const MenuItem = videojs.getComponent("MenuItem");

      // --- HELPER: Reset all menu items to unselected ---
      const resetSelection = (menuItem) => {
        const parent = menuItem.parentComponent_;
        if (parent) {
          parent.children().forEach((child) => {
            if (child !== menuItem) child.selected(false);
          });
        }
      };

      // --- 1. Resolution Item (720p, 360p...) ---
      class QualityMenuItem extends MenuItem {
        constructor(player, options) {
          super(player, options);
          this.qualityLevel = options.qualityLevel;
          this.levels = options.levels;
        }

        handleClick() {
          // LOGIC: Enable only this level
          for (let i = 0; i < this.levels.length; i++) {
            this.levels[i].enabled = false;
          }
          this.qualityLevel.enabled = true;

          // UI: Uncheck siblings, check myself
          resetSelection(this);
          this.selected(true);
        }
      }

      // --- 2. Auto Item ---
      class AutoMenuItem extends MenuItem {
        constructor(player, options) {
          super(player, options);
          this.levels = options.levels;
        }

        handleClick() {
          // LOGIC: Enable ALL levels
          for (let i = 0; i < this.levels.length; i++) {
            this.levels[i].enabled = true;
          }

          // UI: Uncheck siblings, check myself
          resetSelection(this);
          this.selected(true);
        }
      }

      // --- 3. The Gear Button ---
      class QualityMenuButton extends MenuButton {
        constructor(player, options) {
          super(player, options);
          // Update menu when new levels are found
          this.player().qualityLevels().on('addqualitylevel', () => this.update());
        }

        createItems() {
          const levels = this.player().qualityLevels();
          const items = [];

          // Logic to determine if "Auto" is currently active
          // (Auto is active if ALL levels are enabled)
          const isAuto = levels.length > 0 && levels[0].enabled && levels[levels.length - 1].enabled;

          items.push(new AutoMenuItem(this.player(), {
            label: 'Auto',
            selectable: true,
            selected: isAuto, 
            levels: levels
          }));

          for (let i = levels.length - 1; i >= 0; i--) {
            const level = levels[i];
            if (!level.height) continue;

            // A level is selected ONLY if it's enabled AND Auto is off
            const isSelected = level.enabled && !isAuto;

            items.push(new QualityMenuItem(this.player(), {
              label: `${level.height}p`,
              selectable: true,
              selected: isSelected,
              qualityLevel: level,
              levels: levels
            }));
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

      player.ready(() => {
        const qualityLevels = player.qualityLevels();
        const addGearButton = () => {
           if (player.controlBar.getChild("QualityMenuButton")) return;
           const index = player.controlBar.children_.length - 1;
           player.controlBar.addChild("QualityMenuButton", {}, index);
        };

        if (qualityLevels.length > 0) addGearButton();
        else qualityLevels.one("addqualitylevel", addGearButton);
      });

    } else {
      const player = playerRef.current;
      player.autoplay(options.autoplay);
      player.src(options.sources);
    }
  }, [options, videoRef]);

  // ... rest of your code ...
  useEffect(() => {
      const player = playerRef.current;
      return () => {
        if (player && !player.isDisposed()) {
          player.dispose();
          playerRef.current = null;
        }
      };
    }, [playerRef]);
  
    return (
      <div data-vjs-player className="w-full aspect-video">
        <div ref={videoRef} className="w-full h-full" />
      </div>
    );
};

export default VideoPlayer;