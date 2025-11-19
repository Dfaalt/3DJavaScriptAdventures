import { useCallback, useRef } from 'react';
import { useAudioSettings } from '@/contexts/AudioSettingsContexts';

export const useSoundEffect = (soundPath: string, baseVolume: number = 0.5) => {
  const { sfxVolume, sfxEnabled } = useAudioSettings();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const play = useCallback(() => {
    if (!sfxEnabled) return;
    
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio(soundPath);
      }
      
      // Update volume based on settings
      audioRef.current.volume = baseVolume * sfxVolume;
      
      // Reset to start and play
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(err => {
        console.error('Error playing sound:', err);
      });
    } catch (error) {
      console.error('Error initializing sound:', error);
    }
  }, [soundPath, baseVolume, sfxVolume, sfxEnabled]);

  return play;
};
