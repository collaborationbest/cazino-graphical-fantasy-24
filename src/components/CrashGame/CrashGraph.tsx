
import React, { useRef, useEffect, useState } from 'react';
import { wsData, getMaxMultiplier } from '@/utils/crashData';

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // Store current data point index
  const [dataIndex, setDataIndex] = useState(0);

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

  // Draw the graph on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const container = containerRef.current;
    if (!container) return;

    // Update canvas dimensions to match container
    const updateCanvasSize = () => {
      if (canvas && container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    // Update the data index based on the current multiplier
    const currentIndex = getClosestDataIndex(multiplier);
    setDataIndex(currentIndex);

    // Draw function
    const draw = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Graph settings - adjust padding to give more space for graph
      const padding = { left: 60, right: 40, top: 40, bottom: 60 };
      const graphWidth = width - padding.left - padding.right;
      const graphHeight = height - padding.top - padding.bottom;

      // Use the real data's max value or current multiplier, whichever is higher
      const dataMax = getMaxMultiplier();
      const displayMax = Math.max(maxMultiplier, dataMax, Math.ceil(multiplier * 1.2));
      const xScale = graphWidth / displayMax;
      const yScale = graphHeight / displayMax;

      // Draw background grid - dynamic grid based on current multiplier
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;

      // Determine grid step based on multiplier range
      const gridStep = displayMax <= 10 ? 1 :
        displayMax <= 20 ? 2 :
          displayMax <= 50 ? 5 : 10;

      // Vertical grid lines - start from 0
      for (let i = 0; i <= displayMax; i += gridStep) {
        const x = padding.left + i * xScale;
        ctx.beginPath();
        ctx.moveTo(x, padding.top);
        ctx.lineTo(x, height - padding.bottom);
        ctx.stroke();

        // Draw x-axis labels at reasonable intervals
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(i.toString() + 'x', x, height - padding.bottom + 20);
      }

      // Horizontal grid lines - start from 0
      for (let i = 0; i <= displayMax; i += gridStep) {
        const y = height - padding.bottom - i * yScale;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();

        // Draw y-axis labels
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '12px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(i.toString() + 'x', padding.left - 10, y + 5);
      }

      // Draw x and y axis
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 2;

      // X-axis - at y=0
      ctx.beginPath();
      ctx.moveTo(padding.left, height - padding.bottom);
      ctx.lineTo(width - padding.right, height - padding.bottom);
      ctx.stroke();

      // Y-axis - at x=0
      ctx.beginPath();
      ctx.moveTo(padding.left, height - padding.bottom);
      ctx.lineTo(padding.left, padding.top);
      ctx.stroke();

      // Define the starting point (origin) in graph coordinates
      const startX = padding.left;
      const startY = height - padding.bottom;

      // Draw curve using the actual data points with bezier curves
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      
      // Get the relevant data slice based on current multiplier
      const relevantData = wsData.slice(0, dataIndex + 1);
      
      if (relevantData.length > 0) {
        // Create bezier curve points
        let prevX = startX;
        let prevY = startY;
        
        // Check if multiplier has passed 5x threshold
        const useCurve = multiplier >= 5.0;
        
        relevantData.forEach((point, index) => {
          if (index === 0 && point.v > 0) {
            // Draw a straight line to the first point if it's not at origin
            const x = padding.left + point.v * xScale;
            const y = height - padding.bottom - point.v * yScale;
            ctx.lineTo(x, y);
            prevX = x;
            prevY = y;
          } else if (index > 0) {
            const x = padding.left + point.v * xScale;
            const y = height - padding.bottom - point.v * yScale;
            
            if (!useCurve) {
              // Use straight lines when multiplier is below 5x
              ctx.lineTo(x, y);
            } else {
              // Use bezier curves when multiplier is 5x or above
              // Calculate control points for bezier curve
              const cpX1 = prevX + (x - prevX) * 0.5;
              const tensionY = Math.min(0.7, 0.2 + (point.v / 30)); // Increase tension as value grows
              const cpY1 = prevY - (prevY - y) * tensionY;
              
              // Draw curved line using quadratic bezier
              ctx.quadraticCurveTo(cpX1, cpY1, x, y);
            }
            
            prevX = x;
            prevY = y;
          }
        });
      }

      // Create gradient for path
      const lastPoint = relevantData.length > 0 ? relevantData[relevantData.length - 1] : { v: 0 };
      const lastX = padding.left + lastPoint.v * xScale;
      const lastY = height - padding.bottom - lastPoint.v * yScale;
      
      const gradient = ctx.createLinearGradient(
        padding.left,
        height - padding.bottom,
        lastX,
        lastY
      );

      if (crashed) {
        gradient.addColorStop(0, 'rgba(255, 71, 87, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 71, 87, 0.8)');
        ctx.strokeStyle = 'rgba(255, 71, 87, 1)';
      } else {
        gradient.addColorStop(0, 'rgba(0, 215, 187, 0.4)');
        gradient.addColorStop(1, 'rgba(0, 215, 187, 0.8)');
        ctx.strokeStyle = 'rgba(0, 215, 187, 1)';
      }

      ctx.lineWidth = 4;
      ctx.stroke();

      // Draw area under curve
      ctx.lineTo(lastX, height - padding.bottom);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.globalAlpha = 0.1;
      ctx.fill();
      ctx.globalAlpha = 1;

      // Draw current multiplier point and label
      if (relevantData.length > 0) {
        ctx.fillStyle = crashed ? 'rgba(255, 71, 87, 1)' : 'rgba(0, 215, 187, 1)';
        ctx.beginPath();
        ctx.arc(lastX, lastY, 8, 0, Math.PI * 2);
        ctx.fill();

        // Add a glow effect to the endpoint
        ctx.shadowColor = crashed ? 'rgba(255, 71, 87, 0.8)' : 'rgba(0, 215, 187, 0.8)';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(lastX, lastY, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw multiplier text with better positioning
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#FFFFFF';
        
        // Make sure text stays within canvas
        const textOffset = width - lastX < 80 ? -80 : 15;
        ctx.fillText(
          lastPoint.v.toFixed(2) + 'x',
          lastX + textOffset,
          lastY - 10
        );
      }
    };

    // Animation loop
    const animate = () => {
      draw();
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, [multiplier, maxMultiplier, crashed, gameHistory, dataIndex]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full rounded-2xl glass-panel graph-container overflow-hidden animate-fade-in"
    >
      <canvas ref={canvasRef} className="w-full h-full"></canvas>
    </div>
  );
};

export default CrashGraph;
