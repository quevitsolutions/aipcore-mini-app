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
        className="glass-card bg-black border border-[#FFD700]/30 p-8 rounded-[2.5rem] relative overflow-hidden"
      >
        <div className="flex items-center gap-4 pb-6 border-b border-white/10 mb-8">
          <div className="w-12 h-12 bg-[#FFD700]/10 border border-[#FFD700]/40 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(255,215,0,0.2)]">
            <Layers className="w-6 h-6 text-[#FFD700]" />
          </div>
          <div>
            <h3 className="text-xl font-black text-[#FFD700] uppercase italic tracking-wider leading-none">Neural Scaling Hub</h3>
            <p className="text-[10px] font-black text-[#00FF00] uppercase tracking-[0.25em] italic mt-1.5 flex items-center gap-2">
               <span className="w-1.5 h-1.5 bg-[#00FF00] rounded-full animate-pulse shadow-[0_0_8px_#00FF00]" />
               Global Authority Matrix
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
                whileHover={!isUnlocked ? { scale: 1.05, borderColor: '#FFD700' } : {}}
                whileTap={!isUnlocked ? { scale: 0.95 } : {}}
                onClick={() => setSelectedUpgradeLevel(level)}
                disabled={level <= nodeTier || (level === 1 && nodeId > 0)}
                className={`
                  h-16 rounded-2xl font-black text-xs transition-all border flex flex-col items-center justify-center relative group
                  ${isSelected
                    ? 'bg-[#FFD700] text-black border-[#FFD700] scale-105 z-10 italic shadow-[0_0_30px_rgba(255,215,0,0.5)]'
                    : isUnlocked
                      ? 'bg-black border-[#FFD700]/40 text-[#FFD700] shadow-[inset_0_0_10px_rgba(255,215,0,0.1)]'
                      : isNextLevel
                        ? 'bg-[#FF0000]/10 border-[#FF0000]/40 text-white hover:border-[#FFD700] shadow-[0_0_15px_rgba(255,0,0,0.2)]'
                        : 'bg-black border-white/20 text-white'
                  }
                `}
              >
                {level < 10 ? `0${level}` : level}
                <AnimatePresence>
                  {isUnlocked && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-[7px] font-black leading-none mt-1.5 bg-[#00FF00] px-1.5 py-0.5 rounded-sm text-black"
                    >
                      SYNCED
                    </motion.div>
                  )}
                </AnimatePresence>
                {!isUnlocked && !isNextLevel && !isSelected && (
                  <div className="absolute top-1 right-1">
                    <ShieldCheck size={8} className="text-white" />
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
        <div className="glass-card bg-black border border-[#FFD700]/30 p-8 rounded-[3rem] relative overflow-hidden group h-full shadow-[0_0_50px_rgba(255,215,0,0.1)]">
          <div className="absolute top-0 right-0 p-8 opacity-10 text-[#FFD700] pointer-events-none group-hover:opacity-20 transition-opacity duration-1000">
            <ShieldCheck className="w-48 h-48" />
          </div>

          <div className="flex items-center gap-5 mb-10 relative z-10 border-b border-white/10 pb-6">
            <div className="w-12 h-12 bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-2xl flex items-center justify-center shadow-lg">
              <Zap className="w-6 h-6 text-[#FFD700] animate-pulse" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight uppercase italic leading-none">Authentication</h2>
              <p className="text-[10px] font-black text-[#FFD700] uppercase tracking-[0.3em] italic mt-2">Elite Authorization Matrix</p>
            </div>
          </div>

          <div className="space-y-8 relative z-10">
            <div className="bg-black border-2 border-[#FFD700]/40 rounded-[2.5rem] p-10 text-center space-y-4 shadow-[0_0_30px_rgba(255,215,0,0.1)] relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent" />
               
               <div className="text-[11px] font-black text-white uppercase tracking-[0.4em] mb-2 italic">Expansion Required</div>
               <div className="text-5xl font-black text-white tracking-tighter italic drop-shadow-[0_0_15px_rgba(255,215,0,0.2)]">
                  {bnbAmount.toFixed(4)} <span className="text-lg text-[#FFD700] uppercase italic ml-1 tracking-widest font-black">BNB</span>
               </div>
               <div className="inline-flex items-center px-5 py-2 bg-[#FFD700]/10 rounded-full border border-[#FFD700]/30 gap-3">
                  <span className="w-2 h-2 bg-[#00FF00] rounded-full animate-pulse shadow-[0_0_8px_#00FF00]" />
                  <span className="text-[11px] font-black text-white uppercase tracking-[0.2em] italic">Value Matrix: ~${usdAmount}</span>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black border border-white/20 rounded-3xl p-5 hover:border-[#FFD700]/40 transition-all">
                <span className="text-[10px] font-black text-[#FFD700] uppercase tracking-[0.2em] block mb-2">Target expansion</span>
                <span className="text-lg font-black text-white italic flex items-center gap-2">
                   Tier {targetLevel}
                   <ChevronRight size={14} className="text-[#00FF00]" />
                </span>
              </div>
              <div className="bg-black border border-white/20 rounded-3xl p-5 hover:border-[#00FF00]/40 transition-all">
                <span className="text-[10px] font-black text-[#00FF00] uppercase tracking-[0.2em] block mb-2">Strategic layers</span>
                <span className="text-lg font-black text-[#FFD700] italic">+{layersToUpgrade} UNITS</span>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02, backgroundColor: isNext ? '#00FF00' : '' }}
              whileTap={{ scale: 0.97 }}
              onClick={onUpgrade}
              disabled={!isNext || isProcessing || nodeTier >= 18}
              className={`
                w-full relative overflow-hidden py-6 rounded-[1.75rem] font-black tracking-widest text-base uppercase shadow-[0_0_30px_rgba(0,255,0,0.2)] active:scale-95 transition-all disabled:opacity-20 disabled:grayscale flex items-center justify-center gap-4 italic
                ${isNext ? 'bg-[#FFD700] text-black' : 'bg-white/10 text-white'}
              `}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              
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

            <div className="grid grid-cols-2 gap-4">
               <div className="bg-black p-4 rounded-2xl flex items-center gap-4 border border-[#FFD700]/20">
                  <div className="w-8 h-8 rounded-lg bg-[#FFD700]/10 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-[#FFD700]" />
                  </div>
                  <span className="text-[9px] font-black text-white uppercase tracking-[0.1em] italic">Yield Boost Logic</span>
               </div>
               <div className="bg-black p-4 rounded-2xl flex items-center gap-4 border border-[#00FF00]/20">
                  <div className="w-8 h-8 rounded-lg bg-[#00FF00]/10 flex items-center justify-center">
                    <Users className="w-4 h-4 text-[#00FF00]" />
                  </div>
                  <span className="text-[9px] font-black text-white uppercase tracking-[0.1em] italic">Matrix Depth Plus</span>
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
