
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
  
  const [dataIndex, setDataIndex] = useState(0);

  const getClosestDataIndex = (targetMultiplier: number): number => {
    if (targetMultiplier >= wsData[wsData.length - 1].v) {
      return wsData.length - 1;
    }
    
    const index = wsData.findIndex(point => point.v >= targetMultiplier);
    return index >= 0 ? index : 0;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const container = containerRef.current;
    if (!container) return;

    const updateCanvasSize = () => {
      if (canvas && container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    const currentIndex = getClosestDataIndex(multiplier);
    setDataIndex(currentIndex);

    const draw = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      const padding = { left: 60, right: 40, top: 40, bottom: 60 };
      const graphWidth = width - padding.left - padding.right;
      const graphHeight = height - padding.top - padding.bottom;

      const dataMax = getMaxMultiplier();
      const displayMax = Math.max(maxMultiplier, dataMax, Math.ceil(multiplier * 1.2));
      const xScale = graphWidth / displayMax;
      const yScale = graphHeight / displayMax;

      // Define the starting point for the curve
      const startX = padding.left;
      const startY = height - padding.bottom;

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;

      const gridStep = displayMax <= 10 ? 1 :
        displayMax <= 20 ? 2 :
          displayMax <= 50 ? 5 : 10;

      for (let i = 0; i <= displayMax; i += gridStep) {
        const x = padding.left + i * xScale;
        ctx.beginPath();
        ctx.moveTo(x, padding.top);
        ctx.lineTo(x, height - padding.bottom);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(i.toString() + 'x', x, height - padding.bottom + 20);
      }

      for (let i = 0; i <= displayMax; i += gridStep) {
        const y = height - padding.bottom - i * yScale;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '12px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(i.toString() + 'x', padding.left - 10, y + 5);
      }

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(padding.left, height - padding.bottom);
      ctx.lineTo(width - padding.right, height - padding.bottom);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(padding.left, height - padding.bottom);
      ctx.lineTo(padding.left, padding.top);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      
      const relevantData = wsData.slice(0, dataIndex + 1);
      
      if (relevantData.length > 0) {
        const firstPoint = relevantData[0];
        const firstX = padding.left + firstPoint.v * xScale;
        const firstY = height - padding.bottom - firstPoint.v * yScale;
        
        const initialControlX = startX + (firstX - startX) * 0.2;
        const initialControlY = startY - (startY - firstY) * 0.1;
        
        ctx.quadraticCurveTo(
          initialControlX,
          initialControlY,
          firstX,
          firstY
        );
        
        for (let i = 1; i < relevantData.length; i++) {
          const prevPoint = relevantData[i-1];
          const currentPoint = relevantData[i];
          
          const prevX = padding.left + prevPoint.v * xScale;
          const prevY = height - padding.bottom - prevPoint.v * yScale;
          const currentX = padding.left + currentPoint.v * xScale;
          const currentY = height - padding.bottom - currentPoint.v * yScale;
          
          const tension = Math.min(0.3, currentPoint.v / 20);
          const cpX = prevX + (currentX - prevX) * 0.5;
          const cpY = prevY - Math.abs(currentY - prevY) * tension;
          
          ctx.quadraticCurveTo(cpX, cpY, currentX, currentY);
        }
      }

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

      ctx.lineTo(lastX, height - padding.bottom);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.globalAlpha = 0.1;
      ctx.fill();
      ctx.globalAlpha = 1;

      if (relevantData.length > 0) {
        ctx.fillStyle = crashed ? 'rgba(255, 71, 87, 1)' : 'rgba(0, 215, 187, 1)';
        ctx.beginPath();
        ctx.arc(lastX, lastY, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowColor = crashed ? 'rgba(255, 71, 87, 0.8)' : 'rgba(0, 215, 187, 0.8)';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(lastX, lastY, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#FFFFFF';
        
        const textOffset = width - lastX < 80 ? -80 : 15;
        ctx.fillText(
          lastPoint.v.toFixed(2) + 'x',
          lastX + textOffset,
          lastY - 10
        );
      }
    };

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
