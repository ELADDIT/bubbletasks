import { useCallback, useMemo, useState, memo } from 'react';
import Countdown from 'react-countdown';

interface TimerProps {
  totalMinutes: number;
  isActive?: boolean;
  onTimeUp?: () => void;
  onTick?: (remainingSeconds: number) => void;
}

// Memoized timer component to prevent unnecessary re-renders
const Timer = memo(function Timer({ totalMinutes, isActive = false, onTimeUp, onTick }: TimerProps) {
  const [isRunning, setIsRunning] = useState(isActive);
  const [key, setKey] = useState(0); // Force re-mount when reset

  // Calculate end time
  const endTime = useMemo(() => {
    return Date.now() + (totalMinutes * 60 * 1000);
  }, [totalMinutes, key]);

  // Custom renderer for the countdown
  const renderer = useCallback(({ minutes, seconds, completed }: any) => {
    const totalSeconds = minutes * 60 + seconds;
    const totalDuration = totalMinutes * 60;
    const progressPercent = ((totalDuration - totalSeconds) / totalDuration) * 100;

    // Call onTick callback with throttling to avoid excessive updates
    if (onTick && totalSeconds % 5 === 0) { // Only update every 5 seconds to reduce API calls
      onTick(totalSeconds);
    }

    if (completed) {
      onTimeUp?.();
      return <span className="font-mono font-bold text-green-300">Done! 🎉</span>;
    }

    // Format time display
    const displayMinutes = Math.floor(totalSeconds / 60);
    const displaySeconds = totalSeconds % 60;
    const timeString = `${displayMinutes.toString().padStart(2, '0')}:${displaySeconds.toString().padStart(2, '0')}`;

    return (
      <div className="flex items-center gap-2">
        {/* Timer Display */}
        <div className={`font-mono font-bold text-sm ${
          totalSeconds <= 60 ? 'text-red-300' : 
          totalSeconds <= 300 ? 'text-yellow-300' : 
          'text-white'
        }`}>
          {timeString}
        </div>

        {/* Progress Bar */}
        <div className="w-12 h-1 bg-white/20 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-300 ${
              totalSeconds <= 60 ? 'bg-red-400' : 
              totalSeconds <= 300 ? 'bg-yellow-400' : 
              'bg-green-400'
            }`}
            style={{ width: `${Math.min(progressPercent, 100)}%` }}
          />
        </div>
      </div>
    );
  }, [totalMinutes, onTick, onTimeUp]);

  const handleToggle = useCallback(() => {
    setIsRunning(!isRunning);
  }, [isRunning]);

  const handleReset = useCallback(() => {
    setIsRunning(false);
    setKey(prev => prev + 1); // Force remount with new end time
  }, []);

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
          <div className="font-mono font-bold text-sm text-white/60">
            {Math.floor(totalMinutes).toString().padStart(2, '0')}:00
          </div>
          <div className="w-12 h-1 bg-white/20 rounded-full">
            <div className="w-0 h-full bg-green-400" />
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