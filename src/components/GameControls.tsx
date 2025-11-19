export const GameControls = () => {
  return (
    <div className="fixed bottom-4 right-4 z-40 bg-card/90 backdrop-blur-sm border border-primary/30 rounded-lg p-4 space-y-2">
      <h3 className="text-sm font-bold text-primary mb-2">Controls</h3>
      <div className="text-xs space-y-1 text-foreground/80">
        <p><kbd className="px-2 py-1 bg-muted rounded text-primary">W</kbd> Move Forward</p>
        <p><kbd className="px-2 py-1 bg-muted rounded text-primary">S</kbd> Move Back</p>
        <p><kbd className="px-2 py-1 bg-muted rounded text-primary">A</kbd> Turn Left</p>
        <p><kbd className="px-2 py-1 bg-muted rounded text-primary">D</kbd> Turn Right</p>
        <p><kbd className="px-2 py-1 bg-muted rounded text-primary">E</kbd> Interact</p>
      </div>
    </div>
  );
};
