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

      // Enhanced options for better responsiveness
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

        // Add keyboard controls
        const handleKeyPress = (e) => {
          // Don't trigger if user is typing in an input field
          if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
          }

          switch(e.key.toLowerCase()) {
            case ' ':
            case 'k':
              e.preventDefault();
              if (player.paused()) {
                player.play();
              } else {
                player.pause();
              }
              break;
            
            case 'f':
              e.preventDefault();
              if (player.isFullscreen()) {
                player.exitFullscreen();
              } else {
                player.requestFullscreen();
              }
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
            
            case 'j':
              e.preventDefault();
              player.currentTime(Math.max(0, player.currentTime() - 10));
              break;
            
            case 'l':
              e.preventDefault();
              player.currentTime(Math.min(player.duration(), player.currentTime() + 10));
              break;
            
            case '0':
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
            case '7':
            case '8':
            case '9':
              e.preventDefault();
              const percent = parseInt(e.key) / 10;
              player.currentTime(player.duration() * percent);
              break;
            
            case ',':
              e.preventDefault();
              if (player.paused()) {
                player.currentTime(Math.max(0, player.currentTime() - 1/30)); // Frame backward
              }
              break;
            
            case '.':
              e.preventDefault();
              if (player.paused()) {
                player.currentTime(Math.min(player.duration(), player.currentTime() + 1/30)); // Frame forward
              }
              break;
          }
        };

        document.addEventListener('keydown', handleKeyPress);

        // Store cleanup function
        player.on('dispose', () => {
          document.removeEventListener('keydown', handleKeyPress);
        });
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