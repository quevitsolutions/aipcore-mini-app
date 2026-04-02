import React, { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';
import { 
  Users, 
  Pickaxe, 
  Flame, 
  Wallet, 
  Gift, 
  TrendingUp, 
  ArrowUpRight, 
  Copy, 
  Share2,
  Info,
  Settings as SettingsIcon,
  Search,
  ExternalLink,
  ShieldAlert,
  Loader2,
  ShieldCheck,
  Camera,
  Zap
} from 'lucide-react';
import AipLogo from './icons/AipLogo';
import { 
  binanceLogo, 
  dailyCipher, 
  dailyCombo, 
  dailyReward, 
  dollarCoin, 
  aipCoin, 
  mainCharacter 
} from './images';
import { 
  checkRegistration, 
  getNodeData, 
  getRewardStats, 
  getWalletBalance,
  connectWallet, 
  switchNetwork,
  createNodeTransaction,
  upgradeTierTransaction,
  getMatrixLevelsData,
  formatBNB,
  getIncomeHistory,
  getDirectReferralsList,
  getMatrixTreeNodes,
  getUnilevelTreeNodes,
  getTierCostsArray,
  getBNBPrice,
  getContractOwner,
  getAppKitModal
} from './utils/web3';
import { getOffchainReferralStats } from './services/referralService';

const BACKEND_URL = import.meta.env.DEV ? 'http://localhost:5000/api' : 'https://nfengine.online/api';

const App = () => {
  // Navigation
  const [currentView, setCurrentView] = useState('home');

  // Off-chain Stats (Persistence)
  const [aipCoins, setAipCoins] = useState(() => Number(localStorage.getItem('aipCoins')) || 0);
  const [totalTaps, setTotalTaps] = useState(() => Number(localStorage.getItem('totalTaps')) || 0);
  const [energy, setEnergy] = useState(1000);
  
  // Wallet & On-chain State
  const [userAddress, setUserAddress] = useState(null);
  const [bnbBalance, setBnbBalance] = useState("0.0000");
  const [nodeId, setNodeId] = useState(0);
  const [nodeTier, setNodeTier] = useState(0);
  const [onchainStats, setOnchainStats] = useState(null);
  const [rewardStats, setRewardStats] = useState(null);
  const [isWrongNetwork, setIsWrongNetwork] = useState(false);
  const [tierCosts, setTierCosts] = useState([]);
  const [bnbPrice, setBnbPrice] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSnapshotting, setIsSnapshotting] = useState(false);
  const [aipRewards, setAipRewards] = useState(() => Number(localStorage.getItem('aipRewards')) || 0);
  const [snapshotData, setSnapshotData] = useState([]);
  const [matrixData, setMatrixData] = useState([]);
  const [offchainRefStats, setOffchainRefStats] = useState({ 
    rawInvites: 0, 
    offlineJoined: 0,
    guests: [] 
  });
  const [incomeHistory, setIncomeHistory] = useState([]);
  const [exploreView, setExploreView] = useState('overview'); // overview, explorer
  const [explorerType, setExplorerType] = useState('matrix'); // matrix, direct
  const [explorerLevel, setExplorerLevel] = useState(1);
  const [explorerData, setExplorerData] = useState([]);
  const [explorerLoading, setExplorerLoading] = useState(false);
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('aipTasks');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn("Resetting tasks due to corruption");
      }
    }
    return [
      { id: 'tg', title: 'Join AIP Telegram', reward: 5000, completed: false, link: 'https://t.me/AIPCore' },
      { id: 'x', title: 'Follow AIP on X', reward: 5000, completed: false, link: 'https://x.com/AIPCore' },
      { id: 'yt', title: 'Subscribe to YT', reward: 5000, completed: false, link: 'https://youtube.com/AIPCore' }
    ];
  });
  const [lastRewardDay, setLastRewardDay] = useState(() => Number(localStorage.getItem('lastRewardDay')) || 0);
  const [lastClaimTime, setLastClaimTime] = useState(() => Number(localStorage.getItem('lastClaimTime')) || 0);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Sync Tracking
  const lastSyncedRef = useRef({ coins: aipCoins, taps: totalTaps });

  const getIcon = (iconId) => {
    switch(iconId) {
      case 'pickaxe': return <Pickaxe size={24} />;
      case 'flame': return <Flame size={24} />;
      case 'trending': return <TrendingUp size={24} />;
      case 'users': return <Users size={24} />;
      default: return <Pickaxe size={24} />;
    }
  };

  const [mineItems, setMineItems] = useState(() => {
    const saved = localStorage.getItem('aipMineItems');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0].id === 'number') {
          return parsed;
        }
        throw new Error('Invalid mineItems structure');
      } catch (e) {
        console.warn("Resetting mineItems due to corruption");
        localStorage.removeItem('aipMineItems');
      }
    }
    return [
      { id: 1, name: 'Multitap', iconId: 'pickaxe', level: 1, cost: 1000, profit: 50 },
      { id: 2, name: 'Energy Cap', iconId: 'flame', level: 1, cost: 2000, profit: 100 },
      { id: 3, name: 'Node Unit', iconId: 'trending', level: 1, cost: 5000, profit: 250 },
      { id: 4, name: 'Sponsor', iconId: 'users', level: 1, cost: 10000, profit: 500 }
    ];
  });

  // --- CORE FUNCTIONS (Moved up to avoid TDZ errors) ---
  
  // 1. Sync User Off-chain Data to Backend
  const syncUserToBackend = useCallback(async (coins, taps) => {
    if (!userAddress) return;
    try {
      const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
      await fetch(`${BACKEND_URL}/user/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: userAddress,
          username: tgUser?.username || "AIP_Warrior",
          telegram_id: tgUser?.id || null,
          coins: Math.floor(coins),
          taps: taps
        })
      });
    } catch (err) {
      console.warn("Sync failed:", err);
    }
  }, [userAddress]);

  // 2. Fetch Blockchain Data (Nodes, Tiers, Rewards)
  const syncBlockchainData = useCallback(async (address) => {
    if (!address) return;
    setIsLoading(true);
    try {
      const balance = await getWalletBalance(address);
      setBnbBalance(Number(balance).toFixed(4));
      
      const [id, costs, bPrice, ownerAddr] = await Promise.all([
        checkRegistration(address),
        getTierCostsArray(),
        getBNBPrice(),
        getContractOwner()
      ]);
      
      setNodeId(id);
      setTierCosts(costs);
      setBnbPrice(bPrice);
      setIsAdmin(address.toLowerCase() === ownerAddr.toLowerCase());

      if (id > 0) {
        const [data, rewards, matrix, offchain, history] = await Promise.all([
          getNodeData(id),
          getRewardStats(id),
          getMatrixLevelsData(id),
          getOffchainReferralStats(id),
          getIncomeHistory(id)
        ]);
        if (data) {
          setNodeTier(data.tier);
          setOnchainStats(data);
        }
        if (rewards) {
          setRewardStats(rewards);
        }
        if (matrix) {
          setMatrixData(matrix);
        }
        if (offchain) {
          setOffchainRefStats(offchain);
        }
        if (history) {
          setIncomeHistory(history);
        }
      } else {
        setNodeTier(0);
        setOnchainStats(null);
        setRewardStats(null);
        setMatrixData([]);
        setOffchainRefStats({ rawInvites: 0, offlineJoined: 0, guests: [] });
        setIncomeHistory([]);
      }
    } catch (err) {
      console.error("Sync error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // --- INITIALIZATION & SYNC EFFECTS ---

  // 1. Initialize Telegram & Auth Listener
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      tg.headerColor = '#000000';
      tg.backgroundColor = '#000000';
      if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');
    }

    const modal = getAppKitModal();
    const unsubscribe = modal.subscribeAccount(state => {
      if (state.isConnected && state.address) {
        setUserAddress(state.address);
        syncBlockchainData(state.address);
      } else {
        setUserAddress(null);
      }
    });

    return () => unsubscribe && unsubscribe();
  }, [syncBlockchainData]);


  useEffect(() => {
    if (userAddress) {
      fetch(`${BACKEND_URL}/user/${userAddress}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.aip_coins) {
            setAipCoins(Number(data.aip_coins));
            setTotalTaps(Number(data.total_taps));
          }
        })
        .catch(err => console.log("New user or offline"));
    }
  }, [userAddress]);

  // Dynamic Scaling (Tied to On-chain Tier)
  const maxEnergy = 1000 + (nodeTier * 1000);
  const tapValue = 1 + (nodeTier * 2);

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('aipCoins', aipCoins.toString());
    localStorage.setItem('totalTaps', totalTaps.toString());
    localStorage.setItem('aipTasks', JSON.stringify(tasks));
    localStorage.setItem('lastRewardDay', lastRewardDay.toString());
    localStorage.setItem('lastClaimTime', lastClaimTime.toString());
    localStorage.setItem('aipMineItems', JSON.stringify(mineItems));
    localStorage.setItem('aipRewards', aipRewards.toString());
  }, [aipCoins, totalTaps, tasks, lastRewardDay, lastClaimTime, mineItems, aipRewards]);

  // Energy Refill
  useEffect(() => {
    const timer = setInterval(() => {
      setEnergy((prev) => Math.min(prev + 1, maxEnergy));
    }, 1000);
    return () => clearInterval(timer);
  }, [maxEnergy]);

  // 5. Periodic Background Sync (Heartbeat) - Every 30 seconds
  useEffect(() => {
    if (!userAddress) return;
    
    const heartbeat = setInterval(() => {
      // Use state-update wrapper to get latest values without re-triggering effect
      setAipCoins(currentCoins => {
        setTotalTaps(currentTaps => {
          if (currentCoins !== lastSyncedRef.current.coins || currentTaps !== lastSyncedRef.current.taps) {
            syncUserToBackend(currentCoins, currentTaps);
            lastSyncedRef.current = { coins: currentCoins, taps: currentTaps };
          }
          return currentTaps;
        });
        return currentCoins;
      });
    }, 30000);

    return () => clearInterval(heartbeat);
  }, [userAddress, syncUserToBackend]);

  // Listeners for Web3 Events & Referrals
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const startParam = params.get('start');
    if (startParam) {
      localStorage.setItem('pendingSponsor', startParam);
    }

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setUserAddress(accounts[0]);
          syncBlockchainData(accounts[0]);
        } else {
          setUserAddress(null);
          setNodeId(0);
        }
      });

      window.ethereum.on('chainChanged', (chainId) => {
        setIsWrongNetwork(chainId !== '0x38' && chainId !== '56' && chainId !== 56);
        window.location.reload();
      });

      window.ethereum.request({ method: 'eth_accounts' }).then(accounts => {
        if (accounts.length > 0) {
          setUserAddress(accounts[0]);
          syncBlockchainData(accounts[0]);
        }
      });

      window.ethereum.request({ method: 'eth_chainId' }).then(chainId => {
        setIsWrongNetwork(chainId !== '0x38' && chainId !== '56' && chainId !== 56);
      });
    }
  }, [syncBlockchainData]);

  const handleWalletConnect = async () => {
    const address = await connectWallet();
    if (address) {
      setUserAddress(address);
      syncBlockchainData(address);
    }
  };

  const fetchExplorerData = async (type, level) => {
    if (!nodeId || nodeId <= 0) return;
    setExplorerLoading(true);
    try {
      let data = [];
      if (type === 'matrix') {
        const maxNodes = Math.pow(2, level);
        data = await getMatrixTreeNodes(nodeId, level, maxNodes);
      } else {
        const count = level === 1 ? (onchainStats?.directNodes || 20) : 50;
        data = await getUnilevelTreeNodes(nodeId, level, count);
      }
      setExplorerData(data);
    } catch (err) {
      console.error("Explorer fetch error:", err);
    } finally {
      setExplorerLoading(false);
    }
  };

  useEffect(() => {
    if (exploreView === 'explorer') {
      fetchExplorerData(explorerType, explorerLevel);
    }
  }, [exploreView, explorerType, explorerLevel, nodeId]);

  const handleWalletDisconnect = () => {
    setUserAddress(null);
    setBnbBalance("0.0000");
    setNodeId(0);
    setNodeTier(0);
    setOnchainStats(null);
    setRewardStats(null);
  };

  const handleCreateNode = async () => {
    setIsProcessing(true);
    try {
      const savedSponsor = localStorage.getItem('pendingSponsor');
      const sponsorId = savedSponsor ? Number(savedSponsor) : 36999;
      await createNodeTransaction(sponsorId);
      await syncBlockchainData(userAddress);
      if (window.Telegram?.WebApp) window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    } catch (err) {
      console.error("Create Node failed:", err);
      if (window.Telegram?.WebApp) window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpgradeTier = async () => {
    if (nodeId === 0) return;
    const nextTierIndex = nodeTier;
    const priceWei = tierCosts[nextTierIndex];
    const priceBNB = priceWei ? Number(formatBNB(priceWei)) : 0;

    if (Number(bnbBalance) < priceBNB + 0.005) {
      alert(`INSUFFICIENT BNB!\n\nThis upgrade costs ${priceBNB.toFixed(4)} BNB.\nYou have ${bnbBalance} BNB.\n\nPlease add more BNB to your wallet to continue.`);
      if (window.Telegram?.WebApp) window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
      return;
    }

    if (!window.confirm(`UPGRADE TO TIER ${nodeTier + 1}?\n\nCost: ${priceBNB.toFixed(4)} BNB (~$${((priceBNB * bnbPrice)/1e8).toFixed(2)})\n\nContinue?`)) {
        return;
    }

    setIsProcessing(true);
    try {
      await upgradeTierTransaction(nodeId, nodeTier + 1);
      await syncBlockchainData(userAddress);
      if (window.Telegram?.WebApp) window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      alert("UPGRADE SUCCESSFUL!");
    } catch (err) {
      console.error("Upgrade failed:", err);
      alert("Upgrade Failed: " + (err.reason || err.message || "Unknown error"));
      if (window.Telegram?.WebApp) window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpgrade = (id) => {
    const card = mineItems.find(item => item.id === id);
    if (aipCoins >= card.cost) {
      setAipCoins(prev => {
        const next = prev - card.cost;
        return next;
      });
      setMineItems(prev => prev.map(item => 
        item.id === id ? { ...item, level: item.level + 1, cost: Math.floor(item.cost * 1.5), profit: Math.floor(item.profit * 1.3) } : item
      ));

      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
      }
    }
  };

  const handleTap = (e) => {
    if (energy <= 0) return;
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
    const newCoins = aipCoins + tapValue;
    const newTaps = totalTaps + 1;
    setAipCoins(newCoins);
    setTotalTaps(newTaps);
    setEnergy(prev => Math.max(0, prev - 1));
  };

  const handleInvite = () => {
    if (nodeId === 0) return;
    const shareUrl = `https://t.me/AIPCoreBot?start=${nodeId}`;
    const text = encodeURIComponent("🚀 Join my AIPCore Matrix and earn real BNB! Activate your node now.");
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${text}`, '_blank');
  };

  const handleHardReset = () => {
    if (window.confirm("ARE YOU SURE? This will clear all off-chain progress (Coins, Taps, Task status). On-chain Nodes/BNB are NOT affected.")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const claimDailyReward = () => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    if (now - lastClaimTime < oneDay && lastClaimTime !== 0) {
      alert("Come back tomorrow!");
      return;
    }
    const nextDay = lastRewardDay >= 10 ? 1 : lastRewardDay + 1;
    const reward = nextDay * 1000;
    const newCoins = aipCoins + reward;
    setAipCoins(newCoins);
    setLastRewardDay(nextDay);
    setLastClaimTime(now);
    if (window.Telegram?.WebApp) window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
  };

  const completeTask = (taskId) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId && !t.completed) {
        const newCoins = aipCoins + t.reward;
        setAipCoins(newCoins);
        if (window.Telegram?.WebApp) window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        return { ...t, completed: true };
      }
      return t;
    }));
  };

  const handleConvertCoins = () => {
    if (aipCoins < 1000) {
      alert("Minimum 1,000 AIP Coins required to convert!");
      return;
    }
    const rewardUnits = Math.floor(aipCoins / 1000);
    const remainingCoins = aipCoins % 1000;
    setAipRewards(prev => prev + rewardUnits);
    setAipCoins(remainingCoins);
    if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }
    alert(`Successfully converted ${(rewardUnits * 1000).toLocaleString()} coins into ${rewardUnits} AIP Reward Units!`);
  };

  const takeSnapshot = async () => {
    if (!isAdmin) return;
    setIsSnapshotting(true);
    setTimeout(() => {
        setSnapshotData([
            { id: 1, wallet: userAddress, coins: aipCoins, time: Date.now() },
            { id: 2, wallet: '0x1234...5678', coins: 450000, time: Date.now() },
            { id: 3, wallet: '0x8888...9999', coins: 120000, time: Date.now() }
        ]);
        setIsSnapshotting(false);
        alert("Snapshot Captured Successfully!");
    }, 2000);
  };

  const renderAdmin = () => (
    <div className="p-4 pb-24 h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
          <div>
              <h2 className="text-3xl font-black text-[#00ff88] tracking-tighter">ADMIN TERMINAL</h2>
              <p className="text-sm opacity-100 text-white font-black uppercase tracking-widest italic">Auth & Core Protocol Management</p>
          </div>
          <div className="w-12 h-12 bg-[#00ff88]/10 rounded-2xl flex items-center justify-center text-[#00ff88]">
              <ShieldCheck size={24} />
          </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="glass-card p-5 rounded-3xl border-[#00ff88]/30 bg-[#00ff88]/5">
              <p className="text-[12px] font-black opacity-100 text-white uppercase tracking-[0.2em] mb-1">Contract Fees</p>
              <p className="text-2xl font-black text-[#00ff88] drop-shadow-md">{bnbBalance} <span className="text-sm opacity-100 text-white">BNB</span></p>
              <button onClick={() => alert("Fees Swept to Treasury")} className="mt-4 w-full py-3 bg-white text-black font-black rounded-xl text-[11px] uppercase active:scale-95 transition-all shadow-lg">Sweep to Treasury</button>
          </div>
          <div className="glass-card p-5 rounded-3xl border-orange-500/30 bg-orange-500/5">
              <p className="text-[12px] font-black opacity-100 text-white uppercase tracking-[0.2em] mb-1">Oracle Feed</p>
              <p className="text-2xl font-black text-orange-400 drop-shadow-md">${(bnbPrice / 1e8).toFixed(2)}</p>
              <button onClick={() => alert("Manual Price Synced")} className="mt-4 w-full py-3 bg-white text-black font-black rounded-xl text-[11px] uppercase active:scale-95 transition-all shadow-lg">Refresh Oracle</button>
          </div>
      </div>

      <h3 className="text-[14px] font-black text-[#00ff88] mb-4 uppercase tracking-[0.2em]">AIP Protocol Snapshots</h3>
      <div className="glass-card p-6 rounded-[32px] mb-8 border-dashed border-white/10 text-center">
          <button 
              onClick={takeSnapshot}
              disabled={isSnapshotting}
              className={`w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center space-x-3 transition-all ${isSnapshotting ? 'bg-white/5' : 'bg-white text-black active:scale-95'}`}
          >
              {isSnapshotting ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
              <span>{isSnapshotting ? 'CAPTURING...' : 'TAKE CURRENT SNAPSHOT'}</span>
          </button>
          
          {snapshotData.length > 0 && (
              <div className="mt-6 space-y-2 text-left">
                  <div className="flex justify-between items-center px-1">
                      <span className="text-[11px] font-black opacity-100 text-white uppercase tracking-widest">Verified Snapshot</span>
                      <span className="text-[11px] font-black text-[#00ff88] uppercase">{snapshotData.length} Targets</span>
                  </div>
                  {snapshotData.slice(0, 3).map((s, idx) => (
                      <div key={idx} className="p-4 bg-white/10 rounded-2xl flex justify-between items-center border border-white/5 shadow-inner">
                          <span className="text-[11px] font-mono text-white font-bold">{s.wallet}</span>
                          <span className="text-[12px] font-black text-[#00ff88]">{s.coins.toLocaleString()} AIP</span>
                      </div>
                  ))}
                  <button className="w-full mt-4 py-4 bg-[#00ff88] text-black font-black rounded-2xl text-[12px] uppercase tracking-widest shadow-xl active:scale-95">EXECUTE REWARD DISTRIBUTION</button>
              </div>
          )}
      </div>

      <h3 className="text-[14px] font-black text-[#00ff88] mb-4 uppercase tracking-[0.2em]">Objective Publisher</h3>
      <div className="glass-card p-6 rounded-[32px] border border-white/5">
          <div className="space-y-4">
              <input type="text" placeholder="Task Title" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:border-[#00ff88] outline-none" />
              <input type="text" placeholder="Action Link" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:border-[#00ff88] outline-none" />
              <div className="flex space-x-2">
                  <input type="number" placeholder="Reward" className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3 text-sm outline-none" />
                  <button className="px-6 py-3 bg-white text-black font-black rounded-xl text-xs">PUBLISH</button>
              </div>
          </div>
      </div>
    </div>
  );

  const renderHome = () => (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-6 pt-2 flex justify-between items-center z-20">
          <button onClick={() => setCurrentView('earn')} className="glass-card p-4 rounded-2xl flex flex-col items-center justify-center space-y-1 active:scale-95 transition-transform w-[48%]">
              <Gift size={20} className="text-[#00ff88]" />
              <span className="text-[12px] font-black uppercase tracking-widest text-white">Daily Reward</span>
          </button>
          <button onClick={() => setCurrentView('mine')} className="glass-card p-4 rounded-2xl flex flex-col items-center justify-center space-y-1 active:scale-95 transition-transform w-[48%]">
              <TrendingUp size={20} className="text-[#00ff88]" />
              <span className="text-[12px] font-black uppercase tracking-widest text-white">Boost Tier</span>
          </button>
      </div>

      <div className="flex-grow flex flex-col items-center justify-center relative select-none">
        <div 
          className="click-card relative w-64 h-64 rounded-full flex items-center justify-center cursor-pointer overflow-hidden z-10"
          onClick={handleTap}
        >
          <img src={mainCharacter} alt="AIP Warrior" className="w-48 h-48 pointer-events-none" />
        </div>
        <div className="mt-8 flex items-center space-x-3">
          <img src={dollarCoin} alt="AIP" className="w-12 h-12 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" />
          <span className="text-5xl font-black text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">{aipCoins.toLocaleString()}</span>
        </div>
      </div>
      <div className="px-6 pb-24">
        <div className="flex justify-between items-end mb-2">
          <div className="flex items-center space-x-2">
            <Flame className="w-6 h-6 text-orange-500 fill-orange-500" />
            <span className="text-lg font-black text-white">{energy} / {maxEnergy}</span>
          </div>
          <span className="text-[12px] font-black text-[#00ff88] uppercase tracking-widest">Power: 1 + {nodeTier * 2}</span>
        </div>
        <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden border border-white/5">
          <div className="progress-gradient h-full transition-all duration-300" style={{ width: `${(energy / maxEnergy) * 100}%` }}/>
        </div>
      </div>
    </div>
  );

  const renderMine = () => (
    <div className="p-4 pb-24 h-full overflow-y-auto">
      <h2 className="text-3xl font-black mb-1 text-[#00ff88]">ON-CHAIN BOOST</h2>
      <p className="text-[13px] text-white opacity-100 mb-8 font-bold italic uppercase tracking-wider">Upgrade your node tier to maximize yield distributions.</p>

      {!userAddress ? (
          <div className="glass-card p-10 rounded-3xl text-center border-dashed border-2 border-[#00ff88]/40 bg-transparent">
              <Wallet className="w-16 h-16 mx-auto mb-4 text-[#00ff88] opacity-80" />
              <p className="text-[13px] font-black uppercase tracking-[0.2em] mb-6 text-white">Connect Wallet to Boost Tier</p>
              <button onClick={handleWalletConnect} className="w-full py-4 bg-[#00ff88] text-black font-black rounded-2xl active:scale-95 transition-transform text-lg shadow-[0_0_20px_rgba(0,255,136,0.2)]">CONNECT WALLET</button>
          </div>
      ) : nodeId === 0 ? (
        <div className="glass-card p-8 rounded-3xl text-center border-2 border-[#00ff88]/30 bg-[#00ff88]/[0.02]">
            <TrendingUp className="w-16 h-16 mx-auto mb-6 text-[#00ff88] animate-pulse" />
            <h3 className="text-2xl font-black mb-2 uppercase">Activate L1 Node</h3>
            <p className="text-sm opacity-70 mb-8">Launch your first node to gain **+1,000 Energy** and start earning real BNB distribution.</p>
            <button 
                onClick={handleCreateNode}
                disabled={isProcessing}
                className="w-full py-5 bg-[#00ff88] text-black font-black text-lg rounded-2xl flex items-center justify-center space-x-3 active:scale-95 disabled:opacity-50"
            >
                {isProcessing ? <Loader2 className="animate-spin" /> : <><span>INITIAL BOOST ($5)</span><ArrowUpRight className="w-6 h-6" /></>}
            </button>
        </div>
      ) : (
        <div className="space-y-6">
            <div className="glass-card p-8 rounded-[40px] border-t border-white/20 bg-gradient-to-br from-white/5 to-transparent">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <p className="text-[12px] font-black opacity-100 text-white uppercase tracking-[0.2em] mb-1">Node Power</p>
                        <h4 className="font-black text-4xl text-[#00ff88] drop-shadow-[0_0_10px_rgba(0,255,136,0.3)]">TIER {nodeTier}</h4>
                    </div>
                    <div className="p-3 bg-[#00ff88]/20 rounded-2xl border border-[#00ff88]/30">
                        <Flame className="w-6 h-6 text-[#00ff88]" />
                    </div>
                </div>
                <button 
                    onClick={handleUpgradeTier}
                    disabled={isProcessing || nodeTier >= 18}
                    className="w-full py-4 bg-[#00ff88] text-black font-black text-md rounded-2xl active:scale-95 disabled:opacity-50 shadow-[0_10px_20px_rgba(0,255,136,0.1)] flex flex-col items-center justify-center"
                >
                    {isProcessing ? (
                        <Loader2 className="animate-spin mx-auto" />
                    ) : (
                        <>
                            <span className="text-sm font-black text-white px-2 py-1 mb-1 bg-black/20 rounded-lg uppercase tracking-widest">ACTIVATE TIER {nodeTier + 1}</span>
                            {tierCosts[nodeTier] && (
                                <span className="text-[12px] font-black opacity-100 text-black/70">NETWORK FEE: {Number(formatBNB(tierCosts[nodeTier])).toFixed(4)} BNB</span>
                            )}
                        </>
                    )}
                </button>
            </div>
            <div className="mt-8 mb-4">
                <h3 className="text-sm font-black text-[#00ff88] uppercase tracking-widest">Matrix Units</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {mineItems.map((item) => (
                    <div key={item.id} className={`glass-card p-5 rounded-[32px] flex flex-col relative transition-all border-white/20 opacity-100 shadow-xl bg-white/[0.03]`}>
                        <div className="mb-4 text-[#00ff88] opacity-100">{getIcon(item.iconId)}</div>
                        <h3 className="text-sm font-black uppercase mb-1 text-white">{item.name}</h3>
                        <p className="text-[11px] opacity-100 text-[#00ff88] font-black mb-4 uppercase tracking-tighter italic">LVL {item.level} • {item.profit.toLocaleString()}/H PROFIT</p>
                        <button 
                            onClick={() => handleUpgrade(item.id)}
                            disabled={aipCoins < item.cost}
                            className={`mt-auto py-3 rounded-xl text-[11px] font-black transition-all ${aipCoins >= item.cost ? 'bg-white text-black active:scale-95 shadow-lg' : 'bg-white/5 text-white/40'}`}
                        >
                            {item.cost.toLocaleString()} AIP
                        </button>
                    </div>
                ))}
            </div>
        </div>
      )}
    </div>
  );

  const renderFriends = () => (
    <div className="p-4 pb-24 h-full overflow-y-auto">
      <h2 className="text-3xl font-black mb-1 text-white">NETWORK TREE</h2>
      <p className="text-sm opacity-100 text-[#00ff88] mb-6 font-black uppercase tracking-widest">Reserved for node owners.</p>
      {nodeId === 0 ? (
        <div className="glass-card p-10 rounded-3xl text-center border-dashed border-2 border-white/5 bg-transparent">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-10" />
            <p className="text-sm opacity-30 font-bold uppercase tracking-widest italic">Node activation required</p>
        </div>
      ) : (
        <div className="space-y-6">
            <button onClick={handleInvite} className="w-full py-5 bg-white text-black font-black rounded-3xl flex items-center justify-center space-x-3 shadow-xl active:scale-98 transition-all hover:bg-[#00ff88]"><Share2 size={24} /><span>INVITE VIA TELEGRAM</span></button>
            <div className="grid grid-cols-2 gap-4">
                <div className="glass-card p-5 rounded-3xl border-white/20"><p className="text-[12px] opacity-100 font-black text-white uppercase mb-1">Directs</p><p className="text-4xl font-black text-[#00ff88]">{onchainStats?.directNodes || 0}</p></div>
                <div className="glass-card p-5 rounded-3xl border-white/20"><p className="text-[12px] opacity-100 font-black text-white uppercase mb-1">Matrix</p><p className="text-4xl font-black text-[#00ff88]">{onchainStats?.totalMatrixNodes || 0}</p></div>
                <div className="glass-card p-5 rounded-3xl border-dashed border-white/40"><p className="text-[12px] opacity-100 font-black text-white uppercase mb-1">Total Invites</p><div className="flex items-baseline space-x-2"><p className="text-4xl font-black text-[#00ff88]">{offchainRefStats.rawInvites}</p><span className="text-[10px] font-black text-orange-500 italic uppercase">Clicks</span></div></div>
                <div className="glass-card p-5 rounded-3xl border-dashed border-white/40"><p className="text-[12px] opacity-100 font-black text-white uppercase mb-1">Guest Joins</p><div className="flex items-baseline space-x-2"><p className="text-4xl font-black text-[#00ff88]">{offchainRefStats.offlineJoined}</p><span className="text-[10px] font-black text-blue-400 italic uppercase">Users</span></div></div>
            </div>
            <div className="flex bg-white/5 p-1 rounded-2xl">
                <button onClick={() => setExploreView('overview')} className={`flex-1 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all ${exploreView === 'overview' ? 'bg-[#00ff88] text-black shadow-lg shadow-[#00ff88]/20' : 'opacity-40'}`}>TEAM STATS</button>
                <button onClick={() => { setExploreView('explorer'); if (explorerData.length === 0) fetchExplorerData(explorerType, explorerLevel); }} className={`flex-1 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all ${exploreView === 'explorer' ? 'bg-[#00ff88] text-black shadow-lg shadow-[#00ff88]/20' : 'opacity-40'}`}>EXPLORE TREE</button>
            </div>
            {exploreView === 'overview' ? (
                <div className="space-y-4 pb-8">
                    <div className="mt-4 mb-2 flex justify-between items-center text-[#00ff88]"><h3 className="text-[10px] font-black tracking-widest uppercase flex items-center space-x-2"><Users size={14} /><span>Recent Guest Activity</span></h3><span className="text-[10px] font-black opacity-30 italic">{offchainRefStats.guests?.length || 0} Listed</span></div>
                    <div className="space-y-3">
                        {offchainRefStats.guests?.length > 0 ? offchainRefStats.guests.map((guest, i) => (
                            <div key={i} className="glass-card p-4 rounded-3xl flex justify-between items-center border border-white/5 bg-white/[0.02]"><div className="flex items-center space-x-3"><div className="w-8 h-8 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400 font-black text-[10px]">{guest.username.slice(0,2).toUpperCase()}</div><div><p className="text-xs font-black">@{guest.username}</p><p className="text-[9px] opacity-40 font-medium">Joined {guest.joinedAt}</p></div></div><span className="text-[9px] font-black tracking-tighter bg-white/10 px-2 py-1 rounded-full opacity-60">GUEST</span></div>
                        )) : <p className="text-center py-4 text-[9px] opacity-20 uppercase font-black">No recent guest activity</p>}
                    </div>
                    <div className="h-[1px] w-full bg-white/5 my-4"></div>
                    <div className="flex justify-between items-center mb-6"><h3 className="text-sm font-black text-[#00ff88] tracking-widest uppercase flex items-center space-x-2"><TrendingUp size={16} /><span>18-Level Matrix Yield</span></h3><div className="px-3 py-1 bg-[#00ff88]/10 rounded-full border border-[#00ff88]/20 flex items-center space-x-2"><span className="text-[8px] font-black text-[#00ff88] uppercase tracking-tighter">70% MATCHING RULE</span><Info size={10} className="text-[#00ff88] opacity-50" /></div></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {matrixData.length > 0 ? matrixData.map(lvl => {
                        const isUnlocked = nodeTier >= lvl.level;
                        const maxNodes = Math.pow(2, lvl.level);
                        const tierPrice = tierCosts[lvl.level - 1] ? Number(formatBNB(tierCosts[lvl.level - 1])) : 0;
                        const potentialBNB = (tierPrice * 0.7 * maxNodes).toFixed(4);
                        return (
                            <div key={lvl.level} className={`glass-card p-5 rounded-[40px] flex flex-col space-y-4 transition-all relative overflow-hidden ${!isUnlocked ? 'opacity-30 grayscale-[0.8]' : 'border-[#00ff88]/30 bg-gradient-to-br from-[#00ff88]/[0.05] to-transparent shadow-2xl'}`}>
                                {!isUnlocked && <div className="absolute top-3 right-4 flex items-center space-x-1.5 px-3 py-1 bg-black/40 rounded-lg border border-white/10 backdrop-blur-md"><ShieldAlert size={12} className="text-red-500 animate-pulse" /><span className="text-[9px] font-black text-white uppercase tracking-widest">Locked • Tier {lvl.level} Required</span></div>}
                                <div className="flex justify-between items-start"><div className="flex items-center space-x-4"><div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl transition-colors ${isUnlocked ? 'bg-[#00ff88] text-black shadow-[0_0_20px_rgba(0,255,136,0.5)]' : 'bg-white/10 text-white/30'}`}>{lvl.level}</div><div><div className="flex items-center space-x-2 mb-1"><p className="text-base font-black text-white">{lvl.count} / {maxNodes.toLocaleString()} NODES</p></div><div className="w-28 h-2.5 bg-white/10 rounded-full overflow-hidden border border-white/10"><div className={`h-full rounded-full transition-all duration-1000 ${isUnlocked ? 'bg-gradient-to-r from-[#00ff88] to-[#00ccff]' : 'bg-white/20'}`} style={{ width: `${Math.min(100, (lvl.count / maxNodes) * 100)}%` }} /></div></div></div><div className="text-right flex flex-col justify-center h-14"><div className="mb-0.5"><p className={`text-lg font-black ${isUnlocked ? 'text-[#00ff88]' : 'text-white/20'} drop-shadow-md`}>{lvl.reward} BNB</p><p className="text-[9px] opacity-100 text-white font-black uppercase tracking-widest">Current Yield</p></div></div></div>
                            </div>
                        );
                    }) : <div className="py-12 flex flex-col items-center opacity-10"><Users size={48} className="mb-4 stroke-1" /><p className="text-sm font-black tracking-widest uppercase">Syncing Network...</p></div>}
                    </div>
                </div>
            ) : (
                <div className="space-y-6 pb-24">
                    <div className="space-y-4"><div className="flex space-x-2"><button onClick={() => setExplorerType('matrix')} className={`flex-1 py-3 border rounded-xl text-[9px] font-black transition-all ${explorerType === 'matrix' ? 'border-[#00ff88] bg-[#00ff88]/10 text-[#00ff88]' : 'border-white/5 opacity-40'}`}>2X2 MATRIX</button><button onClick={() => setExplorerType('direct')} className={`flex-1 py-3 border rounded-xl text-[9px] font-black transition-all ${explorerType === 'direct' ? 'border-[#00ff88] bg-[#00ff88]/10 text-[#00ff88]' : 'border-white/5 opacity-40'}`}>DIRECT TEAM</button></div><div className="flex space-x-2 overflow-x-auto pb-4 no-scrollbar">{[...Array(18)].map((_, i) => (<button key={i} onClick={() => setExplorerLevel(i + 1)} className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black transition-all ${explorerLevel === i + 1 ? 'bg-[#00ff88] text-black shadow-[0_0_15px_rgba(0,255,136,0.5)]' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}>{i+1}</button>))}</div></div>
                    <div className="space-y-3"><div className="flex justify-between items-center text-[10px] font-black opacity-30 uppercase tracking-widest mb-2 px-2"><span>{explorerType === 'matrix' ? `Layer ${explorerLevel}` : 'Personal Directs'}</span><span className="text-[#00ff88]">{explorerData.length} Results</span></div>
                    {explorerLoading ? <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-[#00ff88]" size={32} /></div> : explorerData.length > 0 ? explorerData.map((node) => {
                        const isDirect = node.sponsor === nodeId;
                        const isSpillover = node.sponsor < nodeId;
                        return (
                            <div key={node.nodeId} className="glass-card p-4 rounded-3xl border border-white/5 bg-white/[0.01] flex justify-between items-center relative overflow-hidden group"><div className={`absolute top-0 left-0 w-1 h-full opacity-40 ${isDirect ? 'bg-[#00ff88]' : isSpillover ? 'bg-purple-500' : 'bg-blue-400'}`} /><div className="flex items-center space-x-4"><div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 font-black text-xs">ID {node.nodeId}</div><div><div className="flex items-center space-x-2"><p className="text-xs font-black font-mono tracking-tight">{node.wallet.slice(0, 8)}...{node.wallet.slice(-8)}</p>{explorerType === 'matrix' && <span className={`text-[7px] px-1.5 py-0.5 rounded-sm font-black uppercase tracking-tighter ${isDirect ? 'bg-[#00ff88] text-black' : isSpillover ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-400/20 text-blue-400'}`}>{isDirect ? 'Direct' : isSpillover ? 'Spillover' : 'Team'}</span>}</div><div className="flex items-center space-x-2 mt-1"><span className="text-[9px] px-2 py-0.5 rounded bg-white/5 text-white/40 font-black">SPONSOR {node.sponsor}</span><span className="text-[9px] px-2 py-0.5 rounded bg-[#00ff88]/20 text-[#00ff88] font-black">TIER {node.tier}</span></div></div></div><a href={`https://bscscan.com/address/${node.wallet}`} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-[#00ff88]/20 transition-colors"><ArrowUpRight size={14} className="opacity-40" /></a></div>
                        );
                    }) : <div className="py-20 text-center opacity-30"><p className="text-xs font-black uppercase tracking-widest">No Nodes Found</p></div>}</div>
                </div>
            )}
        </div>
      )}
    </div>
  );

  const renderEarn = () => (
    <div className="p-4 pb-24 h-full overflow-y-auto">
      <h2 className="text-3xl font-black mb-1 text-[#00ff88]">EARN REWARDS</h2>
      <p className="text-sm opacity-100 text-white font-black uppercase tracking-widest italic mb-8">Consistent warriors earn higher AIP dividends.</p>
      <div className="glass-card p-6 rounded-[40px] mb-8 relative overflow-hidden bg-gradient-to-br from-[#00ff88]/10 to-transparent border-white/20 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-[13px] font-black uppercase tracking-[0.2em] flex items-center space-x-2 text-white">
                <Gift size={20} className="text-[#00ff88]" />
                <span>Daily Bonus</span>
            </h3>
            <p className="text-[11px] font-black opacity-100 text-[#00ff88] italic uppercase tracking-tighter">Resets Daily</p>
        </div>
        <div className="grid grid-cols-5 gap-2 mb-6">
            {[...Array(10)].map((_, i) => { 
                const day = i + 1; 
                const isClaimed = day <= lastRewardDay; 
                const isCurrent = day === (lastRewardDay >= 10 ? 1 : lastRewardDay + 1); 
                return (
                    <div key={day} className={`h-16 rounded-2xl flex flex-col items-center justify-center border transition-all shadow-md ${isClaimed ? 'bg-[#00ff88] border-[#00ff88] text-black shadow-[0_0_15px_rgba(0,255,136,0.3)]' : isCurrent ? 'bg-[#00ff88]/20 border-[#00ff88]/50 animate-pulse text-white font-bold' : 'bg-white/5 border-white/10 text-white opacity-40'}`}>
                        <span className="text-[10px] font-black">{day}</span>
                        <Gift size={14} className="my-1" />
                        <span className="text-[10px] font-bold">{day}K</span>
                    </div>
                ); 
            })}
        </div>
        <button onClick={claimDailyReward} className="w-full py-4 bg-white text-black font-black rounded-2xl active:scale-95 transition-transform text-[13px] tracking-widest shadow-xl">ACTIVATE BONUS</button>
      </div>
      <h3 className="text-[14px] font-black text-[#00ff88] mb-4 uppercase tracking-[0.2em]">AIP Core Objectives</h3>
      <div className="space-y-4">
          {tasks.map(task => (
              <div key={task.id} className="glass-card p-5 rounded-3xl flex justify-between items-center border border-white/20 bg-white/[0.03] shadow-lg">
                  <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-[#00ff88] shadow-inner">
                          {task.id === 'tg' ? <Users size={22} /> : task.id === 'x' ? <Share2 size={22} /> : <TrendingUp size={22} />}
                      </div>
                      <div>
                          <p className="text-sm font-black uppercase text-white tracking-wide">{task.title}</p>
                          <p className="text-[12px] font-black text-[#00ff88] drop-shadow-[0_0_5px_rgba(0,255,136,0.2)]">+{task.reward.toLocaleString()} AIP CREDITS</p>
                      </div>
                  </div>
                  <button 
                    onClick={() => { window.open(task.link, '_blank'); completeTask(task.id); }} 
                    disabled={task.completed} 
                    className={`px-6 py-3 rounded-2xl text-[12px] font-black tracking-widest transition-all ${task.completed ? 'bg-white/5 opacity-20 text-white' : 'bg-white text-black active:scale-95 shadow-md'}`}
                  >
                    {task.completed ? 'CLAIMED' : 'EXECUTE'}
                  </button>
              </div>
          ))}
      </div>
    </div>
  );

  const renderAirdrop = () => (
    <div className="p-4 pb-24 h-full overflow-y-auto font-black">
      <h2 className="text-3xl font-black mb-1 text-white uppercase tracking-tighter">TRANSFERS & STATS</h2>
      <p className="text-[13px] opacity-100 text-[#00ff88] font-black uppercase tracking-widest italic mb-6">Tracking your AIPCore network status.</p>
      {!userAddress ? <button onClick={handleWalletConnect} className="w-full glass-card p-6 rounded-[32px] flex items-center justify-between group active:scale-95 transition-all shadow-xl bg-[#00ff88]/5"><span className="font-black text-sm uppercase tracking-widest text-[#00ff88]">Connect Explorer Wallet</span><ArrowUpRight className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform text-[#00ff88]" /></button> : (
          <div className="space-y-6 text-white font-black">
               <div className="flex space-x-3">
                 <button onClick={handleWalletConnect} className="flex-1 py-4 bg-white text-black rounded-2xl text-[12px] font-black tracking-widest uppercase active:scale-95 transition-transform flex items-center justify-center space-x-2 shadow-lg"><Users size={16} /><span>Change</span></button>
                 <div className="flex-[2] glass-card px-6 rounded-2xl flex items-center justify-between border-[#00ff88]/20 bg-gradient-to-r from-[#00ff88]/5 to-transparent shadow-md">
                   <span className="text-[11px] font-black opacity-100 text-white uppercase tracking-widest">BNB Balance</span>
                   <span className="font-black text-lg text-[#00ff88]">{bnbBalance}</span>
                 </div>
               </div>
               
               <div className="glass-card p-8 rounded-[40px] border-white/20 bg-white/[0.02]">
                 <div className="flex justify-between items-center mb-6">
                   <span className="px-4 py-1.5 bg-[#00ff88]/10 rounded-full text-[12px] font-black tracking-widest text-[#00ff88] uppercase border border-[#00ff88]/20 shadow-inner">Auth Off-Chain Data</span>
                   <TrendingUp className="w-6 h-6 text-[#00ff88]" />
                 </div>
                 <div className="grid grid-cols-2 gap-6">
                   <div className="p-4 bg-white/5 rounded-3xl border border-white/5">
                     <p className="text-[12px] font-black opacity-100 text-[#00ff88] uppercase mb-1 tracking-widest">AIP Credits</p>
                     <p className="text-3xl font-black text-white">{aipCoins.toLocaleString()}</p>
                   </div>
                   <div className="p-4 bg-white/5 rounded-3xl border border-white/5">
                     <p className="text-[12px] font-black opacity-100 text-[#00ff88] uppercase mb-1 tracking-widest">Energy Cap</p>
                     <p className="text-3xl font-black text-white">{energy}</p>
                   </div>
                 </div>
               </div>
               <div className="p-6 glass-card rounded-3xl border border-[#00ff88]/10 bg-[#00ff88]/[0.02]"><div className="flex justify-between items-center mb-4"><div><p className="text-[10px] font-black opacity-40 uppercase tracking-widest">Reward Potential</p><p className="text-2xl font-black text-[#00ff88]">{aipRewards.toLocaleString()} <span className="text-xs opacity-50">AIP</span></p></div><button onClick={handleConvertCoins} className="px-6 py-3 bg-white text-black font-black rounded-2xl text-[10px] uppercase active:scale-95 transition-transform flex items-center space-x-2"><Zap size={14} /><span>Convert Coins</span></button></div><p className="text-[9px] opacity-30 italic">* 1,000 AipCoins = 1 AIP Reward Unit</p></div>
               <div className={`glass-card p-6 rounded-3xl border-l-4 ${nodeId > 0 ? 'border-[#00ff88]' : 'border-red-500'}`}><p className="text-[10px] font-black opacity-30 uppercase tracking-widest mb-2">Conversion Status</p><div className="flex justify-between items-center"><span className="text-xl font-black">{nodeId > 0 ? 'CONVERTED NODE' : 'PENDING ACTIVATION'}</span>{nodeId === 0 && <button onClick={() => setCurrentView('mine')} className="text-[10px] font-black bg-red-500/10 text-red-500 px-3 py-1 rounded-full border border-red-500/20">ACTIVATE NOW</button>}</div></div>
               {nodeId > 0 && rewardStats && (
                   <div className="glass-card p-6 rounded-3xl border-2 border-[#00ff88]/20 bg-[#00ff88]/[0.02] shadow-[0_0_30px_rgba(0,255,136,0.05)]"><div className="flex justify-between items-center mb-6"><span className="px-3 py-1 bg-[#00ff88]/10 text-[#00ff88] rounded-full text-[10px] font-black tracking-widest">REAL ON-CHAIN DATA</span><div className="flex items-center space-x-1 text-[#00ff88]"><span className="text-2xl font-black">{rewardStats.total}</span><span className="text-xs font-bold opacity-60">BNB</span></div></div><div className="space-y-3 pt-6 border-t border-white/5 text-xs font-medium"><div className="flex justify-between"><span className="opacity-40">Referral Rewards</span><span className="font-mono text-[#00ff88]">+{rewardStats.referral}</span></div><div className="flex justify-between"><span className="opacity-40">Direct Rewards</span><span className="font-mono text-[#00ff88]">+{rewardStats.direct}</span></div><div className="flex justify-between"><span className="opacity-40">Layer Rewards</span><span className="font-mono text-[#00ff88]">+{rewardStats.tier}</span></div><div className="flex justify-between"><span className="opacity-40">Matrix Rewards</span><span className="font-mono text-[#00ff88]">+{rewardStats.binary}</span></div><div className="flex justify-between"><span className="opacity-40">Pool Rewards</span><span className="font-mono text-[#00ff88]">+{rewardStats.pool}</span></div><div className="flex justify-between pt-2 text-red-500/60"><span className="opacity-60">Missed Rewards (Lost)</span><span className="font-mono">-{rewardStats.lost}</span></div><div className="flex justify-between pt-3 mt-3 border-t border-white/5 opacity-40 italic"><span>Total Node Contribution</span><span>{onchainStats?.totalContribution || '0'} BNB</span></div></div></div>
               )}
               {incomeHistory.length > 0 && (
                   <div className="mt-8"><div className="flex justify-between items-center mb-4"><h3 className="text-[10px] font-black text-[#00ff88] uppercase tracking-widest flex items-center space-x-2"><TrendingUp size={14} /><span>Recent Operations</span></h3><button onClick={() => syncBlockchainData(userAddress)} className="text-[10px] font-black opacity-30 hover:opacity-100 transition-opacity">REFRESH</button></div><div className="space-y-3">{incomeHistory.map((item, i) => { const labels = ["REFERRAL", "DIRECT", "LAYER", "MATRIX"]; const colors = ["text-blue-400 bg-blue-400/10", "text-orange-400 bg-orange-400/10", "text-purple-400 bg-purple-400/10", "text-[#00ff88] bg-[#00ff88]/10"]; const typeLabel = labels[item.rewardType] || "REWARD"; const typeColor = colors[item.rewardType] || "text-white bg-white/10"; const date = new Date(item.time * 1000).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); return (<div key={i} className="glass-card p-4 rounded-3xl flex justify-between items-center border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-colors"><div className="flex items-center space-x-4"><div className={`px-2.5 py-1 rounded-lg text-[8px] font-black tracking-widest ${typeColor}`}>{typeLabel}</div><div><p className="text-[11px] font-black">+{item.amount} BNB</p><p className="text-[9px] opacity-30 font-medium uppercase">{date}</p></div></div><div className="text-right"><p className="text-[9px] font-black opacity-40 italic">Tier {item.tier}</p><p className="text-[8px] opacity-20 font-medium uppercase tracking-tighter">L{item.layer}</p></div></div>); })}</div></div>
               )}
               <div className="pt-8 opacity-40"><button onClick={handleHardReset} className="w-full py-4 border border-red-500/20 text-red-500 text-[10px] font-black tracking-widest uppercase rounded-2xl active:scale-95 transition-all">Emergency Data Reset</button></div>
          </div>
      )}
    </div>
  );

  const SidebarItem = ({ id, icon: Icon, label, color }) => (
    <button 
      onClick={() => setCurrentView(id)} 
      className={`sidebar-item w-full flex items-center space-x-3 px-6 py-4 rounded-2xl ${currentView === id ? 'active' : 'opacity-100 font-bold'}`}
    >
      <Icon size={20} className={color || 'text-white'} />
      <span className="text-[13px] font-black uppercase tracking-widest">{label}</span>
    </button>
  );

  return (
    <div className="h-screen w-full relative flex lg:flex-row bg-black antialiased font-['Outfit'] overflow-hidden">
      <div className="matrix-grid"></div>
      
      {/* 1. Left Sidebar (Desktop Only) */}
      <aside className="hidden lg:flex flex-col w-72 h-full border-r border-white/5 bg-black/40 backdrop-blur-xl z-50 p-6">
        <div className="flex items-center space-x-4 mb-12">
            <div className="w-12 h-12 bg-[#00ff88] rounded-2xl flex items-center justify-center p-2.5 shadow-[0_0_20px_rgba(0,255,136,0.3)]"><AipLogo className="text-black w-full h-full" /></div>
            <div>
              <h1 className="text-lg font-black tracking-[0.2em] text-[#00ff88]">AIPCORE</h1>
              <p className="text-[11px] font-black opacity-80 italic uppercase">Alpha Edition</p>
            </div>
        </div>

        <div className="flex-grow space-y-2">
          <SidebarItem id="home" icon={Pickaxe} label="Tap to Earn" />
          <SidebarItem id="mine" icon={TrendingUp} label="Mine Upgrades" />
          <SidebarItem id="friends" icon={Users} label="Team Matrix" />
          <SidebarItem id="earn" icon={Gift} label="Daily Tasks" />
          <SidebarItem id="airdrop" icon={Wallet} label="AIP Stats" />
          {isAdmin && <SidebarItem id="admin" icon={ShieldCheck} label="Admin Terminal" color="text-[#00ff88]" />}
        </div>

        <div className="pt-6 border-t border-white/5">
          {userAddress ? (
            <div className="glass-card p-4 rounded-2xl border-white/5">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[11px] font-black opacity-100 text-[#00ff88] uppercase tracking-widest">Active Wallet</span>
                <div className="w-2 h-2 bg-[#00ff88] rounded-full animate-pulse"></div>
              </div>
              <p className="text-[12px] font-mono opacity-100 text-white truncate font-bold">{userAddress}</p>
            </div>
          ) : (
            <button onClick={handleWalletConnect} className="w-full py-4 bg-white text-black font-black rounded-2xl text-[10px] uppercase tracking-widest active:scale-95 transition-all">Connect Explorer</button>
          )}
        </div>
      </aside>

      {/* 2. Main Center Area */}
      <div className="flex-grow flex flex-col items-center relative overflow-hidden">
        {isWrongNetwork && <div className="absolute top-0 left-0 right-0 z-[100] bg-red-600 text-white text-[10px] font-black p-2 text-center flex items-center justify-center space-x-2 animate-pulse"><ShieldAlert size={12} /><span>WRONG NETWORK. PLEASE SWITCH TO BINANCE SMART CHAIN.</span><button onClick={switchNetwork} className="underline border-white ml-2">SWITCH</button></div>}

        <div className="w-full max-w-xl h-full flex flex-col relative z-20">
          <header className="px-6 pt-8 pb-6 lg:pb-0 flex justify-between items-center lg:hidden">
              <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-[#00ff88] rounded-2xl flex items-center justify-center p-2.5 shadow-[0_0_20px_rgba(0,255,136,0.2)]"><AipLogo className="text-black w-full h-full" /></div>
                  <div className="flex flex-col">{userAddress ? (<><div className="flex items-center space-x-2"><span className="text-[12px] font-black uppercase tracking-widest text-[#00ff88]">{nodeId > 0 ? `NODE #${nodeId}` : 'GUEST'}</span><span className="text-[12px] font-black bg-[#00ff88]/10 px-2 py-0.5 rounded text-[#00ff88]">{bnbBalance} BNB</span></div><span className="text-sm font-mono font-medium opacity-100 text-white">{userAddress.slice(0,6)}...{userAddress.slice(-4)}</span></>) : (<><span className="text-[12px] font-black uppercase tracking-widest text-red-500">Disconnected</span><span className="text-sm font-bold">Anonymous AIPCORE Warrior</span></>)}</div>
              </div>
              <div className="flex items-center space-x-3">{isLoading && <Loader2 className="w-5 h-5 animate-spin text-[#00ff88]" />}<button onClick={userAddress ? handleWalletDisconnect : handleWalletConnect} className="p-3 bg-white/5 rounded-2xl border border-white/5 active:scale-90 transition-transform group relative"><Wallet size={20} className={userAddress ? 'text-[#00ff88]' : 'opacity-100 text-white'} />{userAddress && <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-black rounded-full scale-0 group-hover:scale-100 transition-transform" />}</button></div>
          </header>

          <main className="flex-grow z-10 overflow-hidden main-content-scroll">
            {currentView === 'home' && renderHome()}
            {currentView === 'mine' && renderMine()}
            {currentView === 'friends' && renderFriends()}
            {currentView === 'airdrop' && renderAirdrop()}
            {currentView === 'earn' && renderEarn()}
            {currentView === 'admin' && renderAdmin()}
          </main>

          {/* Mobile Navigation */}
          <nav className="lg:hidden fixed bottom-8 left-6 right-6 h-20 glass-card rounded-[32px] flex items-center justify-around px-2 z-50 shadow-[0_20px_50px_rgba(0,0,0,0.8)] border-white/5">
            <button onClick={() => setCurrentView('home')} className={`nav-item flex flex-col items-center justify-center w-14 h-14 rounded-2xl ${currentView === 'home' ? 'active' : 'opacity-80'}`}><Pickaxe size={22} /><span className="text-[11px] mt-1 font-black uppercase tracking-tighter">Tap</span></button>
            <button onClick={() => setCurrentView('mine')} className={`nav-item flex flex-col items-center justify-center w-14 h-14 rounded-2xl ${currentView === 'mine' ? 'active' : 'opacity-80'}`}><TrendingUp size={22} /><span className="text-[11px] mt-1 font-black uppercase tracking-tighter">Mine</span></button>
            <button onClick={() => setCurrentView('friends')} className={`nav-item flex flex-col items-center justify-center w-14 h-14 rounded-2xl ${currentView === 'friends' ? 'active' : 'opacity-80'}`}><Users size={22} /><span className="text-[11px] mt-1 font-black uppercase tracking-tighter">Team</span></button>
            <button onClick={() => setCurrentView('earn')} className={`nav-item flex flex-col items-center justify-center w-14 h-14 rounded-2xl ${currentView === 'earn' ? 'active' : 'opacity-80'}`}><Gift size={22} /><span className="text-[11px] mt-1 font-black uppercase tracking-tighter">Earn</span></button>
            <button onClick={() => setCurrentView('airdrop')} className={`nav-item flex flex-col items-center justify-center w-14 h-14 rounded-2xl ${currentView === 'airdrop' ? 'active' : 'opacity-80'}`}><Wallet size={22} /><span className="text-[11px] mt-1 font-black uppercase tracking-tighter">Stats</span></button>
          </nav>
        </div>
      </div>

      {/* 3. Right Sidebar (Desktop Only) */}
      <aside className="hidden xl:flex flex-col w-96 h-full border-l border-white/5 bg-black/40 backdrop-blur-xl z-50 p-8 overflow-y-auto no-scrollbar">
          <h2 className="text-xs font-black uppercase tracking-[0.3em] text-[#00ff88] mb-8">Personal Command</h2>
          
          <div className="space-y-6">
              <div className="glass-card p-6 rounded-[32px] border-[#00ff88]/20 bg-gradient-to-br from-[#00ff88]/5 to-transparent">
                  <p className="text-[13px] font-black opacity-100 text-white uppercase tracking-widest mb-1">AIP Balance Pool</p>
                  <div className="flex items-end space-x-2">
                    <span className="text-4xl font-black text-[#00ff88] drop-shadow-[0_0_10px_rgba(0,255,136,0.3)]">{aipCoins.toLocaleString()}</span>
                    <span className="text-sm font-black mb-1 opacity-100 text-white">AIP</span>
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div className="glass-card p-5 rounded-3xl bg-white/[0.04] border border-white/5">
                    <p className="text-[11px] font-black opacity-100 text-[#00ff88] uppercase tracking-widest mb-2 font-bold shadow-sm">Power Supply</p>
                    <div className="flex items-center space-x-2">
                      <Flame size={16} className="text-orange-500" />
                      <span className="text-base font-black text-white">{energy}/1000</span>
                    </div>
                  </div>
                  <div className="glass-card p-5 rounded-3xl bg-white/[0.04] border border-white/5">
                    <p className="text-[11px] font-black opacity-100 text-[#00ff88] uppercase tracking-widest mb-2 font-bold shadow-sm">Total Echoes</p>
                    <div className="flex items-center space-x-2">
                      <Zap size={16} className="text-yellow-400" />
                      <span className="text-base font-black text-white">{totalTaps}</span>
                    </div>
                  </div>
              </div>

              {nodeId > 0 && (
                <div className="glass-card p-6 rounded-[32px] border-white/5">
                    <div className="flex justify-between items-center mb-6">
                       <span className="text-[12px] font-black opacity-100 text-white uppercase tracking-[0.2em]">Matrix Yield Pool</span>
                       <span className="text-[12px] font-black text-[#00ff88] bg-[#00ff88]/10 px-2 py-0.5 rounded-md">TIER {nodeTier}</span>
                    </div>
                   <div className="space-y-3">
                      {matrixData.slice(0, 5).map(lvl => (
                        <div key={lvl.level} className="flex justify-between items-center">
                          <span className="text-[11px] font-black opacity-100 text-white uppercase italic">LVL {lvl.level}</span>
                          <div className="flex-1 mx-4 h-2 bg-white/10 rounded-full overflow-hidden border border-white/5 shadow-inner">
                            <div className="h-full bg-gradient-to-r from-[#00ff88] to-[#00ccff] shadow-[0_0_10px_rgba(0,255,136,0.5)]" style={{ width: `${Math.min(100, (lvl.count / Math.pow(2, lvl.level)) * 100)}%` }}></div>
                          </div>
                          <span className="text-[11px] font-black text-[#00ff88]">{lvl.count} NODES</span>
                        </div>
                      ))}
                   </div>
                </div>
              )}

              <div className="pt-8">
                  <h3 className="text-[12px] font-black opacity-100 text-[#00ff88] uppercase tracking-[0.2em] mb-4">Command Feed</h3>
                  <div className="space-y-3">
                    {incomeHistory.slice(0, 4).map((item, i) => (
                      <div key={i} className="flex justify-between items-center text-[12px] p-4 bg-white/10 rounded-2xl border border-white/10 shadow-lg">
                        <span className="font-black text-white">NODE #{item.nodeId} REWARD</span>
                        <span className="text-[#00ff88] font-black">+{item.amount} BNB</span>
                      </div>
                    ))}
                  </div>
              </div>
          </div>
      </aside>
    </div>
  );
};

export default App;