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
    { label: 'Direct Reward Logic', pct: '10%', color: '#00ff88' },
    { label: 'Layer Distribution', pct: '15%', color: '#00ccff' },
    { label: 'Matrix Propagation', pct: '70%', color: '#a855f7' },
    { label: 'Ecosystem Contribution', pct: '5%', color: '#f43f5e' }
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
      className="relative overflow-hidden bg-black/60 backdrop-blur-3xl border border-white/10 shadow-2xl rounded-[3rem] p-8 max-w-lg mx-auto"
    >
      {/* Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#00ff88]/5 blur-[100px] -mr-32 -mt-32 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#00ccff]/5 blur-[80px] -ml-24 -mb-24 pointer-events-none" />

      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-black mb-1 uppercase tracking-tighter italic text-[#00ff88]">
            AIP <span className="text-white">CORE</span>
          </h1>
          <p className="text-white/40 font-black uppercase tracking-widest text-[9px] italic">Neural Node Activation</p>
        </div>
        <div className="text-right">
          <div className="px-3 py-1 bg-[#00ff88]/10 rounded-full border border-[#00ff88]/20 flex items-center space-x-2">
            <span className="w-1.5 h-1.5 bg-[#00ff88] rounded-full animate-pulse" />
            <span className="text-[9px] font-black text-[#00ff88] uppercase tracking-widest">Protocol v2.5</span>
          </div>
        </div>
      </div>

      {/* Sponsor ID */}
      <motion.div variants={item} className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6 relative group overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#00ff88]/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
        <div className="flex justify-between items-center relative z-10">
          <div>
            <h3 className="text-[10px] font-black text-white/40 mb-1 uppercase tracking-[0.2em] italic">Authority Source</h3>
            <div className="flex items-center space-x-2">
              <span className="text-white font-black text-xl italic uppercase">Sponsor ID</span>
              <ChevronRight size={14} className="text-[#00ff88]" />
            </div>
          </div>
          <span className="text-[#00ff88] font-mono text-3xl font-black italic shadow-[#00ff88]/20 shadow-sm">
            #{sponsorId}
          </span>
        </div>
      </motion.div>

      {/* Activation Cost Breakdown */}
      <motion.div variants={item} className="bg-white/[0.03] border border-white/10 rounded-[2rem] p-6 mb-8 relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00ff88]/40 to-transparent" />
        
        <div className="flex justify-between items-end mb-6">
          <div>
            <h3 className="text-[11px] font-black text-white/40 mb-2 uppercase tracking-[0.2em] italic">Activation Cost</h3>
            <div className="text-3xl font-black text-white italic tracking-tighter">
              {tierCost ? formatBNB(tierCost) : '0.009'} <span className="text-sm text-[#00ff88] uppercase">BNB</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-black text-[#00ff88] italic">≈ ${usdPrice} <span className="text-[10px] text-white/20 uppercase tracking-widest font-black not-italic ml-1">USD</span></p>
          </div>
        </div>

        <div className="space-y-3.5 border-t border-white/5 pt-5">
          {breakdown.map((row, idx) => (
            <motion.div 
              key={idx}
              variants={item}
              className="flex justify-between items-center group/row"
            >
              <div className="flex items-center space-x-3">
                <div className="w-1 h-1 rounded-full group-hover/row:scale-150 transition-transform" style={{ backgroundColor: row.color }} />
                <span className="text-[10px] font-black uppercase tracking-widest text-white/60 group-hover/row:text-white transition-colors">{row.label}</span>
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
          <div className="absolute inset-0 bg-[#00ff88] group-hover/btn:bg-[#00dd77] transition-colors rounded-[1.5rem]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.15)_0%,_transparent_70%)] opacity-0 group-hover/btn:opacity-100 transition-opacity rounded-[1.5rem]" />
          <div className="absolute inset-0 shadow-[0_0_40px_rgba(0,255,136,0.4)] rounded-[1.5rem] opacity-0 group-hover/btn:opacity-100 transition-opacity" />
          
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
          <div key={i} className="text-[8px] text-white/30 font-black uppercase tracking-widest italic flex items-center gap-2">
            <ShieldCheck size={10} className="text-[#00ff88]" />
            {feature}
          </div>
        ))}
      </motion.div>

      <div className="mt-8 flex items-center justify-center space-x-3 opacity-20 hover:opacity-40 transition-opacity">
        <Info size={12} className="text-white" />
        <p className="text-[8px] font-black uppercase tracking-widest text-white">Immutable Protocol Verified by Smart Contract</p>
      </div>
    </motion.div>
  );
};

export default Registration;
