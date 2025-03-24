
import React from 'react';
import { motion } from 'framer-motion';

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
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className={`text-5xl font-bold ${colorClass}`}
      >
        {display}
      </motion.div>
    </div>
  );
};

export default GameStats;
