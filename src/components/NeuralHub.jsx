import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Layers, 
  ShieldCheck, 
  Zap, 
  Loader2, 
  ArrowUpRight, 
  Info, 
  TrendingUp, 
  Users 
} from 'lucide-react';
import { formatBNB, getTierUSDPrice } from '../utils/web3';

const NeuralHub = ({ 
  nodeTier, 
  nodeId, 
  tierCosts, 
  selectedUpgradeLevel, 
  setSelectedUpgradeLevel, 
  isProcessing, 
  onUpgrade 
}) => {
  const costs = tierCosts.length > 0 ? tierCosts : Array(18).fill(0n);
  const targetLevel = selectedUpgradeLevel || (nodeTier + 1);
  const layersToUpgrade = Math.max(0, targetLevel - nodeTier);
  const isNext = (targetLevel === nodeTier + 1);

  // Cumulative cost calculation
  const getCumulativeCost = () => {
    if (layersToUpgrade <= 0) return 0n;
    let sum = 0n;
    for (let i = nodeTier; i < targetLevel; i++) {
      sum += (tierCosts[i] || 0n);
    }
    return sum;
  };

  const totalWei = getCumulativeCost();
  const bnbAmount = Number(formatBNB(totalWei));
  
  const getCumulativeUSD = () => {
    let sum = 0;
    for (let i = nodeTier; i < targetLevel; i++) {
      sum += getTierUSDPrice(i);
    }
    return sum;
  };
  const usdAmount = getCumulativeUSD();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
      {/* Tier Grid Panel */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="glass-card bg-black/40 border border-white/5 p-8 rounded-[2.5rem] relative overflow-hidden"
      >
        <div className="flex items-center gap-4 pb-6 border-b border-white/5 mb-8">
          <div className="w-12 h-12 bg-[#00ff88]/10 border border-[#00ff88]/20 rounded-2xl flex items-center justify-center shadow-lg shadow-[#00ff88]/5">
            <Layers className="w-6 h-6 text-[#00ff88]" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white uppercase italic tracking-wider leading-none">Neural Hub</h3>
            <p className="text-[10px] font-black text-[#00ff88]/60 uppercase tracking-[0.25em] italic mt-1.5 flex items-center gap-2">
               <span className="w-1 h-1 bg-[#00ff88] rounded-full animate-pulse" />
               Global Access Map
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {costs.map((cost, idx) => {
            const level = idx + 1;
            const isUnlocked = nodeTier >= level || (level === 1 && nodeId > 0);
            const isSelected = selectedUpgradeLevel === level;
            const isNextLevel = (nodeTier === idx) && !isUnlocked;

            return (
              <motion.button
                key={idx}
                whileHover={!isUnlocked ? { scale: 1.05 } : {}}
                whileTap={!isUnlocked ? { scale: 0.95 } : {}}
                onClick={() => setSelectedUpgradeLevel(level)}
                disabled={level <= nodeTier || (level === 1 && nodeId > 0)}
                className={`
                  h-16 rounded-2xl font-black text-xs transition-all border flex flex-col items-center justify-center relative group
                  ${isSelected
                    ? 'bg-[#00ff88] text-black border-[#00ff88] scale-105 z-10 italic shadow-[0_0_25px_rgba(0,255,136,0.5)]'
                    : isUnlocked
                      ? 'bg-[#00ff88]/10 border-[#00ff88]/20 text-[#00ff88]/40 grayscale opacity-60'
                      : isNextLevel
                        ? 'bg-white/10 border-white/20 text-white hover:border-[#00ff88]/50 shadow-inner'
                        : 'bg-white/5 border-white/10 text-white/20'
                  }
                `}
              >
                {level < 10 ? `0${level}` : level}
                <AnimatePresence>
                  {isUnlocked && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-[7px] font-black leading-none mt-1.5 bg-[#00ff88]/20 px-1.5 py-0.5 rounded-sm text-white"
                    >
                      SYNC
                    </motion.div>
                  )}
                </AnimatePresence>
                {!isUnlocked && !isNextLevel && !isSelected && (
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ShieldCheck size={8} className="text-white/20" />
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Authentication Panel */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex flex-col"
      >
        <div className="glass-card bg-gradient-to-br from-[#00ff88]/10 via-[#00ff88]/5 to-transparent border border-[#00ff88]/20 p-8 rounded-[3rem] relative overflow-hidden group h-full shadow-2xl">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-[#00ff88] pointer-events-none group-hover:opacity-[0.06] transition-opacity duration-1000">
            <ShieldCheck className="w-48 h-48" />
          </div>

          <div className="flex items-center gap-5 mb-10 relative z-10 border-b border-white/5 pb-6">
            <div className="w-12 h-12 bg-[#00ff88]/10 border border-[#00ff88]/20 rounded-2xl flex items-center justify-center shadow-lg shadow-[#00ff88]/5">
              <Zap className="w-6 h-6 text-[#00ff88] animate-pulse" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight uppercase italic leading-none">Authentication</h2>
              <p className="text-[10px] font-black text-[#00ff88]/60 uppercase tracking-[0.3em] italic mt-2">Neural Authority Matrix</p>
            </div>
          </div>

          <div className="space-y-8 relative z-10">
            <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-[2.5rem] p-10 text-center space-y-4 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00ff88]/20 to-transparent" />
               
               <div className="text-[11px] font-black text-white/60 uppercase tracking-[0.4em] mb-2 italic">Expansion Cost</div>
               <div className="text-5xl font-black text-white tracking-tighter italic drop-shadow-sm">
                  {bnbAmount.toFixed(4)} <span className="text-lg text-[#00ff88] uppercase italic ml-1 tracking-widest font-black transition-colors group-hover:text-white">BNB</span>
               </div>
               <div className="inline-flex items-center px-5 py-2 bg-[#00ff88]/5 rounded-full border border-[#00ff88]/10 gap-2 group-hover:border-[#00ff88]/30 transition-all">
                  <span className="w-1.5 h-1.5 bg-[#00ff88] rounded-full animate-pulse" />
                  <span className="text-[11px] font-black text-white uppercase tracking-[0.2em] italic">Protocol Value: ~${usdAmount}</span>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-3xl p-5 hover:bg-white/[0.07] transition-all">
                <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] block mb-2">Target Expansion</span>
                <span className="text-lg font-black text-white italic flex items-center gap-2">
                   Tier {targetLevel}
                   <ChevronRight size={14} className="text-[#00ff88]" />
                </span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-3xl p-5 hover:bg-white/[0.07] transition-all">
                <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] block mb-2">Strategic Layers</span>
                <span className="text-lg font-black text-[#00ff88] italic">+{layersToUpgrade} Units</span>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={onUpgrade}
              disabled={!isNext || isProcessing || nodeTier >= 18}
              className={`
                w-full relative overflow-hidden py-6 rounded-[1.75rem] font-black tracking-widest text-base uppercase shadow-2xl active:scale-95 transition-all disabled:opacity-20 disabled:grayscale flex items-center justify-center gap-4 italic
                ${isNext ? 'bg-[#00ff88] text-black shadow-[#00ff88]/20' : 'bg-white/10 text-white/20'}
              `}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              
              {isProcessing ? (
                <>
                  <Loader2 className="animate-spin w-6 h-6" />
                  Syncing Matrix...
                </>
              ) : !isNext ? (
                <>
                  <Info className="w-6 h-6" />
                  Select Level {nodeTier + 1}
                </>
              ) : (
                <>
                  <Zap size={22} fill="currentColor" />
                  Authorize Expansion »
                </>
              )}
            </motion.button>

            <div className="grid grid-cols-2 gap-4 opacity-50 hover:opacity-100 transition-opacity">
               <div className="bg-black/40 p-4 rounded-2xl flex items-center gap-4 border border-white/5">
                  <div className="w-8 h-8 rounded-lg bg-[#00ff88]/10 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-[#00ff88]" />
                  </div>
                  <span className="text-[9px] font-black text-white/60 uppercase tracking-[0.1em] italic">Boost Yield Logic</span>
               </div>
               <div className="bg-black/40 p-4 rounded-2xl flex items-center gap-4 border border-white/5">
                  <div className="w-8 h-8 rounded-lg bg-[#00ccff]/10 flex items-center justify-center">
                    <Users className="w-4 h-4 text-[#00ccff]" />
                  </div>
                  <span className="text-[9px] font-black text-white/60 uppercase tracking-[0.1em] italic">Matrix Depth Plus</span>
               </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const ChevronRight = ({ size, className }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="3" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="m9 18 6-6-6-6"/>
  </svg>
);

export default NeuralHub;
