import { useEffect, useRef } from 'react';
import { useAudioSettings } from '@/contexts/AudioSettingsContexts';

export const useBackgroundMusic = (musicPath: string, isGameStarted: boolean) => {
  const { musicVolume, musicEnabled } = useAudioSettings();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Stop music if disabled or game not started
    if (!musicEnabled || !isGameStarted) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
      }
      return;
    }
    // Clear any existing fade intervals
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
    }

    // Fade out current music if playing
    if (audioRef.current && !audioRef.current.paused) {
      const currentAudio = audioRef.current;
      const fadeOutDuration = 1000; // 1 second
      const steps = 20;
      const volumeStep = currentAudio.volume / steps;
      const intervalTime = fadeOutDuration / steps;

      let currentStep = 0;
      fadeIntervalRef.current = setInterval(() => {
        currentStep++;
        const newVolume = Math.max(0, currentAudio.volume - volumeStep);
        currentAudio.volume = newVolume;

        if (currentStep >= steps || newVolume <= 0) {
          currentAudio.pause();
          currentAudio.currentTime = 0;
          if (fadeIntervalRef.current) {
            clearInterval(fadeIntervalRef.current);
          }
          startNewMusic();
        }
      }, intervalTime);
    } else {
      startNewMusic();
    }

    function startNewMusic() {
      // Create and play new music
      audioRef.current = new Audio(musicPath);
      audioRef.current.loop = true;
      audioRef.current.volume = 0;

      audioRef.current.play().catch(err => {
        console.error('Error playing background music:', err);
      });

      // Fade in new music
      const fadeInDuration = 1500; // 1.5 seconds
      const steps = 30;
      const volumeStep = musicVolume / steps;
      const intervalTime = fadeInDuration / steps;

      let currentStep = 0;
      fadeIntervalRef.current = setInterval(() => {
        if (audioRef.current) {
          currentStep++;
          const newVolume = Math.min(musicVolume, audioRef.current.volume + volumeStep);
          audioRef.current.volume = newVolume;

          if (currentStep >= steps || newVolume >= musicVolume) {
            if (fadeIntervalRef.current) {
              clearInterval(fadeIntervalRef.current);
            }
          }
        }
      }, intervalTime);
    }

    return () => {
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [musicPath, musicVolume, musicEnabled, isGameStarted]);

  // Update volume when settings change
  useEffect(() => {
    if (audioRef.current && musicEnabled && isGameStarted) {
      audioRef.current.volume = musicVolume;
    }
  }, [musicVolume, musicEnabled, isGameStarted]);
};
