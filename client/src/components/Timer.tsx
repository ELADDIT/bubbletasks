import { useCallback, useMemo, useRef, useState, memo } from 'react';
import Countdown, { type CountdownRenderProps } from 'react-countdown';

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

const DRIFT_THRESHOLD_MS = 1500;

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

  const endTimeRef = useRef<number>(0);

  if (endTimeRef.current === 0) {
    endTimeRef.current = Date.now() + initialRemainingSeconds * 1000;
  }

  if (isRunning && remainingSeconds != null) {
    const now = Date.now();
    const expectedMs = Math.max(0, Math.floor(remainingSeconds) * 1000);
    const currentMs = endTimeRef.current - now;
    const drift = expectedMs - currentMs;

    if (Math.abs(drift) > DRIFT_THRESHOLD_MS) {
      endTimeRef.current = now + expectedMs;
    }
  }

  // Custom renderer for the countdown
  const renderer = useCallback(({ completed }: CountdownRenderProps) => {
    const actualRemainingSeconds = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000));
    const progressPercent = ((totalDurationSeconds - actualRemainingSeconds) / totalDurationSeconds) * 100;
    const { textClass, barClass } = getTimerStyles(actualRemainingSeconds);

    // Call onTick callback with throttling to avoid excessive updates
    if (onTick && actualRemainingSeconds % 5 === 0) { // Only update every 5 seconds to reduce API calls
      onTick(actualRemainingSeconds);
    }

    if (completed) {
      onTimeUp?.();
      return <span className="font-mono font-bold text-green-300">Done! 🎉</span>;
    }

    return (
      <div className="flex items-center gap-2">
        {/* Timer Display */}
        <div className={`font-mono font-bold text-sm ${textClass}`}>
          {formatTime(actualRemainingSeconds)}
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
    const now = Date.now();

    if (isRunning) {
      const remainingMs = Math.max(0, endTimeRef.current - now);
      const remainingRoundedSeconds = Math.ceil(remainingMs / 1000);
      endTimeRef.current = now + remainingRoundedSeconds * 1000;
      setOverrideRemainingSeconds(remainingRoundedSeconds);
      setIsRunning(false);
      return;
    }

    const baseSeconds = overrideRemainingSeconds ?? remainingSeconds ?? totalDurationSeconds;
    const normalizedSeconds = Math.max(0, Math.round(baseSeconds));
    endTimeRef.current = Date.now() + normalizedSeconds * 1000;
    setOverrideRemainingSeconds(undefined);
    setIsRunning(true);
  }, [isRunning, overrideRemainingSeconds, remainingSeconds, totalDurationSeconds]);

  const handleReset = useCallback(() => {
    setIsRunning(false);
    setOverrideRemainingSeconds(totalDurationSeconds);
    endTimeRef.current = Date.now() + totalDurationSeconds * 1000;
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
          date={endTimeRef.current}
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