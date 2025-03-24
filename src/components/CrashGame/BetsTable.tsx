
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Bet {
  id: string;
  player: string;
  amount: number;
  multiplier: number | null;
  profit: number | null;
  status: 'active' | 'won' | 'lost';
}

interface BetsTableProps {
  bets: Bet[];
}

const BetsTable: React.FC<BetsTableProps> = ({ bets }) => {
  return (
    <div className="glass-panel p-4 h-full overflow-hidden animate-slide-in-bottom">
      <h3 className="text-sm uppercase text-casino-text-dim mb-3 font-medium">Recent Bets</h3>
      <div className="overflow-auto max-h-[calc(100%-2rem)]">
        <table className="w-full text-sm">
          <thead className="text-casino-text-dim uppercase text-xs">
            <tr>
              <th className="text-left py-2 pr-2 font-medium">Player</th>
              <th className="text-right py-2 pr-2 font-medium">Bet</th>
              <th className="text-right py-2 pr-2 font-medium">Multiplier</th>
              <th className="text-right py-2 font-medium">Profit</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {bets.map((bet) => (
                <motion.tr
                  key={bet.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`
                    border-t border-casino-muted
                    ${bet.status === 'active' ? 'text-white' : ''}
                    ${bet.status === 'won' ? 'text-casino-green' : ''}
                    ${bet.status === 'lost' ? 'text-casino-red' : ''}
                  `}
                >
                  <td className="py-2 pr-2 text-left">
                    <div className="truncate max-w-[80px]">{bet.player}</div>
                  </td>
                  <td className="py-2 pr-2 text-right">${bet.amount.toFixed(2)}</td>
                  <td className="py-2 pr-2 text-right">
                    {bet.multiplier ? bet.multiplier.toFixed(2) + '×' : '-'}
                  </td>
                  <td className="py-2 text-right font-medium">
                    {bet.profit !== null ? (
                      <span className={bet.profit > 0 ? 'text-casino-green' : ''}>
                        {(bet.profit > 0 ? '+' : '') + bet.profit.toFixed(2)}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BetsTable;
