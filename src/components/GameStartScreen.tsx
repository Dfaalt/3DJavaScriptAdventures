import { Button } from "@/components/ui/button";
import { Play, Volume2 } from "lucide-react";

interface GameStartScreenProps {
  onStart: () => void;
}

export const GameStartScreen = ({ onStart }: GameStartScreenProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-8 p-8 text-center">
        <div className="space-y-4">
          <h1 className="text-6xl font-bold text-primary animate-pulse">
            Code Quest
          </h1>
          <p className="text-xl text-muted-foreground">
            An Adventure in Programming
          </p>
        </div>
        
        <div className="space-y-2 text-sm text-muted-foreground max-w-md">
          <p>🎮 Use WASD or Arrow Keys to move</p>
          <p>🗣️ Press E to talk to NPCs</p>
          <p>⌨️ Complete coding challenges to progress</p>
          <p>🌀 Enter portals to advance to the next level</p>
        </div>

        <Button 
          size="lg" 
          onClick={onStart}
          className="text-lg px-8 py-6 gap-2 animate-scale-in"
        >
          <Play className="w-5 h-5" />
          Start Adventure
        </Button>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Volume2 className="w-3 h-3" />
          <span>Audio will start when you begin</span>
        </div>
      </div>
    </div>
  );
};
