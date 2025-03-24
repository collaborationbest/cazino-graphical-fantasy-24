
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import CrashGraph from './CrashGraph';
import BettingPanel from './BettingPanel';
import GameStats from './GameStats';
import BetsTable from './BetsTable';
import { toast } from '@/lib/toast';

interface Bet {
  id: string;
  player: string;
  amount: number;
  multiplier: number | null;
  profit: number | null;
  status: 'active' | 'won' | 'lost';
}

// Function to generate a random crash point (exponential distribution)
const generateCrashPoint = (): number => {
  // Generate a random point with bias towards lower values
  const r = Math.random();
  // House edge factor (99% RTP)
  const houseEdge = 0.99;
  // Use an exponential distribution for realistic casino-like odds
  let result = 10.09;

  // Cap at 100x and round to 2 decimal places for display
  return 9.99;
};

// Random player names
const playerNames = [
  'CryptoKing', 'LuckyGambler', 'WhaleBet', 'CasinoRoyale',
  'GambleTron', 'HighRoller', 'FortuneSeeker', 'JackpotHunter',
  'BetMaster', 'LuckyCharm', 'RiskyBusiness', 'AllInPlayer',
  'VegasWinner', 'SlotMaster', 'BetHunter', 'RoulettePro'
];

// Generate a random player name
const getRandomPlayerName = () => {
  return playerNames[Math.floor(Math.random() * playerNames.length)];
};

// Generate random bet amount
const getRandomBetAmount = () => {
  return Math.floor(Math.random() * 500) + 10;
};

const CrashGame: React.FC = () => {
  const [isGameRunning, setIsGameRunning] = useState(false);
  const [waitingForNextGame, setWaitingForNextGame] = useState(true);
  const [currentMultiplier, setCurrentMultiplier] = useState(1);
  const [targetCrashPoint, setTargetCrashPoint] = useState(0);
  const [playerBet, setPlayerBet] = useState<Bet | null>(null);
  const [hasPlacedBet, setHasPlacedBet] = useState(false);
  const [hasPlayerCashedOut, setHasPlayerCashedOut] = useState(false);
  const [crashed, setCrashed] = useState(false);
  const [bets, setBets] = useState<Bet[]>([]);
  const [gameHistory, setGameHistory] = useState<number[]>([]);
  const [balance, setBalance] = useState(1000); // Starting balance

  // Use refs for timers to avoid closure issues
  const gameTimerRef = useRef<NodeJS.Timeout | null>(null);
  const multiplierTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clear timers safely
  const clearTimers = useCallback(() => {
    if (gameTimerRef.current) {
      clearTimeout(gameTimerRef.current);
      gameTimerRef.current = null;
    }
    if (multiplierTimerRef.current) {
      clearInterval(multiplierTimerRef.current);
      multiplierTimerRef.current = null;
    }
  }, []);

  // Initialize the game with some history
  useEffect(() => {
    const initialHistory = Array(5).fill(0).map(() => generateCrashPoint());
    setGameHistory(initialHistory);

    // Generate some initial bets
    const initialBets: Bet[] = Array(7).fill(0).map((_, i) => {
      const crashPoint = initialHistory[initialHistory.length - 1 - (i % initialHistory.length)];
      const betAmount = getRandomBetAmount();
      const didCashOut = Math.random() > 0.4;
      const cashoutPoint = didCashOut ? crashPoint * Math.random() : null;
      const profit = cashoutPoint ? betAmount * (cashoutPoint - 1) : -betAmount;

      return {
        id: `init-${i}`,
        player: getRandomPlayerName(),
        amount: betAmount,
        multiplier: didCashOut ? cashoutPoint : crashPoint,
        profit: didCashOut ? profit : -betAmount,
        status: didCashOut ? 'won' : 'lost'
      };
    });

    setBets(initialBets);

    // Start the first game immediately
    startNewGame();

    // Cleanup timers on component unmount
    return () => {
      clearTimers();
    };
  }, []);

  // Generate AI bets for each game
  const generateAIBets = useCallback(() => {
    const numberOfBets = Math.floor(Math.random() * 4) + 2; // 2-5 AI bets
    const aiBets: Bet[] = [];

    for (let i = 0; i < numberOfBets; i++) {
      const betAmount = getRandomBetAmount();

      aiBets.push({
        id: `ai-${Date.now()}-${i}`,
        player: getRandomPlayerName(),
        amount: betAmount,
        multiplier: null,
        profit: null,
        status: 'active'
      });
    }

    return aiBets;
  }, []);

  // Handle player bet
  const handlePlaceBet = useCallback((amount: number, autoCashout: number) => {
    if (amount > balance) {
      toast.error("Insufficient balance");
      return;
    }

    if (amount <= 0) {
      toast.error("Please enter a valid bet amount");
      return;
    }

    setHasPlacedBet(true);
    setHasPlayerCashedOut(false);

    const newPlayerBet: Bet = {
      id: `player-${Date.now()}`,
      player: 'You',
      amount: amount,
      multiplier: null,
      profit: null,
      status: 'active'
    };

    setPlayerBet(newPlayerBet);
    setBalance(prevBalance => prevBalance - amount);

    // If game is waiting to start, add to bets
    if (waitingForNextGame) {
      setBets(prevBets => [newPlayerBet, ...prevBets]);
    }

    toast.success(`Bet placed: $${amount.toFixed(2)}`);
  }, [balance, waitingForNextGame]);

  // Handle player cashout
  const handleCashout = useCallback(() => {
    if (!playerBet || hasPlayerCashedOut || !isGameRunning) return;

    setHasPlayerCashedOut(true);

    const profit = playerBet.amount * (currentMultiplier - 1);
    const totalReturn = playerBet.amount + profit;

    // Update player balance
    setBalance(prevBalance => prevBalance + totalReturn);

    // Update player bet in the bets list
    setBets(prevBets =>
      prevBets.map(bet =>
        bet.id === playerBet.id
          ? {
            ...bet,
            multiplier: currentMultiplier,
            profit: profit,
            status: 'won'
          }
          : bet
      )
    );

    // Update player bet state
    setPlayerBet(prevBet =>
      prevBet
        ? {
          ...prevBet,
          multiplier: currentMultiplier,
          profit: profit,
          status: 'won'
        }
        : null
    );

    toast.success(`Cashed out at ${currentMultiplier.toFixed(2)}× for $${totalReturn.toFixed(2)}`);
  }, [playerBet, hasPlayerCashedOut, isGameRunning, currentMultiplier]);

  // Auto cashout for AI players
  const processAICashouts = useCallback((newMultiplier: number) => {
    setBets(prevBets =>
      prevBets.map(bet => {
        // Skip player bet and already processed bets
        if (bet.player === 'You' || bet.status !== 'active') {
          return bet;
        }

        // Random chance to cash out based on multiplier
        // Higher multiplier means higher chance to cash out
        const shouldCashOut = Math.random() < (0.05 * Math.log2(newMultiplier + 1));

        if (shouldCashOut) {
          const profit = bet.amount * (newMultiplier - 1);
          return {
            ...bet,
            multiplier: newMultiplier,
            profit: profit,
            status: 'won'
          };
        }

        return bet;
      })
    );
  }, []);

  // Process the crash
  const processCrash = useCallback((crashPoint: number) => {
    // Update game history
    setGameHistory(prev => [...prev, crashPoint]);

    // Mark all active bets as lost
    setBets(prevBets =>
      prevBets.map(bet =>
        bet.status === 'active'
          ? {
            ...bet,
            multiplier: crashPoint,
            profit: -bet.amount,
            status: 'lost'
          }
          : bet
      )
    );

    // Update player bet if they didn't cash out
    if (playerBet && !hasPlayerCashedOut) {
      setPlayerBet(prevBet =>
        prevBet
          ? {
            ...prevBet,
            multiplier: crashPoint,
            profit: -prevBet.amount,
            status: 'lost'
          }
          : null
      );

      toast.error(`Crashed at ${crashPoint.toFixed(2)}×!`);
    }
  }, [playerBet, hasPlayerCashedOut]);

  // Start a new game
  const startNewGame = useCallback(() => {
    // Clear any existing timers first
    clearTimers();

    // Reset game state
    setWaitingForNextGame(true);
    setCrashed(false);
    setCurrentMultiplier(1);
    setHasPlayerCashedOut(false);

    // Generate a new crash point - truly random for each game
    const newCrashPoint = generateCrashPoint();
    setTargetCrashPoint(newCrashPoint);
    console.log("New crash point:", newCrashPoint);

    // Add AI bets
    const aiBets = generateAIBets();
    setBets(prevBets => [...aiBets, ...prevBets].slice(0, 20)); // Keep only the most recent 20 bets

    // Wait for 3 seconds before starting the game
    gameTimerRef.current = setTimeout(() => {
      setWaitingForNextGame(false);
      setIsGameRunning(true);

      // Start incrementing multiplier
      let lastUpdateTime = Date.now();
      let currentValue = 1;

      multiplierTimerRef.current = setInterval(() => {
        const now = Date.now();
        const deltaTime = (now - lastUpdateTime) / 1000;
        lastUpdateTime = now;

        // Growth rate increases over time for dramatic effect
        const growthRate = 0.5 * Math.pow(currentValue, 0.7);
        const newValue = currentValue + (growthRate * deltaTime);
        currentValue = newValue;

        setCurrentMultiplier(newValue);

        // Process AI cashouts
        processAICashouts(newValue);

        // Check if we've reached crash point
        if (newValue >= newCrashPoint) {
          if (multiplierTimerRef.current) {
            clearInterval(multiplierTimerRef.current);
            multiplierTimerRef.current = null;
          }

          setCrashed(true);
          setIsGameRunning(false);
          processCrash(newCrashPoint);

          // Start next game after 3 seconds
          gameTimerRef.current = setTimeout(() => {
            startNewGame();
          }, 3000);
        }
      }, 50); // Update frequently for smooth animation
    }, 3000);
  }, [generateAIBets, processAICashouts, processCrash, clearTimers]);

  return (
    <div className="min-h-screen w-full bg-casino-primary text-casino-text flex flex-col">

      <div className="flex-1 p-2 sm:p-3 md:p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-6">
        {/* Left column with graph and bets table - 8 columns on large screens */}
        <div className="lg:col-span-8 flex flex-col gap-3 md:gap-6">
          <CrashGraph
            multiplier={currentMultiplier}
            maxMultiplier={Math.max(10, Math.ceil(currentMultiplier * 1.2))}
            crashed={crashed}
            gameHistory={gameHistory}
          />
        </div>

      </div>
    </div >
  );
};

export default CrashGame;
