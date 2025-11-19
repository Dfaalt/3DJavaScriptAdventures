import { Button } from "@/components/ui/button";
import { useEffect, useState, useRef } from "react";
import { useSoundEffect } from "@/hooks/useSoundEffect";

interface GameDialogProps {
  npcName: string;
  message: string;
  onClose: () => void;
  showEditorButton?: boolean;
  onOpenEditor?: () => void;
  avatarUrl?: string;
}

export const GameDialog = ({ npcName, message, onClose, showEditorButton = false, onOpenEditor, avatarUrl }: GameDialogProps) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const currentIndexRef = useRef(0);
  const playTypingSound = useSoundEffect("/sounds/typing.mp3", 0.2);
  const playDialogSound = useSoundEffect("/sounds/dialog.mp3", 0.4);

  useEffect(() => {
    setDisplayedText("");
    setIsTypingComplete(false);
    currentIndexRef.current = 0;
    
    // Play dialog open sound
    playDialogSound();

    const typingInterval = setInterval(() => {
      if (currentIndexRef.current < message.length) {
        setDisplayedText(message.slice(0, currentIndexRef.current + 1));
        currentIndexRef.current++;
        
        // Play typing sound every 3 characters for performance
        if (currentIndexRef.current % 3 === 0) {
          playTypingSound();
        }
      } else {
        setIsTypingComplete(true);
        clearInterval(typingInterval);
      }
    }, 30);

    return () => clearInterval(typingInterval);
  }, [message, playDialogSound, playTypingSound]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        if (!isTypingComplete) {
          // First Enter: show full text immediately
          setDisplayedText(message);
          setIsTypingComplete(true);
          currentIndexRef.current = message.length;
        } else {
          // Second Enter: close dialog
          onClose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isTypingComplete, message, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 pointer-events-none">
      <div className="w-full max-w-2xl bg-card/95 backdrop-blur-sm border-2 border-primary/50 rounded-lg p-6 shadow-2xl pointer-events-auto animate-in slide-in-from-bottom-4">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-16 h-16 rounded-full bg-primary/20 border-2 border-primary overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt={npcName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-2xl">💬</span>
              </div>
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-primary mb-2">{npcName}</h3>
            <p className="text-foreground/90 mb-4 leading-relaxed">
              {displayedText}
              {!isTypingComplete && <span className="inline-block w-1 h-5 bg-primary ml-1 animate-pulse" />}
            </p>
            <div className="flex gap-2">
              {showEditorButton && onOpenEditor && (
                <Button onClick={onOpenEditor} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  Open Editor
                </Button>
              )}
              <Button 
                onClick={onClose} 
                variant={showEditorButton ? "outline" : "default"}
                className={showEditorButton ? "" : "bg-primary hover:bg-primary/90 text-primary-foreground"}
              >
                {showEditorButton ? "Explore First" : "OK"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
