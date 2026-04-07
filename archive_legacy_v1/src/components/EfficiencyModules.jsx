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
    <div className="space-y-6 pt-8 border-t border-[#FFD700]/20">
      <div className="flex items-center gap-4 px-2">
        <div className="w-10 h-10 bg-[#FFD700]/10 rounded-xl flex items-center justify-center border border-[#FFD700]/30 shadow-[0_0_15px_rgba(255,215,0,0.1)]">
           <Pickaxe className="w-5 h-5 text-[#FFD700]" />
        </div>
        <div>
          <h3 className="text-sm font-black text-[#FFD700] uppercase tracking-[0.2em] italic leading-none">Strategic Modules</h3>
          <p className="text-[9px] font-black text-[#00FF00] uppercase tracking-[0.2em] italic mt-1.5">Elite Matrix CodeUnits</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {mineItems.map((item) => (
          <motion.div 
            key={item.id}
            whileHover={{ y: -5, borderColor: '#FFD700' }}
            className="group glass-card bg-black p-5 rounded-[2rem] border border-white/10 flex flex-col relative transition-all shadow-xl hover:shadow-[0_0_25px_rgba(255,215,0,0.1)]"
          >
            <div className="mb-4 text-[#FFD700] group-hover:text-[#00FF00] transition-colors">
              {getIcon(item.iconId)}
            </div>
            
            <h3 className="text-[10px] font-black uppercase mb-1 text-white truncate tracking-widest">{item.name}</h3>
            <p className="text-[11px] font-black text-[#00FF00] mb-4 uppercase tracking-tighter italic">
               {item.profit.toLocaleString()} <span className="text-[8px] text-white italic ml-1">AIP/H</span>
            </p>
            
            <button 
              onClick={() => onUpgrade(item.id)}
              disabled={aipCoins < item.cost}
              className={`
                mt-auto py-3 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest border
                ${aipCoins >= item.cost 
                  ? 'bg-[#FFD700] text-black border-[#FFD700] active:scale-95 shadow-[0_0_15px_rgba(255,215,0,0.3)]' 
                  : 'bg-[#FF0000]/10 text-[#FF0000] border-[#FF0000]/40'
                }
              `}
            >
              {item.cost.toLocaleString()} <span className="opacity-60">AIP</span>
            </button>

            <div className="absolute top-3 right-4 text-[8px] font-black text-[#FFD700] uppercase tracking-widest">
               LV {item.level}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default EfficiencyModules;
