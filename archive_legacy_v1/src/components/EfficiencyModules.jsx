import React from 'react';
import { motion } from 'framer-motion';
import { Pickaxe, Flame, TrendingUp, Users } from 'lucide-react';

const getIcon = (iconId) => {
  switch(iconId) {
    case 'pickaxe': return <Pickaxe size={24} />;
    case 'flame': return <Flame size={24} />;
    case 'trending': return <TrendingUp size={24} />;
    case 'users': return <Users size={24} />;
    default: return <Pickaxe size={24} />;
  }
};

const EfficiencyModules = ({ mineItems, aipCoins, onUpgrade }) => {
  return (
    <div className="space-y-6 pt-8 border-t border-white/5">
      <div className="flex items-center gap-4 px-2">
        <div className="w-10 h-10 bg-[#00ff88]/10 rounded-xl flex items-center justify-center border border-[#00ff88]/20">
           <Pickaxe className="w-5 h-5 text-[#00ff88]" />
        </div>
        <div>
          <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] italic leading-none">Efficiency Modules</h3>
          <p className="text-[9px] font-black text-[#00ff88]/40 uppercase tracking-[0.2em] italic mt-1">Self-Evolving CodeUnits</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {mineItems.map((item) => (
          <motion.div 
            key={item.id}
            whileHover={{ y: -5 }}
            className="group glass-card bg-white/[0.02] p-5 rounded-[2rem] border border-white/5 flex flex-col relative transition-all hover:bg-white/[0.04] hover:border-[#00ff88]/20"
          >
            <div className="mb-4 text-[#00ff88] group-hover:scale-110 transition-transform">
              {getIcon(item.iconId)}
            </div>
            
            <h3 className="text-[10px] font-black uppercase mb-1 text-white truncate tracking-widest">{item.name}</h3>
            <p className="text-[11px] font-black text-[#00ff88] mb-4 uppercase tracking-tighter italic">
               {item.profit.toLocaleString()} <span className="text-[8px] opacity-40 italic">AIP/H</span>
            </p>
            
            <button 
              onClick={() => onUpgrade(item.id)}
              disabled={aipCoins < item.cost}
              className={`
                mt-auto py-3 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest
                ${aipCoins >= item.cost 
                  ? 'bg-white text-black active:scale-95 shadow-lg hover:bg-[#00ff88] hover:text-black hover:shadow-[#00ff88]/20' 
                  : 'bg-white/5 text-white/20'
                }
              `}
            >
              {item.cost.toLocaleString()} <span className="opacity-40">AIP</span>
            </button>

            <div className="absolute top-2 right-4 text-[8px] font-black text-white/10 uppercase tracking-widest group-hover:text-[#00ff88]/40 transition-colors">
               LVL {item.level}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default EfficiencyModules;
