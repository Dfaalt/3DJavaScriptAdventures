import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AudioSettings {
  musicVolume: number;
  sfxVolume: number;
  musicEnabled: boolean;
  sfxEnabled: boolean;
}

interface AudioSettingsContextType extends AudioSettings {
  setMusicVolume: (volume: number) => void;
  setSfxVolume: (volume: number) => void;
  setMusicEnabled: (enabled: boolean) => void;
  setSfxEnabled: (enabled: boolean) => void;
}

const AudioSettingsContext = createContext<AudioSettingsContextType | undefined>(undefined);

const STORAGE_KEY = 'audio-settings';

const defaultSettings: AudioSettings = {
  musicVolume: 0.25,
  sfxVolume: 0.5,
  musicEnabled: true,
  sfxEnabled: true,
};

export const AudioSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<AudioSettings>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return { ...defaultSettings, ...JSON.parse(stored) };
      } catch {
        return defaultSettings;
      }
    }
    return defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const setMusicVolume = (volume: number) => {
    setSettings(prev => ({ ...prev, musicVolume: volume }));
  };

  const setSfxVolume = (volume: number) => {
    setSettings(prev => ({ ...prev, sfxVolume: volume }));
  };

  const setMusicEnabled = (enabled: boolean) => {
    setSettings(prev => ({ ...prev, musicEnabled: enabled }));
  };

  const setSfxEnabled = (enabled: boolean) => {
    setSettings(prev => ({ ...prev, sfxEnabled: enabled }));
  };

  return (
    <AudioSettingsContext.Provider
      value={{
        ...settings,
        setMusicVolume,
        setSfxVolume,
        setMusicEnabled,
        setSfxEnabled,
      }}
    >
      {children}
    </AudioSettingsContext.Provider>
  );
};

export const useAudioSettings = () => {
  const context = useContext(AudioSettingsContext);
  if (!context) {
    throw new Error('useAudioSettings must be used within AudioSettingsProvider');
  }
  return context;
};
