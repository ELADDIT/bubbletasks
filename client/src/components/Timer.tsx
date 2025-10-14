import { useCallback, useEffect, useMemo, useState, memo } from 'react';
import Countdown from 'react-countdown';

interface TimerProps {
  totalMinutes: number;
  remainingSeconds?: number;
  isActive?: boolean;
  onTimeUp?: () => void;
  onTick?: (remainingSeconds: number) => void;
}

const getTimerStyles = (secondsRemaining: number) => {
  if (secondsRemaining <= 60) {
    return {
      textClass: 'text-red-300',
      barClass: 'bg-red-400'
    };
  }

  if (secondsRemaining <= 300) {
    return {
      textClass: 'text-yellow-300',
      barClass: 'bg-yellow-400'
    };
  }

  return {
    textClass: 'text-white',
    barClass: 'bg-green-400'
  };
};

const formatTime = (secondsRemaining: number) => {
  const safeSeconds = Math.max(0, Math.floor(secondsRemaining));
  const displayMinutes = Math.floor(safeSeconds / 60);
  const displaySeconds = safeSeconds % 60;

  return `${displayMinutes.toString().padStart(2, '0')}:${displaySeconds.toString().padStart(2, '0')}`;
};

// Memoized timer component to prevent unnecessary re-renders
const Timer = memo(function Timer({ totalMinutes, remainingSeconds, isActive = false, onTimeUp, onTick }: TimerProps) {
  const [isRunning, setIsRunning] = useState(isActive);
  const [key, setKey] = useState(0); // Force re-mount when reset
  const [overrideRemainingSeconds, setOverrideRemainingSeconds] = useState<number | undefined>();

  const totalDurationSeconds = useMemo(() => Math.max(totalMinutes * 60, 1), [totalMinutes]);

  const initialRemainingSeconds = useMemo(() => {
    const fallbackSeconds = totalMinutes * 60;
    const sourceSeconds = overrideRemainingSeconds ?? remainingSeconds ?? fallbackSeconds;
    return Math.max(0, Math.floor(sourceSeconds));
  }, [overrideRemainingSeconds, remainingSeconds, totalMinutes]);

  useEffect(() => {
    setOverrideRemainingSeconds(undefined);
  }, [remainingSeconds]);

  // Calculate end time
  const endTime = useMemo(() => {
    return Date.now() + initialRemainingSeconds * 1000;
  }, [initialRemainingSeconds, key]);

  // Custom renderer for the countdown
  const renderer = useCallback(({ minutes, seconds, completed }: any) => {
    const totalSeconds = minutes * 60 + seconds;
    const progressPercent = ((totalDurationSeconds - totalSeconds) / totalDurationSeconds) * 100;
    const { textClass, barClass } = getTimerStyles(totalSeconds);

    // Call onTick callback with throttling to avoid excessive updates
    if (onTick && totalSeconds % 5 === 0) { // Only update every 5 seconds to reduce API calls
      onTick(totalSeconds);
    }

    if (completed) {
      onTimeUp?.();
      return <span className="font-mono font-bold text-green-300">Done! 🎉</span>;
    }

    return (
      <div className="flex items-center gap-2">
        {/* Timer Display */}
        <div className={`font-mono font-bold text-sm ${textClass}`}>
          {formatTime(totalSeconds)}
        </div>

        {/* Progress Bar */}
        <div className="w-12 h-1 bg-white/20 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${barClass}`}
            style={{ width: `${Math.min(Math.max(progressPercent, 0), 100)}%` }}
          />
        </div>
      </div>
    );
  }, [onTick, onTimeUp, totalDurationSeconds]);

  const handleToggle = useCallback(() => {
    setIsRunning(!isRunning);
  }, [isRunning]);

  const handleReset = useCallback(() => {
    setIsRunning(false);
    setOverrideRemainingSeconds(totalDurationSeconds);
    setKey(prev => prev + 1); // Force remount with new end time
    onTick?.(totalDurationSeconds);
  }, [onTick, totalDurationSeconds]);

  const { textClass, barClass } = getTimerStyles(initialRemainingSeconds);
  const staticProgressPercent = ((totalDurationSeconds - initialRemainingSeconds) / totalDurationSeconds) * 100;

  return (
    <div className="flex items-center gap-2">
      {isRunning ? (
        <Countdown
          key={key}
          date={endTime}
          renderer={renderer}
          autoStart={true}
        />
      ) : (
        <div className="flex items-center gap-2">
          <div className={`font-mono font-bold text-sm ${textClass} opacity-60`}> 
            {formatTime(initialRemainingSeconds)}
          </div>
          <div className="w-12 h-1 bg-white/20 rounded-full">
            <div
              className={`h-full ${barClass} transition-all duration-300`}
              style={{ width: `${Math.min(Math.max(staticProgressPercent, 0), 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Timer Controls */}
      <div className="flex gap-1 ml-1">
        <button
          onClick={handleToggle}
          className="w-5 h-5 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-xs transition-all duration-200"
          title={isRunning ? 'Pause' : 'Start'}
        >
          {isRunning ? '⏸️' : '▶️'}
        </button>
        
        <button
          onClick={handleReset}
          className="w-5 h-5 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-xs transition-all duration-200"
          title="Reset"
        >
          🔄
        </button>
      </div>
    </div>
  );
});

export default Timer;