import React from 'react';
import { motion } from 'framer-motion';
import { Zap, ShieldCheck, Loader2, Info, ChevronRight, Wallet } from 'lucide-react';
import { formatBNB } from '../utils/web3';

const Registration = ({ 
  sponsorId, 
  tierCost, 
  usdPrice, 
  isProcessing, 
  onActivate,
  userAddress,
  onConnectWallet
}) => {
  const breakdown = [
    { label: 'Direct Reward Logic', pct: '10%', color: '#FFD700' },
    { label: 'Layer Distribution', pct: '15%', color: '#00FF00' },
    { label: 'Matrix Propagation', pct: '70%', color: '#FFFFFF' },
    { label: 'Ecosystem Contribution', pct: '5%', color: '#FF0000' }
  ];

  const container = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { staggerChildren: 0.08 }
    }
  };

  const item = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="relative overflow-hidden bg-black border-2 border-[#FFD700]/30 shadow-[0_0_50px_rgba(255,215,0,0.1)] rounded-[3rem] p-8 max-w-lg mx-auto"
    >
      {/* Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFD700]/10 blur-[100px] -mr-32 -mt-32 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#00FF00]/10 blur-[80px] -ml-24 -mb-24 pointer-events-none" />

      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-black mb-1 uppercase tracking-tighter italic text-[#FFD700]">
            AIP <span className="text-white">CORE</span>
          </h1>
          <p className="text-[#00FF00] font-black uppercase tracking-widest text-[9px] italic">Elite Node Activation</p>
        </div>
        <div className="text-right">
          <div className="px-3 py-1 bg-[#FFD700]/10 rounded-full border border-[#FFD700]/30 flex items-center space-x-2">
            <span className="w-1.5 h-1.5 bg-[#00FF00] rounded-full animate-pulse shadow-[0_0_8px_#00FF00]" />
            <span className="text-[9px] font-black text-[#FFD700] uppercase tracking-widest">Protocol v2.5 ELITE</span>
          </div>
        </div>
      </div>

      {/* Sponsor ID */}
      <motion.div variants={item} className="bg-black border border-[#FFD700]/40 rounded-2xl p-5 mb-6 relative group overflow-hidden shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-r from-[#FFD700]/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
        <div className="flex justify-between items-center relative z-10">
          <div>
            <h3 className="text-[10px] font-black text-[#FFD700] mb-1 uppercase tracking-[0.2em] italic">Authority Source</h3>
            <div className="flex items-center space-x-2">
              <span className="text-white font-black text-xl italic uppercase">Sponsor ID</span>
              <ChevronRight size={14} className="text-[#00FF00]" />
            </div>
          </div>
          <span className="text-[#00FF00] font-mono text-3xl font-black italic shadow-[#00FF00]/20 shadow-sm">
            #{sponsorId}
          </span>
        </div>
      </motion.div>

      {/* Activation Cost Breakdown */}
      <motion.div variants={item} className="bg-black border-2 border-[#FFD700]/20 rounded-[2rem] p-6 mb-8 relative overflow-hidden group shadow-xl">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent" />
        
        <div className="flex justify-between items-end mb-6">
          <div>
            <h3 className="text-[11px] font-black text-[#FFD700] mb-2 uppercase tracking-[0.2em] italic">Activation Cost</h3>
            <div className="text-3xl font-black text-white italic tracking-tighter">
              {tierCost ? formatBNB(tierCost) : '0.009'} <span className="text-sm text-[#00FF00] uppercase">BNB</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-black text-[#00FF00] italic">≈ ${usdPrice} <span className="text-[10px] text-white uppercase tracking-widest font-black not-italic ml-1">USD</span></p>
          </div>
        </div>

        <div className="space-y-3.5 border-t border-white/10 pt-5">
          {breakdown.map((row, idx) => (
            <motion.div 
              key={idx}
              variants={item}
              className="flex justify-between items-center group/row"
            >
              <div className="flex items-center space-x-3">
                <div className="w-1.5 h-1.5 rounded-full group-hover/row:scale-150 transition-transform shadow-[0_0_8px_currentColor]" style={{ backgroundColor: row.color }} />
                <span className="text-[10px] font-black uppercase tracking-widest text-white group-hover/row:text-[#FFD700] transition-colors">{row.label}</span>
              </div>
              <span className="text-[10px] font-black italic" style={{ color: row.color }}>{row.pct}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* CTA Button */}
      {!userAddress ? (
        /* Wallet not connected — prompt to connect first */
        <motion.button 
          variants={item}
          whileTap={{ scale: 0.96 }}
          onClick={onConnectWallet}
          className="w-full relative overflow-hidden group/btn rounded-[1.5rem]"
        >
          <div className="absolute inset-0 bg-white group-hover/btn:bg-white/90 transition-colors rounded-[1.5rem]" />
          <div className="relative py-6 flex items-center justify-center gap-3">
            <Wallet className="w-6 h-6 text-black group-hover/btn:scale-110 transition-transform" />
            <span className="text-black font-black text-lg uppercase tracking-widest italic">Connect Wallet First</span>
          </div>
        </motion.button>
      ) : (
        /* Wallet connected — show activate button */
        <motion.button 
          variants={item}
          whileTap={{ scale: 0.96 }}
          onClick={onActivate}
          disabled={isProcessing}
          className="w-full relative overflow-hidden group/btn rounded-[1.5rem]"
        >
          <div className="absolute inset-0 bg-[#FFD700] group-hover/btn:bg-[#00FF00] transition-colors duration-500 rounded-[1.5rem]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.3)_0%,_transparent_70%)] opacity-0 group-hover/btn:opacity-100 transition-opacity rounded-[1.5rem]" />
          <div className="absolute inset-0 shadow-[0_0_40px_rgba(255,215,0,0.4)] rounded-[1.5rem] opacity-0 group-hover/btn:opacity-100 transition-opacity" />
          
          <div className="relative py-6 flex items-center justify-center gap-3">
            {isProcessing ? (
              <>
                <Loader2 className="animate-spin w-6 h-6 text-black" />
                <span className="text-black font-black text-lg uppercase tracking-widest italic">Syncing Matrix...</span>
              </>
            ) : (
              <>
                <Zap className="w-6 h-6 text-black group-hover/btn:scale-110 transition-transform" strokeWidth={3} />
                <span className="text-black font-black text-lg uppercase tracking-widest italic">ACTIVATE NODE</span>
              </>
            )}
          </div>
        </motion.button>
      )}

      {/* Feature Badges */}
      <motion.div variants={item} className="mt-8 grid grid-cols-2 gap-y-3 gap-x-6">
        {[
          'Instant Payouts',
          'Global Spillover',
          'Matrix Analytics',
          'On-Chain Auth'
        ].map((feature, i) => (
          <div key={i} className="text-[8px] text-white font-black uppercase tracking-widest italic flex items-center gap-2">
            <ShieldCheck size={10} className="text-[#00FF00]" />
            {feature}
          </div>
        ))}
      </motion.div>

      <div className="mt-8 flex items-center justify-center space-x-3 opacity-60 hover:opacity-100 transition-opacity">
        <Info size={12} className="text-[#FFD700]" />
        <p className="text-[8px] font-black uppercase tracking-widest text-[#FFD700]">Protocol Verified by Immutable Smart Contract</p>
      </div>
    </motion.div>
  );
};

export default Registration;
