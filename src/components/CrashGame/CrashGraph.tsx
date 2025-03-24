
import React, { useRef, useEffect } from 'react';

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

      // Dynamically adjust the scale based on the current multiplier
      const displayMax = Math.max(maxMultiplier, Math.ceil(multiplier * 1.2));
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

      // Function to calculate curve points - starting from 0,0
      const calculatePoints = (currentMultiplier: number) => {
        const points = [];
        const steps = 100;
        const curveExponent = 1.5; // Controls curve steepness

        for (let i = 0; i <= steps; i++) {
          const progress = i / steps;
          const x = progress * currentMultiplier;
          // Use a power function to create exponential growth
          const y = Math.pow(progress, curveExponent) * currentMultiplier;
          points.push({ x, y });
        }

        return points;
      };

      // Draw the curve
      const points = calculatePoints(multiplier);

      // Draw curve - starting exactly from origin (0,0)
      ctx.beginPath();
      ctx.moveTo(padding.left, height - padding.bottom); // Starting at origin (0,0) in graph coordinates

      points.forEach((point, index) => {
        // Ensure the curve actually reaches all the way to current multiplier
        const x = padding.left + point.x * xScale;
        const y = height - padding.bottom - point.y * yScale;
        ctx.lineTo(x, y);
      });

      // Create gradient for path
      const gradient = ctx.createLinearGradient(
        padding.left,
        height - padding.bottom,
        padding.left + multiplier * xScale,
        height - padding.bottom - multiplier * yScale
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
      ctx.lineTo(padding.left + multiplier * xScale, height - padding.bottom);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.globalAlpha = 0.1;
      ctx.fill();
      ctx.globalAlpha = 1;

      // Draw current multiplier label
      const lastPoint = points[points.length - 1];
      const lastX = padding.left + lastPoint.x * xScale;
      const lastY = height - padding.bottom - lastPoint.y * yScale;

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

      // Draw multiplier text - make sure it's visible even at high values
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#FFFFFF';
      const textX = lastX + 15;
      const textY = lastY - 10;

      // Make sure text stays within canvas
      const textOffset = width - textX < 80 ? -80 : 15;
      ctx.fillText(
        multiplier.toFixed(2) + 'x',
        lastX + textOffset,
        textY
      );
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
  }, [multiplier, maxMultiplier, crashed, gameHistory]);

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
