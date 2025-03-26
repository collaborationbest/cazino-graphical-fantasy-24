
import React from 'react';
import { GraphCanvas } from './GraphCanvas';
import { wsData } from '@/utils/crashData';

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
  // Find the closest data point to the current multiplier
  const getClosestDataIndex = (targetMultiplier: number): number => {
    // If we're beyond the data, return the last index
    if (targetMultiplier >= wsData[wsData.length - 1].v) {
      return wsData.length - 1;
    }
    
    // Find the index of the first data point with value >= targetMultiplier
    const index = wsData.findIndex(point => point.v >= targetMultiplier);
    return index >= 0 ? index : 0;
  };

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
