import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Zap, ShieldCheck, ShieldAlert } from 'lucide-react';

const MatrixTree = ({ rootNode, children, onDrillDown, loading }) => {
  if (!rootNode) return <div className="p-20 text-center opacity-20">NO ROOT DATA</div>;

  const nodeWidth = 80;
  const nodeHeight = 80;
  const verticalSpacing = 120;
  const horizontalSpacing = 160;

  // Render a connection line (SVG Path)
  const Connection = ({ startX, startY, endX, endY, color }) => {
    const midY = (startY + endY) / 2;
    return (
      <motion.path
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 0.4 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
        d={`M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`}
        stroke={color || "#00ff88"}
        strokeWidth="2"
        fill="none"
        strokeDasharray="5,5"
        className="drop-shadow-[0_0_8px_rgba(0,255,136,0.5)]"
      />
    );
  };

  const NodeIcon = ({ node, isRoot }) => {
    const isDirect = node.sponsor === rootNode.nodeId;
    const color = isRoot ? "#00ff88" : (isDirect ? "#00ff88" : "#00ccff");
    const glow = isRoot ? "0 0 20px rgba(0,255,136,0.4)" : "0 0 15px rgba(0,204,255,0.2)";

    return (
      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => !isRoot && onDrillDown(node)}
        className={`relative flex flex-col items-center cursor-pointer ${isRoot ? 'z-20' : 'z-10'}`}
        style={{ width: nodeWidth }}
      >
        {/* Glowing Hexagon/Circle */}
        <div 
          className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 border-[2px] ${
            isRoot ? 'bg-[#00ff88]/20 border-[#00ff88]' : 'bg-black/60 border-white/10 hover:border-[#00ccff]/50'
          }`}
          style={{ boxShadow: glow }}
        >
          {isRoot ? <ShieldCheck className="text-[#00ff88]" size={24} /> : (node.tier > 0 ? <Zap className="text-[#00ccff]" size={20} /> : <ShieldAlert className="text-white/20" size={20} />)}
        </div>
        
        {/* Label */}
        <div className="mt-2 text-center">
          <p className="text-[10px] font-black text-white uppercase tracking-tighter">ID {node.nodeId}</p>
          <p className={`text-[8px] font-black uppercase tracking-widest ${isRoot ? 'text-[#00ff88]' : 'text-[#00ccff]'}`}>TIER {node.tier}</p>
        </div>

        {!isRoot && (
            <div className="absolute -top-1 -right-1">
                <ArrowUpRight size={10} className="text-white/40" />
            </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="relative w-full overflow-hidden p-4 min-h-[400px] flex flex-col items-center animate-in fade-in duration-500">
      {/* SVG Connections Layer */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-60">
        {!loading && children.map((child, i) => {
          const startX = 200; // Center
          const startY = 80;  // Root position Y
          const endX = children.length === 1 ? 200 : (i === 0 ? 100 : 300);
          const endY = startY + verticalSpacing;
          
          return (
            <Connection 
              key={`conn-${child.nodeId}`} 
              startX={startX} 
              startY={startY} 
              endX={endX} 
              endY={endY}
              color={child.sponsor === rootNode.nodeId ? "#00ff88" : "#00ccff"}
            />
          );
        })}
      </svg>

      {/* Nodes Layer */}
      <div className="relative z-10 flex flex-col items-center w-[400px]">
        {/* Root Node */}
        <div style={{ marginTop: 20 }}>
          <NodeIcon node={rootNode} isRoot={true} />
        </div>

        {/* Children Row */}
        <div className="flex justify-around w-full mt-[80px]">
          {loading ? (
            <div className="py-20 flex justify-center w-full"><Zap className="animate-pulse text-[#00ff88]" size={32} /></div>
          ) : children.length > 0 ? (
            children.map((child) => (
              <NodeIcon key={child.nodeId} node={child} isRoot={false} />
            ))
          ) : (
            <div className="text-[9px] font-black opacity-20 uppercase tracking-[0.3em] mt-8">Branch Optimized / No Slaves Detected</div>
          )}
        </div>
      </div>

      <p className="mt-12 text-[8px] font-black opacity-20 uppercase tracking-[0.4em] italic">Binary Neural Matrix Protocol v4.2</p>
    </div>
  );
};

export default MatrixTree;
