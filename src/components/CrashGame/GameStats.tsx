
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface GameStatsProps {
  currentMultiplier: number;
  isGameRunning: boolean;
  crashed: boolean;
}

const GameStats: React.FC<GameStatsProps> = ({ 
  currentMultiplier, 
  isGameRunning, 
  crashed 
}) => {
  // Determine what to show based on game state
  let display = "";
  let colorClass = "";
  
  if (!isGameRunning && !crashed) {
    display = "STARTING SOON";
    colorClass = "text-casino-text-dim";
  } else if (crashed) {
    display = "CRASHED @ " + currentMultiplier.toFixed(2) + "×";
    colorClass = "text-casino-red";
  } else {
    display = currentMultiplier.toFixed(2) + "×";
    colorClass = "text-casino-green";
  }
  
  return (
    <div className="absolute top-5 left-1/2 transform -translate-x-1/2 z-10">
      <AnimatePresence mode="wait">
        <motion.div
          key={crashed ? 'crashed' : isGameRunning ? 'running' : 'waiting'}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ 
            scale: crashed ? [1, 1.1, 1] : 1, 
            opacity: 1 
          }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ 
            type: "spring", 
            stiffness: crashed ? 300 : 260, 
            damping: crashed ? 10 : 20 
          }}
          className={`text-6xl md:text-7xl font-bold ${colorClass} flex items-center justify-center`}
        >
          {display}
          {!crashed && isGameRunning && (
            <motion.div 
              animate={{ 
                scale: [1, 1.1, 1],
                opacity: [1, 0.7, 1]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                repeatType: "reverse"
              }}
              className="ml-2 text-4xl"
            >
              🚀
            </motion.div>
          )}
          {crashed && (
            <motion.div 
              initial={{ rotate: 0 }}
              animate={{ rotate: [0, -15, 15, -10, 10, 0] }}
              transition={{ duration: 0.5 }}
              className="ml-2 text-4xl"
            >
              💥
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default GameStats;
