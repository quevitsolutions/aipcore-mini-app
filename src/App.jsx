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
  Zap,
  Check,
  Trophy
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
  getAppKitModal,
  getTierUSDPrice,
  getPoolViewData,
  getGlobalPoolStats,
  claimPoolRewards,
  registerPoolNode,
  invalidateProviderCache,
  getPendingReward,
  withdrawBNB,
  canUpgradeCheck,
  getGlobalTransparencyData,
  getRewardPoolDiagnostic,
  getOffchainReferralStats
} from './utils/web3';

const BACKEND_URL = import.meta.env.DEV ? 'http://localhost:5000/api' : '/api';


const App = () => {
  // Navigation
  const [currentView, setCurrentView] = useState('home');
  
  // User Mapping Cache (Node ID -> Telegram Username)
  const [userNames, setUserNames] = useState(new Map());

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

  // Telegram Account State
  const [telegramUser, setTelegramUser] = useState(null); // { id, username, first_name }
  const [telegramLinked, setTelegramLinked] = useState(false);
  const [aipRewards, setAipRewards] = useState(() => Number(localStorage.getItem('aipRewards')) || 0);
  const [snapshotData, setSnapshotData] = useState([]);
  const [matrixData, setMatrixData] = useState([]);

  // Tier Display Helper
  const getTierDetails = (tier) => {
    const t = Number(tier);
    if (t === 1) return { name: 'BRONZE', color: '#cd7f32', bg: 'bg-orange-900/20' };
    if (t === 2) return { name: 'SILVER', color: '#c0c0c0', bg: 'bg-slate-400/20' };
    if (t === 3) return { name: 'GOLD', color: '#ffd700', bg: 'bg-yellow-600/20' };
    if (t === 4) return { name: 'PLATINUM', color: '#e5e4e2', bg: 'bg-indigo-300/20' };
    if (t === 5) return { name: 'DIAMOND', color: '#b9f2ff', bg: 'bg-cyan-300/20' };
    return { name: 'GUEST', color: '#ffffff', bg: 'bg-white/10' };
  };

  const tierInfo = getTierDetails(nodeTier);
  const [offchainRefStats, setOffchainRefStats] = useState({ 
    rawInvites: 0, 
    offlineJoined: 0,
    guests: [] 
  });
  const [incomeHistory, setIncomeHistory] = useState([]);
  const [rewardPoolData, setRewardPoolData] = useState(null);
  const [globalPoolStats, setGlobalPoolStats] = useState(null);
  const [exploreView, setExploreView] = useState('overview'); // overview, explorer
  const [explorerType, setExplorerType] = useState('matrix'); // matrix, direct
  const [explorerLevel, setExplorerLevel] = useState(1);
  const [explorerData, setExplorerData] = useState([]);
  const [explorerLoading, setExplorerLoading] = useState(false);
  const [pendingWithdrawal, setPendingWithdrawal] = useState("0.0000");
  const [globalTransparency, setGlobalTransparency] = useState(null);
  const [poolDiagnostic, setPoolDiagnostic] = useState(null);
  const [canUpgradeCurrent, setCanUpgradeCurrent] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState({ coins: [], tiers: [] });
  const [leaderboardTab, setLeaderboardTab] = useState('coins'); // coins, tiers
  const [adminPrice, setAdminPrice] = useState('');
  const [adminAddr, setAdminAddr] = useState({ id: 0, addr: '' });
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
  const [lastBoardFetch, setLastBoardFetch] = useState(0); // Timestamp
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem('aipOnboarded'));
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [activityFeed, setActivityFeed] = useState([]);
  const [backendError, setBackendError] = useState(false);
  const [lastSyncedState, setLastSyncedState] = useState({ coins: 0, taps: 0 });

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

  // Helper: Display Username or Wallet
  const UsernameDisplay = ({ nodeId: targetNodeId, wallet: targetWallet }) => {
    const [name, setName] = useState(userNames.get(targetNodeId));

    useEffect(() => {
      if (name) return;
      if (!targetNodeId || targetNodeId === 0) return;

      fetch(`${BACKEND_URL}/user/node/${targetNodeId}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.username) {
            setUserNames(prev => new Map(prev).set(targetNodeId, data.username));
            setName(data.username);
          }
        })
        .catch(() => {
          // No user found or offline - keep showing wallet
        });
    }, [targetNodeId, targetWallet, name]);

    if (name) return <span className="text-[#00ff88] font-black">{name}</span>;
    return <span className="font-mono text-white/60">{targetWallet.slice(0, 6)}...{targetWallet.slice(-4)}</span>;
  };

  // --- CORE FUNCTIONS (Moved up to avoid TDZ errors) ---
  
  // 1. Sync User Off-chain Data to Backend (includes Telegram identity)
  const syncUserToBackend = useCallback(async (coins, taps, nId, tier, tgUser) => {
    // Only sync if there's an actual change since last success
    if (coins === lastSyncedState.coins && taps === lastSyncedState.taps && !tgUser) return;
    
    // Resolve telegram info from parameter OR state
    const resolvedTg = tgUser || telegramUser;
    const tgId   = resolvedTg?.id       || null;
    const tgName = resolvedTg?.username || resolvedTg?.first_name || null;

    try {
      const res = await fetch(`${BACKEND_URL}/user/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address:     userAddress,
          node_id:     nId,
          coins:       coins,
          taps:        taps,
          node_tier:   tier || 0,
          telegram_id: tgId,
          username:    tgName
        })
      });
      if (res.ok) {
          setLastSyncedState({ coins, taps });
          console.debug("Backend Sync Successful", { tgId, tgName, tier });
      }
    } catch (err) {
      console.error("Sync failed:", err);
    }
  }, [userAddress, lastSyncedState, telegramUser]);

  // 2. Fetch Blockchain Data (Nodes, Tiers, Rewards)
  const handleWithdraw = async () => {
    if (isProcessing) return;
    triggerHaptic('medium');
    setIsProcessing(true);
    try {
      await withdrawBNB();
      await syncBlockchainData(userAddress);
    } catch (err) {
      console.error("Withdrawal failed:", err);
    } finally {
      setIsProcessing(false);
    }
  };

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
          const [data, rewards, matrix, offchain, history, pData, gStats, pReward, transparency, diagnostic, canUpgrade] = await Promise.all([
            getNodeData(id),
            getRewardStats(id),
            getMatrixLevelsData(id),
            getOffchainReferralStats(id),
            getIncomeHistory(id),
            getPoolViewData(id),
            getGlobalPoolStats(),
            getPendingReward(address),
            getGlobalTransparencyData(),
            getRewardPoolDiagnostic(),
            canUpgradeCheck(id, 1)
          ]);
          
          if (data) {
            setNodeTier(data.tier);
            setOnchainStats(data);
          }

          // Sync current state to backend (Tier + Telegram identity included)
          syncUserToBackend(aipCoins, totalTaps, id, data?.tier || 0, telegramUser);

          if (rewards) setRewardStats(rewards);
          if (matrix) setMatrixData(matrix);
          if (offchain) setOffchainRefStats(offchain);
          if (history) setIncomeHistory(history);
          if (pData) setRewardPoolData(pData);
          if (gStats) setGlobalPoolStats(gStats);
          if (pReward) setPendingWithdrawal(pReward);
          if (transparency) setGlobalTransparency(transparency);
          if (diagnostic) setPoolDiagnostic(diagnostic);
          if (canUpgrade !== undefined) setCanUpgradeCurrent(canUpgrade);
        } else {
          setNodeTier(0);
          setOnchainStats(null);
          setRewardStats(null);
          setMatrixData([]);
          setOffchainRefStats({ rawInvites: 0, offlineJoined: 0, guests: [] });
          setIncomeHistory([]);
          setRewardPoolData(null);
        }

    } catch (err) {
      console.error("Blockchain sync failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, [userAddress, aipCoins, totalTaps, syncUserToBackend]);

  // 2. Optimized Periodic Sync (Every 60 Seconds)
  useEffect(() => {
    if (!userAddress || nodeId <= 0) return;

    const syncInterval = setInterval(() => {
      syncUserToBackend(aipCoins, totalTaps, nodeId, nodeTier);
    }, 60000); // 1 Minute

    return () => clearInterval(syncInterval);
  }, [userAddress, nodeId, aipCoins, totalTaps, nodeTier, syncUserToBackend]);

  // 3. Auto-sync on Tab Change
  useEffect(() => {
    if (userAddress && nodeId > 0) {
      syncUserToBackend(aipCoins, totalTaps, nodeId, nodeTier);
    }
  }, [currentView, userAddress, nodeId, syncUserToBackend]); // Trigger on view change

  const fetchLeaderboard = async (force = false) => {
    // Only fetch once every 2 minutes unless forced
    const now = Date.now();
    if (!force && now - lastBoardFetch < 120000) return;
    
    try {
      const res = await fetch(`${BACKEND_URL}/leaderboard`);
      const data = await res.json();
      if (data) {
        setLeaderboardData(data);
        setLastBoardFetch(now);
      }
    } catch (err) {
      console.error("Leaderboard fetch failed:", err);
    }
  };

  const fetchActivity = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/activity`);
      const data = await res.json();
      if (data) {
          setActivityFeed(data);
          setBackendError(false);
      }
    } catch (err) {
      console.error("Activity fetch failed:", err);
      setBackendError(true);
    }
  };

  useEffect(() => {
    fetchActivity();
    const interval = setInterval(fetchActivity, 30000); // Pulse every 30s
    return () => clearInterval(interval);
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

      // Capture and store Telegram user identity
      const tgUser = tg.initDataUnsafe?.user;
      if (tgUser) {
        setTelegramUser(tgUser);
        setTelegramLinked(true);
        // Persist for affiliate link generation
        localStorage.setItem('tgUserId', String(tgUser.id));
        localStorage.setItem('tgUsername', tgUser.username || tgUser.first_name || '');
        console.log("Telegram User Captured:", tgUser.id, tgUser.username);
      } else {
        // Restore from localStorage if available (browser testing)
        const cachedId = localStorage.getItem('tgUserId');
        const cachedName = localStorage.getItem('tgUsername');
        if (cachedId) {
          setTelegramUser({ id: Number(cachedId), username: cachedName });
          setTelegramLinked(true);
        }
      }

      // Capture Referral/Sponsor ID from Telegram start_param
      const startParam = tg.initDataUnsafe?.start_param;
      if (startParam) {
        localStorage.setItem('pendingSponsor', startParam);
        console.log("Captured Referral Sponsor:", startParam);
        
        // Record the Guest Click/Join on Backend
        fetch(`${BACKEND_URL}/referrals/click`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            referrer_id: startParam,
            guest_username: tgUser?.username || tgUser?.first_name || "Guest"
          })
        }).catch(err => console.error("Guest record failed:", err));
      }
    }

    const modal = getAppKitModal();
    const unsubscribe = modal.subscribeAccount(state => {
      invalidateProviderCache();
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
      // Restore any saved off-chain progress from backend
      fetch(`${BACKEND_URL}/user/${userAddress}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.aip_coins) {
            setAipCoins(Number(data.aip_coins));
            setTotalTaps(Number(data.total_taps));
          }
        })
        .catch(() => {});

      // Immediately link Telegram identity to this wallet (if available)
      const tgId = telegramUser?.id || Number(localStorage.getItem('tgUserId'));
      const tgName = telegramUser?.username || telegramUser?.first_name || localStorage.getItem('tgUsername');
      if (tgId) {
        fetch(`${BACKEND_URL}/user/link-telegram`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address: userAddress, telegram_id: tgId, username: tgName })
        }).catch(() => {});
      }
    }
  }, [userAddress, telegramUser]);

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
            syncUserToBackend(currentCoins, currentTaps, nodeId);
            lastSyncedRef.current = { coins: currentCoins, taps: currentTaps };
          }
          return currentTaps;
        });
        return currentCoins;
      });
    }, 30000);

    return () => clearInterval(heartbeat);
  }, [userAddress, syncUserToBackend]);

  // Handle Account & Chain Changes via AppKit
  useEffect(() => {
    const modal = getAppKitModal();
    const unsubscribe = modal.subscribeAccount(state => {
      if (state.isConnected && state.address) {
        if (state.address !== userAddress) {
          setUserAddress(state.address);
          syncBlockchainData(state.address);
        }
      } else if (!state.isConnected && (userAddress || nodeId !== 0)) {
        handleWalletDisconnect();
      }
    });

    const unsubscribeNetwork = modal.subscribeNetwork(state => {
       const chainId = state.caipNetworkId;
       const isBsc = chainId === 'eip155:56';
       setIsWrongNetwork(!isBsc);
    });

    return () => {
      unsubscribe();
      unsubscribeNetwork();
    };
  }, [userAddress, nodeId, syncBlockchainData]);

  // Duplicate Telegram init removed — handled in primary useEffect above

  // 6. Periodic Pool Sync (Global Dividends & Status Update)
  useEffect(() => {
    if (!nodeId || nodeId === 0) return;
    const poolSync = setInterval(async () => {
      try {
        const [pData, gStats] = await Promise.all([
          getPoolViewData(nodeId),
          getGlobalPoolStats()
        ]);
        if (pData) setRewardPoolData(pData);
        if (gStats) setGlobalPoolStats(gStats);
      } catch (e) {
        console.warn("Background pool sync failed:", e);
      }
    }, 60000);
    return () => clearInterval(poolSync);
  }, [nodeId]);

  const renderPool = () => {
    if (!rewardPoolData) {
      return (
        <div className="p-4 pb-24 h-full flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 bg-[#00ff88]/5 rounded-full flex items-center justify-center mb-8 border border-[#00ff88]/10 animate-pulse">
            <Flame className="w-12 h-12 text-[#00ff88] opacity-20" />
          </div>
          <h3 className="text-2xl font-black text-white uppercase mb-3 tracking-tighter">Initializing Pool</h3>
          <p className="text-[10px] opacity-40 uppercase tracking-[0.2em] max-w-[220px] font-bold leading-relaxed">Securely synchronizing your node weight with the global reward protocol...</p>
        </div>
      );
    }

    const { 
      currentPoolId, 
      poolName, 
      claimable, 
      totalEarned, 
      remainingCap, 
      lifetimeCap, 
      isQualifiedForNext, 
      nextPoolId, 
      nfeTier,
      missingRequirements
    } = rewardPoolData;

    const BRONZE_TIER = 6, SILVER_TIER = 10, GOLD_TIER = 14;
    const BRONZE_DIRECT = 2, SILVER_DIRECT = 5, GOLD_DIRECT = 10;
    const BRONZE_TEAM = 62, SILVER_TEAM = 2046, GOLD_TEAM = 32766;

    const userTier    = Number(nfeTier) || nodeTier || 0;
    const userDirects = onchainStats?.directNodes || 0;
    const userTeam    = onchainStats?.totalMatrixNodes || 0;

    const bronzeQualified = userTier >= BRONZE_TIER && userDirects >= BRONZE_DIRECT && userTeam >= BRONZE_TEAM;
    const silverQualified = userTier >= SILVER_TIER && userDirects >= SILVER_DIRECT && userTeam >= SILVER_TEAM;
    const goldQualified   = userTier >= GOLD_TIER   && userDirects >= GOLD_DIRECT   && userTeam >= GOLD_TEAM;

    const getPoolColor = (id) => {
      if (id === 3 || poolName === 'Gold') return '#FFD700';
      if (id === 2 || poolName === 'Silver') return '#C0C0C0';
      return '#CD7F32';
    };
    
    const poolColor = currentPoolId > 0 ? getPoolColor(currentPoolId) : '#00ff88';
    
    const nextPoolName = nextPoolId === 3 ? 'GOLD' : nextPoolId === 2 ? 'SILVER' : 'BRONZE';
    const nextPoolColor = getPoolColor(nextPoolId);

    const capPct = (lifetimeCap && Number(lifetimeCap) > 0)
      ? Math.min(100, Math.max(2, Math.round(((Number(lifetimeCap) - Number(remainingCap)) / Number(lifetimeCap)) * 100)))
      : 0;

    const RequirementRow = ({ label, current, required, missing, isMet }) => (
      <div className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
        <div>
          <p className="text-[10px] font-black opacity-40 uppercase tracking-widest">{label}</p>
          <p className={`text-sm font-black ${isMet ? 'text-[#00ff88]' : 'text-white'}`}>
            {current} <span className="opacity-30 mx-1">/</span> {required}
          </p>
        </div>
        <div className="text-right">
          {isMet ? (
            <div className="w-6 h-6 bg-[#00ff88]/20 rounded-full flex items-center justify-center">
              <Check size={14} className="text-[#00ff88]" />
            </div>
          ) : (
            <div className="px-3 py-1 bg-white/5 rounded-lg border border-white/10">
              <span className="text-[9px] font-black text-white/60 uppercase">-{missing} needed</span>
            </div>
          )}
        </div>
      </div>
    );

    return (
      <div className="p-4 pb-32 h-full overflow-y-auto no-scrollbar relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#00ff88]/5 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

        <div className="flex justify-between items-start mb-8 px-2">
          <div>
            <h2 className="text-4xl font-black text-white tracking-tighter leading-none mb-2">REWARDS</h2>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-[#00ff88] rounded-full animate-pulse"></div>
              <p className="text-[10px] text-[#00ff88] font-black uppercase tracking-[0.2em] italic">Active Protocol v2.5</p>
            </div>
          </div>
          <div className="text-right">
            <div className={`px-4 py-1.5 rounded-2xl border-2 backdrop-blur-xl mb-1 shadow-lg shadow-black/20`} 
                 style={{ borderColor: `${poolColor}40`, backgroundColor: `${poolColor}10` }}>
              <span className="text-[11px] font-black uppercase tracking-widest drop-shadow-sm" style={{ color: poolColor }}>
                {currentPoolId > 0 ? poolName.toUpperCase() : 'NO RANK'}
              </span>
            </div>
            <p className="text-[9px] font-black opacity-30 uppercase tracking-[0.1em]">NODE ID #{nodeId}</p>
          </div>
        </div>

        {currentPoolId > 0 && (
          <div className="glass-card p-8 rounded-[48px] mb-8 border-white/10 bg-gradient-to-br from-white/[0.08] to-transparent shadow-[0_20px_40px_rgba(0,0,0,0.4)] relative overflow-hidden group">
            <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full blur-[80px] opacity-20 transition-all duration-1000 group-hover:scale-125" style={{ backgroundColor: poolColor }} />
            
            <div className="flex justify-between items-end mb-8 relative z-10">
              <div>
                <p className="text-[11px] font-black opacity-40 uppercase tracking-[0.2em] mb-2">Available for Claim</p>
                <div className="flex items-baseline space-x-3">
                  <h4 className="text-5xl font-black text-white tracking-tighter leading-none">{formatBNB(claimable)}</h4>
                  <span className="text-xl font-black text-[#00ff88]">BNB</span>
                </div>
              </div>
              <button
                onClick={handlePoolClaim}
                disabled={isProcessing || Number(claimable) === 0}
                className="w-16 h-16 rounded-3xl flex items-center justify-center shadow-2xl active:scale-90 disabled:opacity-30 disabled:grayscale transition-all"
                style={{ backgroundColor: Number(claimable) > 0 ? poolColor : '#ffffff20' }}
              >
                {isProcessing ? <Loader2 size={24} className="animate-spin text-black" /> : <ArrowUpRight size={28} className={Number(claimable) > 0 ? 'text-black' : 'text-white/20'} />}
              </button>
            </div>

            <div className="space-y-3 relative z-10">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-black opacity-40 uppercase tracking-widest">Yield Evolution</span>
                <span className="text-[10px] font-black text-white bg-white/10 px-3 py-1 rounded-full">{capPct}% CAP REACHED</span>
              </div>
              <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/5 shadow-inner">
                <div
                  className="h-full rounded-full transition-all duration-1000 relative"
                  style={{ width: `${capPct}%`, background: `linear-gradient(90deg, ${poolColor}, #ffffff88)` }}
                >
                  <div className="absolute top-0 right-0 w-2 h-full bg-white opacity-40 animate-pulse"></div>
                </div>
              </div>
              <div className="flex justify-between items-center px-1">
                <span className="text-[9px] opacity-30 font-black uppercase">Earnings: {formatBNB(totalEarned)}</span>
                <span className="text-[9px] opacity-30 font-black uppercase">Limit: {formatBNB(lifetimeCap)}</span>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { id: 1, name: 'BRONZE', color: '#CD7F32', isQualified: bronzeQualified, isActive: currentPoolId === 1 },
            { id: 2, name: 'SILVER', color: '#C0C0C0', isQualified: silverQualified, isActive: currentPoolId === 2 },
            { id: 3, name: 'GOLD', color: '#FFD700', isQualified: goldQualified, isActive: currentPoolId === 3 },
          ].map((item) => (
            <div key={item.name} 
                 className={`glass-card p-4 rounded-[32px] border transition-all duration-500 relative overflow-hidden flex flex-col items-center justify-center ${item.isActive ? 'scale-105 shadow-2xl border-white/40' : 'opacity-40 grayscale border-white/5'}`}
                 style={{ backgroundColor: item.isActive ? `${item.color}20` : undefined, borderColor: item.isActive ? item.color : undefined }}>
              <div className="mb-2 p-2 rounded-xl bg-white/5">
                <Flame size={18} style={{ color: item.isQualified ? item.color : '#ffffff20' }} fill={item.isQualified ? item.color : 'transparent'} />
              </div>
              <p className="text-[8px] font-black tracking-widest mb-1" style={{ color: item.color }}>{item.isQualified ? item.name : 'LOCKED'}</p>
              {item.isActive && <div className="absolute bottom-0 left-0 w-full h-1" style={{ backgroundColor: item.color }}></div>}
            </div>
          ))}
        </div>

        <div className="glass-card p-6 rounded-[40px] mb-8 border-white/5 bg-white/[0.02] backdrop-blur-3xl shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[12px] font-black text-white uppercase tracking-[0.2em] italic">Qualification Roadmap</h3>
            <div className="px-4 py-1.5 rounded-full bg-[#00ff88]/10 border border-[#00ff88]/30">
              <p className="text-[9px] font-black text-[#00ff88] uppercase tracking-tighter">Pool Goal: {nextPoolName}</p>
            </div>
          </div>

          <div className="space-y-4">
            {(() => {
              const reqTier   = nextPoolId === 3 ? GOLD_TIER   : nextPoolId === 2 ? SILVER_TIER   : BRONZE_TIER;
              const reqDirect = nextPoolId === 3 ? GOLD_DIRECT : nextPoolId === 2 ? SILVER_DIRECT : BRONZE_DIRECT;
              const reqTeam   = nextPoolId === 3 ? GOLD_TEAM   : nextPoolId === 2 ? SILVER_TEAM   : BRONZE_TEAM;
              
              const missTier = missingRequirements ? missingRequirements[0] : Math.max(0, reqTier - userTier);
              const missDirect = missingRequirements ? missingRequirements[1] : Math.max(0, reqDirect - userDirects);
              const missTeam = missingRequirements ? missingRequirements[2] : Math.max(0, reqTeam - userTeam);

              return (
                <>
                  <RequirementRow label="NFE Tier Ranking" current={userTier} required={reqTier} missing={missTier} isMet={userTier >= reqTier} />
                  <RequirementRow label="Direct Node Partners" current={userDirects} required={reqDirect} missing={missDirect} isMet={userDirects >= reqDirect} />
                  <RequirementRow label="Global Network Strength" current={userTeam} required={reqTeam} missing={missTeam} isMet={userTeam >= reqTeam} />
                </>
              );
            })()}
          </div>

          <div className="mt-8">
            {currentPoolId === 0 ? (
              <button
                onClick={handlePoolRegister}
                disabled={isProcessing || !bronzeQualified}
                className={`w-full py-5 rounded-[24px] font-black text-sm tracking-widest flex items-center justify-center space-x-3 transition-all ${bronzeQualified ? 'bg-[#00ff88] text-black shadow-[0_10px_30px_rgba(0,255,136,0.2)] active:scale-95' : 'bg-white/5 text-white/20 border border-white/5 grayscale'}`}
              >
                {isProcessing ? <Loader2 className="animate-spin" /> : <span>{bronzeQualified ? 'INITIALIZE BRONZE ENTRY' : 'INSUFFICIENT WEIGHT'}</span>}
              </button>
            ) : nextPoolId > 0 ? (
              <button
                onClick={handlePoolRegister}
                disabled={isProcessing || !isQualifiedForNext}
                className={`w-full py-5 rounded-[24px] font-black text-sm tracking-widest flex items-center justify-center space-x-3 transition-all shadow-2xl ${isQualifiedForNext ? 'text-black active:scale-95' : 'bg-white/5 text-white/20 border border-white/5 grayscale'}`}
                style={{ backgroundColor: isQualifiedForNext ? nextPoolColor : undefined }}
              >
                {isProcessing ? <Loader2 className="animate-spin text-black" /> : <span>{isQualifiedForNext ? `ASCEND TO ${nextPoolName} RANK` : 'ASCENSION LOCKED'}</span>}
              </button>
            ) : (
              <div className="p-6 rounded-[24px] bg-gradient-to-r from-[#FFD700]/20 to-transparent border border-[#FFD700]/40 flex items-center justify-center space-x-4">
                <Zap size={24} className="text-[#FFD700]" strokeWidth={3} />
                <p className="text-sm font-black text-[#FFD700] uppercase tracking-widest">MAXIMUM RANK ACHIEVED</p>
              </div>
            )}
          </div>
        </div>

        {globalPoolStats && (
          <div className="space-y-4">
            <div className="flex justify-between items-center px-2">
              <h3 className="text-[10px] font-black opacity-40 uppercase tracking-[0.2em]">Collective Distribution</h3>
              <div className="w-1.5 h-1.5 bg-[#00ff88] rounded-full"></div>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'BRONZE', count: globalPoolStats.bronzeNodes, color: '#CD7F32' },
                { label: 'SILVER', count: globalPoolStats.silverNodes, color: '#C0C0C0' },
                { label: 'GOLD', count: globalPoolStats.goldNodes, color: '#FFD700' },
              ].map(p => (
                <div key={p.label} className="glass-card p-4 rounded-[28px] border-white/5 bg-black/40 text-center shadow-inner">
                  <p className="text-[8px] font-black opacity-40 mb-1" style={{ color: p.color }}>{p.label}</p>
                  <p className="text-xl font-black text-white">{p.count}</p>
                  <div className="w-4 h-0.5 mx-auto mt-1 rounded-full opacity-30" style={{ backgroundColor: p.color }}></div>
                </div>
              ))}
            </div>

            <div className="glass-card p-6 rounded-[32px] border-white/5 bg-gradient-to-r from-black/40 to-transparent flex justify-between items-center shadow-lg">
              <div>
                <p className="text-[9px] font-black opacity-30 uppercase tracking-widest mb-1">Global Rewards Inflow</p>
                <p className="text-xl font-black text-[#00ff88]">{formatBNB(globalPoolStats.totalReceived)} <span className="text-[10px] opacity-40">BNB</span></p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black opacity-30 uppercase tracking-widest mb-1">Network Outflow</p>
                <p className="text-xl font-black text-white">{formatBNB(globalPoolStats.totalDistributed)} <span className="text-[10px] opacity-40">BNB</span></p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const handleWalletConnect = async () => {
    const modal = getAppKitModal();
    await modal.open();
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

  const handleWalletDisconnect = async () => {
    const modal = getAppKitModal();
    await modal.disconnect();
    setUserAddress(null);
    setBnbBalance("0.0000");
    setNodeId(0);
    setNodeTier(0);
    setOnchainStats(null);
    setRewardStats(null);
    setMatrixData([]);
    setExplorerData([]);
    if (window.Telegram?.WebApp) window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
  };

  const handlePoolRegister = async () => {
    if (!nodeId) return;
    setIsProcessing(true);
    try {
      await registerPoolNode(nodeId);
      await syncBlockchainData(userAddress);
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      }
    } catch (err) {
      console.error("Pool registration failed:", err);
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePoolClaim = async () => {
    if (!nodeId) return;
    setIsProcessing(true);
    try {
      await claimPoolRewards(nodeId);
      await syncBlockchainData(userAddress);
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      }
    } catch (err) {
      console.error("Pool claim failed:", err);
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
      }
    } finally {
      setIsProcessing(false);
    }
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

  const handleInvite = () => {
    if (nodeId === 0) return;
    const shareUrl = `https://t.me/AIPCoreBot?start=${nodeId}`;
    const text = encodeURIComponent(`🚀 Join my AIPCore Matrix and earn real BNB! My Node #${nodeId} (${tierInfo.name}) is live. Activate yours and start mining!`);
    // Copy to clipboard as well for convenience
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).catch(() => {});
    }
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${text}`, '_blank');
  };

  const handleCopyAffiliateLink = () => {
    if (nodeId === 0) return;
    const link = `https://t.me/AIPCoreBot?start=${nodeId}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link)
        .then(() => alert('✅ Affiliate link copied to clipboard!'))
        .catch(() => alert('Link: ' + link));
    } else {
      alert('Link: ' + link);
    }
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


  const [clicks, setClicks] = useState([]);
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

    // Floating text animation
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    setClicks(prev => [...prev, { id, x, y }]);
    setTimeout(() => {
        setClicks(prev => prev.filter(click => click.id !== id));
    }, 1000);
  };

  const renderHome = () => (
    <div className="flex flex-col h-full overflow-hidden relative">
      {/* 1. Live Activity Ticker */}
      <div className="h-10 bg-white/5 backdrop-blur-md border-b border-white/5 flex items-center overflow-hidden z-30 shrink-0">
        <div className="ticker-scroll">
          {backendError ? (
            <span className="text-[10px] font-black uppercase tracking-widest text-red-500/80 animate-pulse px-6 flex items-center">
                <ShieldAlert size={14} className="mr-2" /> Backend Offline: Live Data Temporarily Unavailable
            </span>
          ) : activityFeed.length > 0 ? activityFeed.map((act, i) => (
            <div key={i} className="flex items-center space-x-3 text-[10px] font-black uppercase tracking-widest text-[#00ff88]/80">
              <span className="text-white opacity-40">●</span>
              <span>{act.username || `User #${act.node_id}`}</span> 
              <span className="text-white opacity-40">Reached Tier</span> 
              <span className="text-white">{getTierDetails(act.tier).name}</span>
              <span className="text-white opacity-40">with</span>
              <span className="text-white">{Math.floor(act.coins / 1000)}K</span>
              <span className="text-white opacity-40">Coins</span>
            </div>
          )) : (
            <span className="text-[10px] font-black uppercase tracking-widest text-[#00ff88]/40 animate-pulse px-6">Initializing Platform Command Feed... Matrix Active.</span>
          )}
        </div>
      </div>

      {/* 2. Dashboard HUD (Top) */}
      <div className="px-5 pt-3 z-20">
          <div className="glass-card p-3 rounded-2xl flex justify-between items-center border border-white/10 bg-white/[0.03]">
              <div className="text-center w-1/3 border-r border-white/10">
                  <p className="text-[9px] font-black uppercase text-[#00ff88]/60 tracking-widest mb-0.5">Earned (BNB)</p>
                  <p className="text-[14px] font-black text-[#00ff88]">{rewardStats ? rewardStats.total : '0.0000'}</p>
              </div>
              <div className="text-center w-1/3 border-r border-white/10">
                  <p className="text-[9px] font-black uppercase text-white/50 tracking-widest mb-0.5">18-Lvl Team</p>
                  <p className="text-[14px] font-black text-white">{onchainStats ? onchainStats.totalMatrixNodes : '0'}</p>
              </div>
              <div className="text-center w-1/4 border-r border-white/10">
                  <p className="text-[9px] font-black uppercase text-white/50 tracking-widest mb-0.5">Level</p>
                  <p className="text-[12px] font-black" style={{ color: tierInfo.color }}>{tierInfo.name}</p>
              </div>
              <div className="text-center w-1/4">
                  <p className="text-[9px] font-black uppercase text-white/50 tracking-widest mb-0.5">Node ID</p>
                  <p className="text-[14px] font-black text-white">{nodeId > 0 ? `#${nodeId}` : 'NONE'}</p>
              </div>
          </div>
      </div>

      {/* 2. Massive Coin Balance (Top Center) */}
      <div className="mt-6 flex flex-col items-center justify-center z-20">
          <div className="flex items-center space-x-3 mb-2">
              <img src={dollarCoin} alt="AIP" className="w-10 h-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" />
              <span className="text-5xl font-black text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">{aipCoins.toLocaleString()}</span>
          </div>
          <div className="flex items-center space-x-2 px-3 py-1 bg-white/10 rounded-full">
              <span className="text-[10px] font-black text-[#00ff88] uppercase tracking-widest flex items-center"><Pickaxe size={12} className="mr-1"/> +{tapValue} per tap</span>
          </div>
      </div>

      {/* 3. The Hook / Tap Character (Center) */}
      <div className="flex-grow flex flex-col items-center justify-center relative select-none z-10 mt-2">
        <div 
          className="click-card relative w-64 h-64 rounded-full flex items-center justify-center cursor-pointer overflow-hidden shadow-[0_0_50px_rgba(0,255,136,0.15)] bg-gradient-to-br from-[#00ff88]/5 to-transparent border-4 border-[#00ff88]/20"
          onClick={handleTap}
        >
          <img src={mainCharacter} alt="AIP Warrior" className="w-48 h-48 pointer-events-none transform active:scale-95 transition-transform" />
          
          {clicks.map((click) => (
            <div
              key={click.id}
              className="absolute text-5xl font-black text-white pointer-events-none fade-out-up z-50 drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]"
              style={{ left: click.x, top: click.y, transform: `translate(-50%, -50%)` }}
            >
              +{tapValue}
            </div>
          ))}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeOutUp {
          0% { opacity: 1; transform: translate(-50%, -50%) translateY(0) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -50%) translateY(-100px) scale(1.5); }
        }
        .fade-out-up {
          animation: fadeOutUp 1s ease-out forwards;
        }
      `}} />

      {/* 4. Telegram Flow / Strong CTAs (Lower Third) */}
      <div className="px-6 flex flex-col space-y-3 z-20 mb-6">
        {nodeId === 0 ? (
            <button 
                onClick={() => setCurrentView('mine')} 
                className="w-full py-4 text-center rounded-2xl font-black text-[13px] tracking-wide relative overflow-hidden group shadow-[0_0_20px_rgba(0,255,136,0.3)] bg-gradient-to-r from-[#00ff88] to-[#00ccff] text-black active:scale-[0.98] transition-transform"
            >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform"/>
                <span className="flex items-center justify-center space-x-2">
                    <TrendingUp size={18} />
                    <span>🚀 ACTIVATE NODE (UNLOCK INCOME)</span>
                </span>
            </button>
        ) : (
            <button 
                onClick={handleInvite} 
                className="w-full py-4 text-center rounded-2xl font-black text-[13px] tracking-wide border border-[#00ff88]/40 bg-[#00ff88]/10 text-[#00ff88] flex items-center justify-center space-x-2 active:scale-[0.98] transition-transform backdrop-blur-md"
            >
                <Share2 size={18} />
                <span>INVITE FRIENDS & EARN</span>
            </button>
        )}
      </div>

      {/* 5. Energy Bar (Absolute Bottom) */}
      <div className="px-6 pb-24 z-20">
        <div className="flex justify-between items-end mb-2">
          <div className="flex items-center space-x-2">
            <Flame className="w-6 h-6 text-orange-500 fill-orange-500" />
            <span className="text-lg font-black text-white">{energy} <span className="text-sm opacity-50">/ {maxEnergy}</span></span>
          </div>
          <span className="text-[12px] font-black text-[#00ff88] uppercase tracking-widest flex items-center space-x-1"><SettingsIcon size={12}/> <span>Lvl {nodeTier}</span></span>
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
        <div className="glass-card p-8 rounded-[40px] text-center border-2 border-[#00ff88]/50 bg-gradient-to-br from-[#00ff88]/10 to-transparent shadow-[0_0_50px_rgba(0,255,136,0.15)] relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#00ff88] rounded-full mix-blend-overlay filter blur-3xl opacity-50 animate-pulse"></div>
            
            <div className="mx-auto w-24 h-24 bg-black/50 rounded-full flex items-center justify-center border-4 border-[#00ff88]/30 mb-6 relative">
              <div className="absolute inset-0 rounded-full border-2 border-[#00ff88] border-dashed animate-[spin_10s_linear_infinite]"></div>
              <Wallet className="w-10 h-10 text-[#00ff88]" />
            </div>

            <div className="inline-block px-4 py-1.5 bg-red-500/20 border border-red-500/50 rounded-full mb-4 shadow-[0_0_15px_rgba(239,68,68,0.4)]">
              <span className="text-[10px] font-black text-red-500 tracking-widest uppercase flex items-center space-x-2"><ShieldAlert size={12} /><span>EARNINGS LOCKED</span></span>
            </div>
            
            <h3 className="text-3xl font-black mb-3 text-white uppercase drop-shadow-md tracking-tighter">Unlock BNB Yield</h3>
            
            <div className="space-y-3 mb-8 text-left mt-6 bg-black/40 p-5 rounded-3xl border border-white/5 backdrop-blur-sm">
                <div className="flex items-center space-x-3 text-sm">
                   <div className="w-6 h-6 bg-[#00ff88]/20 rounded-full flex items-center justify-center flex-shrink-0"><Check size={12} className="text-[#00ff88]"/></div>
                   <span className="font-bold opacity-90 text-[13px]">Build an 18-Level Network</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                   <div className="w-6 h-6 bg-[#00ff88]/20 rounded-full flex items-center justify-center flex-shrink-0"><Check size={12} className="text-[#00ff88]"/></div>
                   <span className="font-bold opacity-90 text-[13px]">Earn Real BNB Automatically</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                   <div className="w-6 h-6 bg-[#00ff88]/20 rounded-full flex items-center justify-center flex-shrink-0"><Check size={12} className="text-[#00ff88]"/></div>
                   <span className="font-bold opacity-90 text-[13px]">Unlock Referral Match Rewards</span>
                </div>
            </div>

            <button 
                onClick={() => { triggerHaptic('medium'); handleCreateNode(); }}
                disabled={isProcessing}
                className="w-full py-5 bg-gradient-to-r from-[#00ff88] to-[#00ccff] text-black font-black text-[15px] tracking-wide rounded-2xl flex items-center justify-center space-x-3 active:scale-95 disabled:opacity-50 shadow-[0_0_20px_rgba(0,255,136,0.4)] transition-all"
            >
                {isProcessing ? <Loader2 className="animate-spin" /> : <><span>🚀 ACTIVATE NODE NOW ($5)</span></>}
            </button>
            
            <p className="mt-5 text-[10px] opacity-40 font-black uppercase tracking-widest">Powered by Verified Smart Contract</p>
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
                    onClick={() => { triggerHaptic('medium'); handleUpgradeTier(); }}
                    disabled={isProcessing || nodeTier >= 18}
                    className={`w-full py-4 font-black text-md rounded-2xl active:scale-95 disabled:opacity-50 transition-all flex flex-col items-center justify-center relative overflow-hidden ${canUpgradeCurrent ? 'bg-[#00ff88] text-black shadow-[0_10px_30px_rgba(0,255,136,0.2)]' : 'bg-white/10 text-white/40 border border-white/10'}`}
                >
                    {isProcessing ? (
                        <Loader2 className="animate-spin" />
                    ) : (
                        <>
                            <div className="flex items-center space-x-2">
                                {canUpgradeCurrent ? <ShieldCheck size={18} /> : <ShieldAlert size={18} className="text-red-500/60" />}
                                <span>{canUpgradeCurrent ? 'UPGRADE TIER NOW' : 'LOCKED: REQS NOT MET'}</span>
                            </div>
                            <div className="flex flex-col items-center mt-1">
                                {tierCosts[nodeTier] && (
                                    <span className="text-[10px] font-black tracking-widest uppercase opacity-70">
                                        COST: {Number(formatBNB(tierCosts[nodeTier])).toFixed(3)} BNB (~${getTierUSDPrice(nodeTier)})
                                    </span>
                                )}
                                <span className={`text-[9px] font-black uppercase tracking-tighter mt-1 italic ${canUpgradeCurrent ? 'text-black/60' : 'text-red-500/60'}`}>
                                    {canUpgradeCurrent ? `Unlocks Reward Layer ${nodeTier + 1}` : 'Check Requirements Below'}
                                </span>
                            </div>
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
        <div className="space-y-6">

            {/* Telegram Account Status + Affiliate Link Panel */}
            <div className={`glass-card p-5 rounded-3xl border transition-all ${
              telegramLinked ? 'border-[#00ff88]/30 bg-[#00ff88]/5' : 'border-yellow-500/30 bg-yellow-500/5'
            }`}>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    telegramLinked ? 'bg-[#00ff88]/20' : 'bg-yellow-500/20'
                  }`}>
                    <Users size={16} className={telegramLinked ? 'text-[#00ff88]' : 'text-yellow-500'} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Telegram Account</p>
                    {telegramLinked && telegramUser ? (
                      <p className="text-sm font-black text-[#00ff88]">
                        @{telegramUser.username || telegramUser.first_name} · ID {telegramUser.id}
                      </p>
                    ) : (
                      <p className="text-xs font-black text-yellow-500">Open in Telegram to link</p>
                    )}
                  </div>
                </div>
                <div className={`w-2.5 h-2.5 rounded-full ${
                  telegramLinked ? 'bg-[#00ff88] animate-pulse' : 'bg-yellow-500'
                }`} />
              </div>

              {nodeId > 0 ? (
                <div className="space-y-3">
                  <div className="p-3 bg-black/30 rounded-2xl border border-white/5 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-white/60 truncate flex-1">t.me/AIPCoreBot?start={nodeId}</span>
                    <button
                      onClick={handleCopyAffiliateLink}
                      className="ml-3 p-2 bg-[#00ff88]/20 rounded-xl transition-all active:scale-90"
                    >
                      <Copy size={14} className="text-[#00ff88]" />
                    </button>
                  </div>
                  <button
                    onClick={handleInvite}
                    className="w-full py-4 bg-white text-black font-black rounded-2xl flex items-center justify-center space-x-3 active:scale-[0.98] transition-transform shadow-xl text-[13px]"
                  >
                    <Share2 size={18} />
                    <span>SHARE AFFILIATE LINK</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setCurrentView('mine')}
                  className="w-full py-4 bg-red-500/10 text-red-500 border border-red-500/20 font-black rounded-2xl flex items-center justify-center space-x-2 text-[12px] uppercase tracking-widest"
                >
                  <ShieldAlert size={16} />
                  <span>Activate Node to Generate Link</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="glass-card p-5 rounded-3xl border-white/20"><p className="text-[12px] opacity-100 font-black text-white uppercase mb-1">Directs</p><p className="text-4xl font-black text-[#00ff88]">{onchainStats?.directNodes || 0}</p></div>
                <div className="glass-card p-5 rounded-3xl border-white/20"><p className="text-[12px] opacity-100 font-black text-white uppercase mb-1">Matrix</p><p className="text-4xl font-black text-[#00ff88]">{onchainStats?.totalMatrixNodes || 0}</p></div>
                <div className="glass-card p-5 rounded-3xl border-dashed border-white/40"><p className="text-[12px] opacity-100 font-black text-white uppercase mb-1">Total Invites</p><div className="flex items-baseline space-x-2"><p className="text-4xl font-black text-[#00ff88]">{offchainRefStats.rawInvites || 0}</p><span className="text-[10px] font-black text-orange-500 italic uppercase">Clicks</span></div></div>
                <div className="glass-card p-5 rounded-3xl border-dashed border-white/40"><p className="text-[12px] opacity-100 font-black text-white uppercase mb-1">Guest Joins</p><div className="flex items-baseline space-x-2"><p className="text-4xl font-black text-[#00ff88]">{offchainRefStats.offlineJoined || 0}</p><span className="text-[10px] font-black text-blue-400 italic uppercase">Users</span></div></div>
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
                            <div key={node.nodeId} className="glass-card p-4 rounded-3xl border border-white/5 bg-white/[0.01] flex justify-between items-center relative overflow-hidden group"><div className={`absolute top-0 left-0 w-1 h-full opacity-40 ${isDirect ? 'bg-[#00ff88]' : isSpillover ? 'bg-purple-500' : 'bg-blue-400'}`} /><div className="flex items-center space-x-4"><div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 font-black text-xs">ID {node.nodeId}</div><div><div className="flex items-center space-x-2">
                                <UsernameDisplay nodeId={node.nodeId} wallet={node.wallet} />
                                {explorerType === 'matrix' && <span className={`text-[7px] px-1.5 py-0.5 rounded-sm font-black uppercase tracking-tighter ${isDirect ? 'bg-[#00ff88] text-black' : isSpillover ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-400/20 text-blue-400'}`}>{isDirect ? 'Direct' : isSpillover ? 'Spillover' : 'Team'}</span>}</div><div className="flex items-center space-x-2 mt-1"><span className="text-[9px] px-2 py-0.5 rounded bg-white/5 text-white/40 font-black">SPONSOR {node.sponsor}</span><span className="text-[9px] px-2 py-0.5 rounded bg-[#00ff88]/20 text-[#00ff88] font-black">TIER {node.tier}</span></div></div></div><a href={`https://bscscan.com/address/${node.wallet}`} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-[#00ff88]/20 transition-colors"><ArrowUpRight size={14} className="opacity-40" /></a></div>
                        );
                    }) : <div className="py-20 text-center opacity-30"><p className="text-xs font-black uppercase tracking-widest">No Nodes Found</p></div>}</div>
                </div>
            )}
        </div>










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

  const renderAdmin = () => {
    if (!isAdmin) return <div className="p-8 text-center"><p className="text-red-500 font-black">ACCESS DENIED: OWNER ONLY</p></div>;

    const handleUpdatePrice = async () => {
        if (!adminPrice) return;
        setIsProcessing(true);
        triggerHaptic('medium');
        try {
            const tx = await manualUpdatePrice(adminPrice);
            if (tx) alert("Price update successful!");
        } catch (e) { console.error(e); }
        finally { setIsProcessing(false); }
    };

    const handleExecuteRewardPool = async () => {
        setIsProcessing(true);
        triggerHaptic('warning');
        try {
            const tx = await executeRewardPool();
            if (tx) alert("Reward Pool Distribution Executed!");
        } catch (e) { console.error(e); }
        finally { setIsProcessing(false); }
    };

    return (
        <div className="p-6 pb-24 h-full overflow-y-auto space-y-6">
            <h2 className="text-3xl font-black text-[#00ff88] uppercase tracking-tighter">ADMIN TERMINAL</h2>
            
            <div className="glass-card p-6 rounded-3xl border-[#00ff88]/30 bg-[#00ff88]/5">
                <p className="text-[10px] font-black text-[#00ff88] uppercase tracking-widest mb-4">Oracle Management</p>
                <div className="flex space-x-3">
                    <input 
                        type="number" 
                        placeholder="New BNB Price (USD)" 
                        value={adminPrice} 
                        onChange={(e) => setAdminPrice(e.target.value)}
                        className="flex-grow bg-black/40 border border-white/10 rounded-2xl px-4 text-white text-sm font-bold focus:border-[#00ff88] outline-none"
                    />
                    <button 
                        onClick={handleUpdatePrice}
                        disabled={isProcessing}
                        className="px-6 py-4 bg-[#00ff88] text-black font-black rounded-2xl text-[10px] uppercase active:scale-95 disabled:opacity-50"
                    >
                        UPDATE
                    </button>
                </div>
            </div>

            <div className="glass-card p-6 rounded-3xl border-white/10 bg-white/5">
                <p className="text-[10px] font-black opacity-40 uppercase tracking-widest mb-4">System Configurations</p>
                <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-black/20 rounded-2xl border border-white/5">
                        <span className="text-[10px] font-black opacity-60">CONTRACT OWNER</span>
                        <span className="text-[10px] font-mono text-[#00ff88]">{userAddress?.slice(0,10)}...</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-black/20 rounded-2xl border border-white/5">
                        <span className="text-[10px] font-black opacity-60">DB STATUS</span>
                        <span className="text-[10px] font-black text-[#00ff88]">CONNECTED (V2)</span>
                    </div>
                </div>
            </div>

            {poolDiagnostic && (
                <div className="glass-card p-6 rounded-3xl border-yellow-500/20 bg-yellow-500/5">
                    <p className="text-[10px] font-black text-yellow-500 uppercase tracking-widest mb-4">Reward Pool Health</p>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-black/40 rounded-xl border border-white/5">
                            <p className="text-[9px] opacity-40 mb-1">POOL BALANCE</p>
                            <p className="text-sm font-black">{poolDiagnostic.balance} BNB</p>
                        </div>
                        <div className="text-center p-3 bg-black/40 rounded-xl border border-white/5">
                            <p className="text-[9px] opacity-40 mb-1">TOTAL SHARES</p>
                            <p className="text-sm font-black">{poolDiagnostic.totalShares || '0'}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
  };

  const renderLeaderboard = () => (
    <div className="p-4 pb-24 h-full overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter">LEADERBOARD</h2>
            <div className="flex bg-white/10 p-1 rounded-xl">
                <button 
                    onClick={() => setLeaderboardTab('coins')}
                    className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all ${leaderboardTab === 'coins' ? 'bg-[#00ff88] text-black shadow-lg shadow-[#00ff88]/30' : 'text-white opacity-40'}`}
                >
                    COINS
                </button>
                <button 
                    onClick={() => setLeaderboardTab('tiers')}
                    className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all ${leaderboardTab === 'tiers' ? 'bg-[#00ff88] text-black shadow-lg shadow-[#00ff88]/30' : 'text-white opacity-40'}`}
                >
                    TIERS
                </button>
            </div>
        </div>

        <div className="space-y-3">
            {(leaderboardTab === 'coins' ? leaderboardData.coins : leaderboardData.tiers).map((entry, index) => {
                const isTop3 = index < 3;
                const colors = ['#FFD700', '#C0C0C0', '#CD7F32']; // Gold, Silver, Bronze
                return (
                    <div 
                        key={index} 
                        className={`glass-card p-4 rounded-3xl flex justify-between items-center border transition-all ${isTop3 ? 'bg-gradient-to-r from-white/[0.05] to-transparent border-white/20' : 'border-white/5 bg-white/[0.01]'}`}
                    >
                        <div className="flex items-center space-x-4">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${isTop3 ? '' : 'bg-white/5 text-white/30'}`} style={isTop3 ? { backgroundColor: colors[index], color: 'black' } : {}}>
                                {index + 1}
                            </div>
                            <div>
                                <p className="text-sm font-black text-white uppercase">{entry.username || `User #${entry.node_id}`}</p>
                                <p className="text-[10px] font-black text-[#00ff88] uppercase tracking-widest opacity-60">ID {entry.node_id} • TIER {entry.tier || entry.score || 0}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-black text-white">{entry.score.toLocaleString()}</p>
                            <p className="text-[9px] font-black opacity-30 uppercase tracking-tighter">{leaderboardTab === 'coins' ? 'AIP COINS' : 'NODE TIER'}</p>
                        </div>
                    </div>
                );
            })}
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
                   <span className="px-4 py-1.5 bg-[#00ff88]/10 rounded-full text-[12px] font-black tracking-widest text-[#00ff88] uppercase border border-[#00ff88]/20 shadow-inner">Global Core Stats</span>
                   <TrendingUp className="w-6 h-6 text-[#00ff88]" />
                 </div>
                 <div className="grid grid-cols-2 gap-6">
                   <div className="p-4 bg-white/5 rounded-3xl border border-white/5">
                     <p className="text-[12px] font-black opacity-100 text-[#00ff88] uppercase mb-1 tracking-widest">Total Nodes</p>
                     <p className="text-3xl font-black text-white">{globalTransparency ? globalTransparency.totalNodes.toLocaleString() : '...'}</p>
                   </div>
                   <div className="p-4 bg-white/5 rounded-3xl border border-white/5">
                     <p className="text-[12px] font-black opacity-100 text-[#00ff88] uppercase mb-1 tracking-widest">BNB Distributed</p>
                     <p className="text-xl font-black text-white">{globalTransparency ? globalTransparency.totalBNBDistributed : '...'}</p>
                   </div>
                 </div>
               </div>

               {Number(pendingWithdrawal) > 0 && (
                   <div className="p-6 glass-card rounded-3xl border border-yellow-500/30 bg-yellow-500/5 backdrop-blur-xl animate-pulse">
                       <div className="flex justify-between items-center">
                           <div>
                               <p className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">Withdrawable Rewards</p>
                               <p className="text-2xl font-black text-white">{pendingWithdrawal} <span className="text-xs opacity-50">BNB</span></p>
                           </div>
                           <button 
                               onClick={handleWithdraw}
                               disabled={isProcessing}
                               className="px-8 py-3 bg-yellow-500 text-black font-black rounded-2xl text-[12px] uppercase shadow-[0_0_20px_rgba(234,179,8,0.4)] active:scale-95 transition-all"
                           >
                               {isProcessing ? 'PROCESSING...' : 'WITHDRAW NOW'}
                           </button>
                       </div>
                   </div>
               )}

               <div className="p-6 glass-card rounded-3xl border border-[#00ff88]/10 bg-[#00ff88]/[0.02]"><div className="flex justify-between items-center mb-4"><div><p className="text-[10px] font-black opacity-40 uppercase tracking-widest">Reward Potential</p><p className="text-2xl font-black text-[#00ff88]">{aipRewards.toLocaleString()} <span className="text-xs opacity-50">AIP</span></p></div><button onClick={handleConvertCoins} className="px-6 py-3 bg-white text-black font-black rounded-2xl text-[10px] uppercase active:scale-95 transition-transform flex items-center space-x-2"><Zap size={14} /><span>Convert Coins</span></button></div><p className="text-[9px] opacity-30 italic">* 1,000 AipCoins = 1 AIP Reward Unit</p></div>
               <div className={`glass-card p-6 rounded-3xl border-l-4 ${nodeId > 0 ? 'border-[#00ff88]' : 'border-red-500'}`}><p className="text-[10px] font-black opacity-30 uppercase tracking-widest mb-2">Conversion Status</p><div className="flex justify-between items-center"><span className="text-xl font-black">{nodeId > 0 ? 'CONVERTED NODE' : 'PENDING ACTIVATION'}</span>{nodeId === 0 && <button onClick={() => setCurrentView('mine')} className="text-[10px] font-black bg-red-500/10 text-red-500 px-3 py-1 rounded-full border border-red-500/20">ACTIVATE NOW</button>}</div></div>
               {nodeId > 0 && rewardStats && (
                   <div className="glass-card p-6 rounded-3xl border-2 border-[#00ff88]/20 bg-[#00ff88]/[0.02] shadow-[0_0_30px_rgba(0,255,136,0.05)]"><div className="flex justify-between items-center mb-6"><span className="px-3 py-1 bg-[#00ff88]/10 text-[#00ff88] rounded-full text-[10px] font-black tracking-widest">REAL ON-CHAIN DATA</span><div className="flex items-center space-x-1 text-[#00ff88]"><span className="text-2xl font-black">{rewardStats.total}</span><span className="text-xs font-bold opacity-60">BNB</span></div></div><div className="space-y-3 pt-6 border-t border-white/5 text-xs font-medium"><div className="flex justify-between"><span className="opacity-40">Referral Rewards</span><span className="font-mono text-[#00ff88]">+{rewardStats.referral}</span></div><div className="flex justify-between"><span className="opacity-40">Direct Rewards</span><span className="font-mono text-[#00ff88]">+{rewardStats.direct}</span></div><div className="flex justify-between"><span className="opacity-40">Layer Rewards</span><span className="font-mono text-[#00ff88]">+{rewardStats.tier}</span></div><div className="flex justify-between"><span className="opacity-40">Matrix Rewards</span><span className="font-mono text-[#00ff88]">+{rewardStats.binary}</span></div><div className="flex justify-between"><span className="opacity-40">Pool Rewards</span><span className="font-mono text-[#00ff88]">+{rewardStats.pool}</span></div><div className="flex justify-between pt-2 text-red-500/60"><span className="opacity-60">Missed Rewards (Lost)</span><span className="font-mono">-{rewardStats.lost}</span></div><div className="flex justify-between pt-3 mt-3 border-t border-white/5 opacity-40 italic"><span>Total Node Contribution</span><span>{onchainStats?.totalContribution || '0'} BNB</span></div></div></div>
               )}
               {incomeHistory.length > 0 && (
                   <div className="mt-8"><div className="flex justify-between items-center mb-4"><h3 className="text-[10px] font-black text-[#00ff88] uppercase tracking-widest flex items-center space-x-2"><TrendingUp size={14} /><span>Recent Operations</span></h3><button onClick={() => syncBlockchainData(userAddress)} className="text-[10px] font-black opacity-30 hover:opacity-100 transition-opacity">REFRESH</button></div><div className="space-y-3">{incomeHistory.map((item, i) => { const labels = ["NONE", "REFERRAL", "LAYER", "MATRIX", "DIRECT", "POOL", "MISSED"]; const colors = ["text-white bg-white/10", "text-blue-400 bg-blue-400/10", "text-orange-400 bg-orange-400/10", "text-[#00ff88] bg-[#00ff88]/10", "text-purple-400 bg-purple-400/10", "text-pink-400 bg-pink-400/10", "text-red-500 bg-red-500/10"]; const typeLabel = labels[item.rewardType] || "REWARD"; const typeColor = colors[item.rewardType] || "text-white bg-white/10"; const date = new Date(item.time * 1000).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); return (<div key={i} className="glass-card p-4 rounded-3xl flex justify-between items-center border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-colors"><div className="flex items-center space-x-4"><div className={`px-2.5 py-1 rounded-lg text-[8px] font-black tracking-widest ${typeColor}`}>{typeLabel}</div><div><p className="text-[11px] font-black">+{item.amount} BNB</p><p className="text-[9px] opacity-30 font-medium uppercase">{date}</p></div></div><div className="text-right"><p className="text-[9px] font-black opacity-40 italic">Tier {item.tier}</p><p className="text-[8px] opacity-20 font-medium uppercase tracking-tighter">L{item.layer}</p></div></div>); })}</div></div>
               )}
               <div className="pt-8 opacity-40"><button onClick={handleHardReset} className="w-full py-4 border border-red-500/20 text-red-500 text-[10px] font-black tracking-widest uppercase rounded-2xl active:scale-95 transition-all">Emergency Data Reset</button></div>
          </div>
      )}
    </div>
  );

  const triggerHaptic = (type = 'light') => {
    if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred(type);
    }
  };

  const SidebarItem = ({ id, icon, label, color }) => {
    const Icon = icon;
    return (
      <button 
        onClick={() => { triggerHaptic(); setCurrentView(id); if (id === 'leaderboard') fetchLeaderboard(); }} 
        className={`sidebar-item w-full flex items-center space-x-3 px-6 py-4 rounded-2xl ${currentView === id ? 'active' : 'opacity-100 font-bold'}`}
      >
        <Icon size={20} className={color || 'text-white'} />
        <span className="text-[13px] font-black uppercase tracking-widest">{label}</span>
      </button>
    );
  };

  const renderOnboarding = () => {
    const slides = [
      { 
        title: "MINE", 
        desc: "Tap the core to generate AIP Energy and mine off-chain coins.", 
        icon: <Pickaxe size={64} className="text-[#00ff88]" />,
        accent: "bg-[#00ff88]/20"
      },
      { 
        title: "CONNECT", 
        desc: "Link your Web3 wallet to activate your node status on the blockchain.", 
        icon: <Wallet size={64} className="text-blue-400" />,
        accent: "bg-blue-400/20"
      },
      { 
        title: "EARN", 
        desc: "Launch your node and earn automated BNB rewards from the matrix ecosystem.", 
        icon: <Flame size={64} className="text-orange-500" />,
        accent: "bg-orange-500/20"
      }
    ];

    const currentSlide = slides[onboardingStep];

    const handleNext = () => {
      triggerHaptic();
      if (onboardingStep < slides.length - 1) {
        setOnboardingStep(onboardingStep + 1);
      } else {
        localStorage.setItem('aipOnboarded', 'true');
        setShowOnboarding(false);
      }
    };

    return (
      <div className="fixed inset-0 onboarding-overlay flex flex-col items-center justify-center p-8 text-center">
        <div className={`w-32 h-32 rounded-full ${currentSlide.accent} flex items-center justify-center mb-8 animate-pulse`}>
          {currentSlide.icon}
        </div>
        <h2 className="text-5xl font-black text-white uppercase tracking-tighter mb-4">{currentSlide.title}</h2>
        <p className="text-lg font-black text-white/60 uppercase tracking-widest leading-tight max-w-xs">{currentSlide.desc}</p>
        
        <div className="flex space-x-2 mt-12 mb-12">
            {slides.map((_, i) => (
              <div key={i} className={`onboarding-dot ${i === onboardingStep ? 'active' : ''}`} />
            ))}
        </div>

        <button 
          onClick={handleNext}
          className="w-full max-w-xs py-5 bg-white text-black font-black rounded-3xl text-sm uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all"
        >
          {onboardingStep === slides.length - 1 ? 'LAUNCH DASHBOARD' : 'CONTINUE'}
        </button>
      </div>
    );
  };

  return (
    <div className="h-screen w-full relative flex lg:flex-row bg-black antialiased font-['Outfit'] overflow-hidden">
      {showOnboarding && renderOnboarding()}
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
          <SidebarItem id="pool" icon={Flame} label="Reward Pool" />
          <SidebarItem id="friends" icon={Users} label="Team Matrix" />
          <SidebarItem id="leaderboard" icon={Trophy} label="Leaders" />
          <SidebarItem id="earn" icon={Gift} label="Daily Tasks" />
          <SidebarItem id="airdrop" icon={Wallet} label="AIP Stats" />
          {isAdmin && <SidebarItem id="admin" icon={ShieldCheck} label="Admin Terminal" color="text-[#00ff88]" />}
        </div>

        <div className="pt-6 border-t border-white/5">
          {userAddress ? (
            <div className="glass-card p-4 rounded-2xl border-white/5 group relative overflow-hidden">
              <div className="flex justify-between items-center mb-2 relative z-10 transition-transform duration-300 group-hover:-translate-y-8">
                <span className="text-[11px] font-black opacity-100 text-[#00ff88] uppercase tracking-widest">Active Wallet</span>
                <div className="w-2 h-2 bg-[#00ff88] rounded-full animate-pulse"></div>
              </div>
              <p className="text-[12px] font-mono opacity-100 text-white truncate font-bold relative z-10 transition-transform duration-300 group-hover:-translate-y-8">{userAddress}</p>
              
              <div className="absolute inset-x-0 bottom-0 top-0 flex items-center justify-center translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-red-600/20 backdrop-blur-md z-20">
                <button onClick={handleWalletDisconnect} className="w-full h-full text-red-500 font-black text-[11px] uppercase tracking-widest hover:text-white transition-colors">
                  Disconnect
                </button>
              </div>
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
                  <div className="flex flex-col">{userAddress ? (<><div className="flex items-center space-x-2"><span className="text-[12px] font-black uppercase tracking-widest text-[#00ff88]">{nodeId > 0 ? `NODE #${nodeId}` : 'GUEST'}</span><span className="text-[12px] font-black bg-[#00ff88]/10 px-2 py-0.5 rounded text-[#00ff88]">{bnbBalance} BNB</span></div></>) : (<><span className="text-[12px] font-black uppercase tracking-widest text-red-500">Disconnected</span><span className="text-sm font-bold">Anonymous AIPCORE Warrior</span></>)}</div>
              </div>
              <div className="flex items-center space-x-3">{isLoading && <Loader2 className="w-5 h-5 animate-spin text-[#00ff88]" />}<appkit-button size="sm" balance="hide" /></div>
          </header>

          <main className="flex-grow z-10 overflow-hidden main-content-scroll">
            <div key={currentView} className="view-animate h-full">
                {currentView === 'home' && renderHome()}
                {currentView === 'mine' && renderMine()}
                {currentView === 'pool' && renderPool()}
                {currentView === 'friends' && renderFriends()}
                {currentView === 'airdrop' && renderAirdrop()}
                {currentView === 'earn' && renderEarn()}
                {currentView === 'admin' && renderAdmin()}
                {currentView === 'leaderboard' && renderLeaderboard()}
            </div>
          </main>

          {/* Mobile Navigation */}
          <nav className="lg:hidden fixed bottom-8 left-6 right-6 h-20 glass-card rounded-[32px] flex items-center justify-around px-2 z-50 shadow-[0_20px_50px_rgba(0,0,0,0.8)] border-white/5">
            <button onClick={() => setCurrentView('home')} className={`nav-item flex flex-col items-center justify-center w-14 h-14 rounded-2xl ${currentView === 'home' ? 'active' : 'opacity-80'}`}><Pickaxe size={22} /><span className="text-[11px] mt-1 font-black uppercase tracking-tighter">Tap</span></button>
            <button onClick={() => setCurrentView('mine')} className={`nav-item flex flex-col items-center justify-center w-14 h-14 rounded-2xl ${currentView === 'mine' ? 'active' : 'opacity-80'}`}><TrendingUp size={22} /><span className="text-[11px] mt-1 font-black uppercase tracking-tighter">Mine</span></button>
            <button onClick={() => setCurrentView('pool')} className={`nav-item flex flex-col items-center justify-center w-14 h-14 rounded-2xl ${currentView === 'pool' ? 'active' : 'opacity-80'}`}><Flame size={22} /><span className="text-[11px] mt-1 font-black uppercase tracking-tighter">Pool</span></button>
            <button onClick={() => { triggerHaptic(); setCurrentView('friends'); }} className={`nav-item flex flex-col items-center justify-center w-14 h-14 rounded-2xl ${currentView === 'friends' ? 'active' : 'opacity-80'}`}><Users size={22} /><span className="text-[11px] mt-1 font-black uppercase tracking-tighter">Team</span></button>
            <button onClick={() => { triggerHaptic(); setCurrentView('leaderboard'); fetchLeaderboard(); }} className={`nav-item flex flex-col items-center justify-center w-14 h-14 rounded-2xl ${currentView === 'leaderboard' ? 'active' : 'opacity-80'}`}><Trophy size={22} /><span className="text-[11px] mt-1 font-black uppercase tracking-tighter">Leaders</span></button>
            <button onClick={() => { triggerHaptic(); setCurrentView('earn'); }} className={`nav-item flex flex-col items-center justify-center w-14 h-14 rounded-2xl ${currentView === 'earn' ? 'active' : 'opacity-80'}`}><Gift size={22} /><span className="text-[11px] mt-1 font-black uppercase tracking-tighter">Earn</span></button>
            <button onClick={() => { triggerHaptic(); setCurrentView('airdrop'); }} className={`nav-item flex flex-col items-center justify-center w-14 h-14 rounded-2xl ${currentView === 'airdrop' ? 'active' : 'opacity-80'}`}><Wallet size={22} /><span className="text-[11px] mt-1 font-black uppercase tracking-tighter">Stats</span></button>
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