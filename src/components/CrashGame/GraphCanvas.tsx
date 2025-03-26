
import React, { useRef, useEffect } from 'react';
import { wsData, getMaxMultiplier } from '@/utils/crashData';
import { drawGraph } from '@/utils/graphDrawing';

interface GraphCanvasProps {
  multiplier: number;
  maxMultiplier: number;
  crashed: boolean;
  dataIndex: number;
}

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  multiplier,
  maxMultiplier,
  crashed,
  dataIndex
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Set up canvas and drawing
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

    // Draw function
    const draw = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Calculate the displayMax for the graph
      const dataMax = getMaxMultiplier();
      const displayMax = Math.max(maxMultiplier, dataMax, Math.ceil(multiplier * 1.2));

      // Draw the graph using the utility function
      drawGraph({
        ctx,
        width: canvas.width,
        height: canvas.height,
        dataIndex,
        multiplier,
        displayMax,
        crashed
      });
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
  }, [multiplier, maxMultiplier, crashed, dataIndex]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
    >
      <canvas ref={canvasRef} className="w-full h-full"></canvas>
    </div>
  );
};
