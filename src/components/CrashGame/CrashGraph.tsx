
import React from 'react';
import { GraphCanvas } from './GraphCanvas';
import { getClosestDataIndex } from '@/utils/crashData';

interface CrashGraphProps {
  multiplier: number;
  maxMultiplier: number;
  crashed: boolean;
  gameHistory: number[];
}

const CrashGraph: React.FC<CrashGraphProps> = ({
  multiplier,
  maxMultiplier,
  crashed,
  gameHistory
}) => {
  // Get current data index based on multiplier
  const dataIndex = getClosestDataIndex(multiplier);

  return (
    <div className="w-full h-full rounded-2xl glass-panel graph-container overflow-hidden animate-fade-in">
      <GraphCanvas 
        multiplier={multiplier} 
        maxMultiplier={maxMultiplier} 
        crashed={crashed}
        dataIndex={dataIndex}
      />
    </div>
  );
};

export default CrashGraph;
