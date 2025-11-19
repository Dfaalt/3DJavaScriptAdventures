import { useState } from "react";
import Editor from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useSoundEffect } from "@/hooks/useSoundEffect";

interface CodeEditorProps {
  objective: string;
  onValidate: (code: string, output: string) => boolean;
  onClose: () => void;
  onFailure: () => void;
}

export const CodeEditor = ({ objective, onValidate, onClose, onFailure }: CodeEditorProps) => {
  const [code, setCode] = useState("// Write your code here\n");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [isShaking, setIsShaking] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  const playSuccessSound = useSoundEffect("/sounds/success.mp3", 0.5);
  const playErrorSound = useSoundEffect("/sounds/error.mp3", 0.5);

  const runCode = () => {
    setOutput("");
    setError("");
    
    try {
      // Create a safe execution context
      const logs: string[] = [];
      const customConsole = {
        log: (...args: any[]) => {
          logs.push(args.map(arg => String(arg)).join(" "));
        }
      };

      // Execute code in a limited scope
      const func = new Function("console", code);
      func(customConsole);
      
      const result = logs.join("\n");
      setOutput(result || "(No output)");
      
      // Validate the code
      if (onValidate(code, result)) {
        playSuccessSound();
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        playErrorSound();
        // Trigger animations on failure
        setIsShaking(true);
        setIsFlashing(true);
        setTimeout(() => {
          setIsShaking(false);
          setIsFlashing(false);
        }, 600);
        onFailure();
      }
    } catch (err: any) {
      playErrorSound();
      setError(err.message);
      // Trigger animations on error
      setIsShaking(true);
      setIsFlashing(true);
      setTimeout(() => {
        setIsShaking(false);
        setIsFlashing(false);
      }, 600);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm transition-colors ${isFlashing ? 'animate-[flash-red_0.6s_ease-in-out]' : ''}`}>
      <div className={`w-full max-w-4xl h-[80vh] bg-card border-2 border-primary/50 rounded-lg shadow-2xl flex flex-col ${isShaking ? 'animate-[shake_0.6s_ease-in-out]' : ''}`}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h2 className="text-2xl font-bold text-primary">Script Chamber</h2>
            <p className="text-sm text-muted-foreground mt-1">{objective}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        <div className="flex-1 overflow-hidden">
          <Editor
            height="100%"
            defaultLanguage="javascript"
            theme="vs-dark"
            value={code}
            onChange={(value) => setCode(value || "")}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: "on",
              roundedSelection: false,
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
        </div>
        
        <div className="border-t border-border p-4 space-y-2">
          <div className="flex gap-2">
            <Button onClick={runCode} className="bg-primary hover:bg-primary/90">
              Run Code
            </Button>
          </div>
          
          {output && (
            <div className="bg-muted/50 rounded p-3 border border-border">
              <p className="text-xs text-muted-foreground mb-1">Output:</p>
              <pre className="text-sm text-foreground font-mono">{output}</pre>
            </div>
          )}
          
          {error && (
            <div className="bg-destructive/10 rounded p-3 border border-destructive/50">
              <p className="text-xs text-destructive mb-1">Error:</p>
              <pre className="text-sm text-destructive font-mono">{error}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
