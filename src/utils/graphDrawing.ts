
import { wsData } from './crashData';

interface DrawGraphParams {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  dataIndex: number;
  multiplier: number;
  displayMax: number;
  crashed: boolean;
}

export const drawGraph = ({
  ctx,
  width,
  height,
  dataIndex,
  multiplier,
  displayMax,
  crashed
}: DrawGraphParams): void => {
  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Graph settings - adjust padding to give more space for graph
  const padding = { left: 60, right: 40, top: 40, bottom: 60 };
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  // Calculate scales
  const xScale = graphWidth / displayMax;
  const yScale = graphHeight / displayMax;

  // Draw background grid
  drawGrid(ctx, width, height, padding, displayMax, xScale, yScale);

  // Draw x and y axis
  drawAxes(ctx, width, height, padding);

  // Draw the curve
  drawCurve(ctx, padding, height, xScale, yScale, dataIndex, crashed);
};

const drawGrid = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  padding: { left: number; right: number; top: number; bottom: number },
  displayMax: number,
  xScale: number,
  yScale: number
): void => {
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
};

const drawAxes = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  padding: { left: number; right: number; top: number; bottom: number }
): void => {
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
};

const drawCurve = (
  ctx: CanvasRenderingContext2D,
  padding: { left: number; right: number; top: number; bottom: number },
  height: number,
  xScale: number,
  yScale: number,
  dataIndex: number,
  crashed: boolean
): void => {
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
        
        // Always use bezier curves for a smoother line
        // Calculate control points for bezier curve
        const cpX1 = prevX + (x - prevX) * 0.5;
        // Adjust tension based on the multiplier value
        const tensionY = Math.min(0.7, 0.2 + (point.v / 30));
        const cpY1 = prevY - (prevY - y) * tensionY;
        
        // Draw curved line using quadratic bezier
        ctx.quadraticCurveTo(cpX1, cpY1, x, y);
        
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

  // Set the appropriate colors based on crashed state
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
  drawCurrentPoint(ctx, lastX, lastY, lastPoint.v, crashed, width);
};

const drawCurrentPoint = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  value: number,
  crashed: boolean,
  width: number
): void => {
  ctx.fillStyle = crashed ? 'rgba(255, 71, 87, 1)' : 'rgba(0, 215, 187, 1)';
  ctx.beginPath();
  ctx.arc(x, y, 8, 0, Math.PI * 2);
  ctx.fill();

  // Add a glow effect to the endpoint
  ctx.shadowColor = crashed ? 'rgba(255, 71, 87, 0.8)' : 'rgba(0, 215, 187, 0.8)';
  ctx.shadowBlur = 15;
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Draw multiplier text with better positioning
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#FFFFFF';
  
  // Make sure text stays within canvas
  const textOffset = width - x < 80 ? -80 : 15;
  ctx.fillText(
    value.toFixed(2) + 'x',
    x + textOffset,
    y - 10
  );
};
