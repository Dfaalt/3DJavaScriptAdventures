import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GameHUDProps {
  level: number;
  questComplete: boolean;
  onOpenSettings: () => void;
}

export const GameHUD = ({ level, questComplete, onOpenSettings }: GameHUDProps) => {
  const levelNames = ["", "Boot Village", "Variable Fields", "Logic Forest", "Bug Dungeon", "Control Room"];
  
  return (
    <div className="fixed top-4 left-4 z-40 bg-card/80 backdrop-blur-sm p-4 rounded-lg border-2 border-primary/50 shadow-xl">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="text-2xl font-bold text-primary">Level {level}</div>
            <div className="text-sm text-foreground/60 italic">{levelNames[level]}</div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenSettings}
            className="h-8 w-8"
            title="Audio Settings"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-foreground/80">Quest:</span>
          <span className={`text-sm font-semibold ${questComplete ? 'text-green-500' : 'text-yellow-500'}`}>
            {questComplete ? '✓ Complete' : '○ In Progress'}
          </span>
        </div>
      </div>
    </div>
  );
};
