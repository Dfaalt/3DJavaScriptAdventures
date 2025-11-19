import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAudioSettings } from "@/contexts/AudioSettingsContexts";
import { Volume2, VolumeX, Music, Speaker } from "lucide-react";

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

export const SettingsDialog = ({ open, onClose }: SettingsDialogProps) => {
  const {
    musicVolume,
    sfxVolume,
    musicEnabled,
    sfxEnabled,
    setMusicVolume,
    setSfxVolume,
    setMusicEnabled,
    setSfxEnabled,
  } = useAudioSettings();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Volume2 className="w-5 h-5" />
            Audio Settings
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Music Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="music-toggle" className="flex items-center gap-2 cursor-pointer">
                <Music className="w-4 h-4" />
                Background Music
              </Label>
              <Switch
                id="music-toggle"
                checked={musicEnabled}
                onCheckedChange={setMusicEnabled}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Volume</span>
                <span className="font-medium">{Math.round(musicVolume * 100)}%</span>
              </div>
              <Slider
                value={[musicVolume * 100]}
                onValueChange={(values) => setMusicVolume(values[0] / 100)}
                max={100}
                step={1}
                disabled={!musicEnabled}
                className="w-full"
              />
            </div>
          </div>

          {/* Sound Effects Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="sfx-toggle" className="flex items-center gap-2 cursor-pointer">
                <Speaker className="w-4 h-4" />
                Sound Effects
              </Label>
              <Switch
                id="sfx-toggle"
                checked={sfxEnabled}
                onCheckedChange={setSfxEnabled}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Volume</span>
                <span className="font-medium">{Math.round(sfxVolume * 100)}%</span>
              </div>
              <Slider
                value={[sfxVolume * 100]}
                onValueChange={(values) => setSfxVolume(values[0] / 100)}
                max={100}
                step={1}
                disabled={!sfxEnabled}
                className="w-full"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
            {!musicEnabled && !sfxEnabled ? (
              <>
                <VolumeX className="w-3 h-3" />
                <span>All audio muted</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3 h-3" />
                <span>Audio settings saved automatically</span>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
