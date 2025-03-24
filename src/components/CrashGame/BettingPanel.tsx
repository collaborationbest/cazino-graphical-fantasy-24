
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';

interface BettingPanelProps {
  isGameRunning: boolean;
  onPlaceBet: (amount: number, autocashout: number) => void;
  onCashout: () => void;
  disabled: boolean;
  currentMultiplier: number;
}

const BettingPanel: React.FC<BettingPanelProps> = ({
  isGameRunning,
  onPlaceBet,
  onCashout,
  disabled,
  currentMultiplier
}) => {
  const [betAmount, setBetAmount] = useState<number>(10);
  const [autoCashout, setAutoCashout] = useState<number>(2);
  const [autoCashoutEnabled, setAutoCashoutEnabled] = useState<boolean>(false);

  const handlePlaceBet = () => {
    if (!disabled) {
      onPlaceBet(betAmount, autoCashoutEnabled ? autoCashout : 0);
    }
  };

  const handleCashout = () => {
    if (!disabled) {
      onCashout();
    }
  };

  return (
    <div className="glass-panel p-6 w-full max-w-md animate-scale-in">
      <div className="space-y-6">
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-casino-text-dim">BET AMOUNT</span>
            <span className="text-sm font-medium">${betAmount.toFixed(2)}</span>
          </div>
          <Input
            type="number"
            min="1"
            max="1000"
            value={betAmount}
            onChange={(e) => setBetAmount(Number(e.target.value))}
            className="betting-input"
            disabled={isGameRunning}
          />
          <div className="flex justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 bg-casino-muted hover:bg-casino-secondary text-casino-text-dim"
              onClick={() => setBetAmount(Math.max(1, betAmount / 2))}
              disabled={isGameRunning}
            >
              ½
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 bg-casino-muted hover:bg-casino-secondary text-casino-text-dim"
              onClick={() => setBetAmount(betAmount * 2)}
              disabled={isGameRunning}
            >
              2×
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 bg-casino-muted hover:bg-casino-secondary text-casino-text-dim"
              onClick={() => setBetAmount(10)}
              disabled={isGameRunning}
            >
              $10
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 bg-casino-muted hover:bg-casino-secondary text-casino-text-dim"
              onClick={() => setBetAmount(100)}
              disabled={isGameRunning}
            >
              $100
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-casino-text-dim">AUTO CASHOUT</span>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="auto-cashout-toggle"
                checked={autoCashoutEnabled}
                onChange={() => setAutoCashoutEnabled(!autoCashoutEnabled)}
                className="mr-2 h-4 w-4 accent-casino-accent"
                disabled={isGameRunning}
              />
              <span className="text-sm font-medium">{autoCashout.toFixed(2)}×</span>
            </div>
          </div>
          <div className="px-1">
            <Slider
              disabled={isGameRunning || !autoCashoutEnabled}
              value={[autoCashout]}
              min={1.1}
              max={10}
              step={0.1}
              onValueChange={(values) => setAutoCashout(values[0])}
              className="my-4"
            />
          </div>
          <div className="flex justify-between text-xs text-casino-text-dim">
            <span>1.1×</span>
            <span>5×</span>
            <span>10×</span>
          </div>
        </div>
        
        {isGameRunning ? (
          <Button
            onClick={handleCashout}
            disabled={disabled}
            className="w-full py-6 text-lg font-semibold bg-casino-green hover:bg-casino-accent-light text-white transition-all duration-200 animate-pulse-glow"
          >
            CASH OUT {currentMultiplier.toFixed(2)}×
          </Button>
        ) : (
          <Button
            onClick={handlePlaceBet}
            disabled={disabled}
            className="w-full py-6 text-lg font-semibold bg-casino-accent hover:bg-casino-accent-light text-white transition-all duration-200"
          >
            PLACE BET
          </Button>
        )}
      </div>
    </div>
  );
};

export default BettingPanel;
