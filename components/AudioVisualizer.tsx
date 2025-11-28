import React from "react";

interface AudioVisualizerProps {
  isActive: boolean;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  isActive,
}) => {
  return (
    <div className="flex items-center justify-center gap-1 h-6 sm:h-8 px-2">
      {[1, 2, 3, 4].map((bar) => (
        <div
          key={bar}
          className={`w-1 sm:w-1.5 rounded-full transition-all duration-300 ease-in-out ${
            isActive
              ? "bg-indigo-400 animate-[pulse_0.8s_ease-in-out_infinite]"
              : "bg-slate-700 h-1.5"
          }`}
          style={{
            height: isActive ? `${Math.max(20, Math.random() * 100)}%` : "20%",
            animationDelay: `${bar * 0.15}s`,
          }}
        />
      ))}
    </div>
  );
};
