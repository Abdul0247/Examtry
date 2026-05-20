import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface ExamTimerProps {
  totalSeconds: number;
  onTimeUp: () => void;
}

export function ExamTimer({ totalSeconds, onTimeUp }: ExamTimerProps) {
  const [remaining, setRemaining] = useState(totalSeconds);

  useEffect(() => {
    if (remaining <= 0) {
      onTimeUp();
      return;
    }
    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [remaining, onTimeUp]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const isLow = remaining < 300; // under 5 minutes
  const isCritical = remaining < 60;

  return (
    <div
      className={`flex items-center gap-2 rounded-lg px-4 py-2 font-mono text-lg font-semibold transition-colors ${
        isCritical
          ? "bg-destructive/10 text-destructive animate-pulse"
          : isLow
            ? "bg-warning/10 text-warning-foreground"
            : "bg-muted text-foreground"
      }`}
    >
      <Clock className="h-5 w-5" />
      <span>
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </span>
    </div>
  );
}
