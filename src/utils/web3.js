import { ethers } from 'ethers';
import { createAppKit } from '@reown/appkit';
import { EthersAdapter } from '@reown/appkit-adapter-ethers';
import { bsc } from '@reown/appkit/networks';
import abi from './abi.json';

const PROJECT_ID = '85bbe92e974bca9f67c7910e0d1365ea';
const CONTRACT_ADDRESS = '0xB6CbD70147835D4eA93B4a768D8e101B6E9A420f';
const VIEW_CONTRACT_ADDRESS = '0x8d4FBcb77EAA5260F4C5f41713c6968A197E2BDb';

// SCALABLE RPC POOL (Client-Side Failover)
const RPC_POOL = [
  'https://bsc-dataseed.binance.org',
  'https://binance.llamarpc.com',
  'https://rpc.ankr.com/bsc'
];

const metadata = {
  name: 'AIPCORE',
  description: 'AIPCORE AI Web3 Gamified App',
  url: 'https://nfengine.online',
  icons: ['https://nfengine.online/icons/logo.png']
};

let modalInstance = null;

export const getAppKitModal = () => {
  if (modalInstance) return modalInstance;

  modalInstance = createAppKit({
    adapters: [new EthersAdapter()],
    networks: [bsc],
    metadata,
    projectId: PROJECT_ID,
    features: {
      analytics: false,  // disable analytics to prevent blocking wallet list
      email: false,      // disable email login (not needed)
      socials: [],       // disable social logins
    },
    allWallets: 'SHOW', // always show the full wallet list
    defaultNetwork: bsc,
  });
  return modalInstance;
};

let currentRpcIndex = 0;

// Cached provider and contracts to avoid re-creating on every call
let _cachedProvider = null;
let _coreContract = null;
let _viewContract = null;

export const getProvider = async () => {
    // If we have a wallet connected via modal
    const modal = getAppKitModal();
    const { walletProvider } = modal.getWalletProvider();
    if (walletProvider) {
        return new ethers.BrowserProvider(walletProvider);
    }
    
    // Reuse static provider instead of creating a new one every call
    if (!_cachedProvider) {
        _cachedProvider = new ethers.JsonRpcProvider(RPC_POOL[currentRpcIndex]);
    }
    return _cachedProvider;
};

export const getCoreContract = async () => {
    if (!_coreContract) {
        const provider = await getProvider();
        _coreContract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);
    }
    return _coreContract;
};

export const getViewContract = async () => {
    if (!_viewContract) {
        const provider = await getProvider();
        _viewContract = new ethers.Contract(VIEW_CONTRACT_ADDRESS, abi, provider);
    }
    return _viewContract;
};

export const invalidateProviderCache = () => {
    _cachedProvider = null;
    _coreContract = null;
    _viewContract = null;
};


// Standard formatting helpers
export const formatBNB = (wei) => {
  return ethers.formatEther(wei || 0n);
};

export const parseBNB = (amount) => {
  return ethers.parseEther(amount.toString());
};

export const connectWallet = async () => {
  try {
    const modal = getAppKitModal();
    await modal.open();
    // The App.jsx will listen for the state change
    return null; 
  } catch (error) {
    console.error("Error connecting wallet:", error);
    return null;
  }
};

export const switchNetwork = async () => {
  // AppKit handles this automatically
  return true;
};

export const checkRegistration = async (address) => {
  const contract = await getCoreContract();
  try {
    const userId = await contract.nodeId(address);
    return Number(userId);
  } catch (error) {
    console.error("Error checking registration:", error);
    return 0;
  }
};

export const getWalletBalance = async (address) => {
  const provider = await getProvider();
  try {
    const balance = await provider.getBalance(address);
    return formatBNB(balance);
  } catch (error) {
    console.error("Error fetching balance:", error);
    return "0.00";
  }
};

export const getNodeData = async (nodeId) => {
  const contract = await getCoreContract();
  try {
    const node = await contract.getNode(nodeId);
    return {
      wallet: node.wallet,
      nodeId: Number(node.nodeId),
      sponsor: Number(node.sponsor),
      tier: Number(node.tier),
      directNodes: Number(node.directNodes),
      totalMatrixNodes: Number(node.totalMatrixNodes),
      joinedAt: Number(node.joinedAt),
      totalContribution: formatBNB(node.totalContribution),
    };
  } catch (error) {
    console.error("Error fetching node data:", error);
    return null;
  }
};

export const getRewardStats = async (nodeId) => {
    try {
      const viewContract = await getViewContract();
      const breakdown = await viewContract.getIncomeBreakdown(nodeId);
      return {
        total: formatBNB(breakdown[0] || 0n),
        referral: formatBNB(breakdown[1] || 0n),
        tier: formatBNB(breakdown[2] || 0n),
        binary: formatBNB(breakdown[3] || 0n),
        direct: formatBNB(breakdown[4] || 0n),
        lost: formatBNB(breakdown[5] || 0n),
        pool: formatBNB(breakdown[6] || 0n),
      };
    } catch (error) {
      try {
        const coreContract = await getCoreContract();
        const breakdown = await coreContract.getIncomeBreakdown(nodeId);
        return {
          total: formatBNB(breakdown.total),
          referral: formatBNB(breakdown.referral),
          tier: formatBNB(breakdown.tier),
          binary: formatBNB(breakdown.binary),
          direct: formatBNB(breakdown.direct),
          lost: formatBNB(breakdown.lost),
          pool: '0.00'
        };
      } catch (fallbackError) {
        return null;
      }
    }
  };
  
  export const getMatrixLevelsData = async (nodeId) => {
      const contract = await getCoreContract();
      try {
          // Fetch rewards and all 18 team sizes in parallel (2 calls instead of 19)
          const [rewards, ...counts] = await Promise.all([
              contract.getTierRewards(nodeId),
              ...Array.from({ length: 18 }, (_, i) => contract.getTeamSize(nodeId, i + 1))
          ]);
          return counts.map((count, i) => ({
              level: i + 1,
              count: Number(count),
              reward: formatBNB(rewards[i])
          }));
      } catch (err) {
          console.error("Matrix data fetch failed:", err);
          return [];
      }
  };

export const getIncomeHistory = async (nodeId, length = 10) => {
    const contract = await getCoreContract();
    try {
        const events = await contract.getIncome(nodeId, length);
        return events.map(e => ({
            id: Number(e.id),
            layer: Number(e.layer),
            amount: formatBNB(e.amount),
            time: Number(e.time),
            isMissed: e.isMissed,
            rewardType: Number(e.rewardType),
            tier: Number(e.tier)
        }));
    } catch (err) {
        console.error("Income history fetch failed:", err);
        return [];
    }
};

export const getTierCostsArray = async () => {
    const contract = await getCoreContract();
    try {
        const costs = await contract.getTierCosts();
        return Array.from(costs);
    } catch (err) {
        console.error("Failed to fetch tier costs:", err);
        return [];
    }
};

export const getBNBPrice = async () => {
    const contract = await getCoreContract();
    try {
        const price = await contract.bnbPrice();
        return Number(price);
    } catch (err) {
        return 0;
    }
};

export const getTierCostValue = async (tierIndex) => {
  const contract = await getCoreContract();
  try {
    const cost = await contract.getTierCost(tierIndex);
    return cost;
  } catch (error) {
    return 0n;
  }
};

export const createNodeTransaction = async (sponsorId) => {
  const modal = getAppKitModal();
  const bridge = modal.getWalletProvider();
  if (!bridge.walletProvider) throw new Error("Wallet not connected");
  
  const browserProvider = new ethers.BrowserProvider(bridge.walletProvider);
  const signer = await browserProvider.getSigner();
  const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
  
  const cost = await getTierCostValue(0);
  const tx = await contract.createNode(sponsorId, { value: cost });
  return await tx.wait();
};

export const upgradeTierTransaction = async (nodeId, toTier) => {
  const modal = getAppKitModal();
  const bridge = modal.getWalletProvider();
  if (!bridge.walletProvider) throw new Error("Wallet not connected");
  
  const browserProvider = new ethers.BrowserProvider(bridge.walletProvider);
  const signer = await browserProvider.getSigner();
  const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
  
  const cost = await contract.getUpgradeCost(toTier - 1, 1);
  const tx = await contract.unlockTier(nodeId, toTier, { value: cost });
  return await tx.wait();
};

export const getDirectReferralsList = async (nodeId, count = 20) => {
    const contract = await getCoreContract();
    try {
        const ids = await Promise.all(
            [...Array(Math.min(count, 100))].map((_, i) => contract.teams(nodeId, 1, i))
        );
        const validIds = ids.filter(id => Number(id) > 0);
        const nodes = await Promise.all(validIds.map(id => contract.getNode(id)));
        return nodes.map(n => ({
            wallet: n.wallet,
            nodeId: Number(n.nodeId),
            sponsor: Number(n.sponsor),
            tier: Number(n.tier),
            joinedAt: Number(n.joinedAt)
        })).filter(n => n.nodeId > 0);
    } catch (err) {
        console.error("Direct referrals fetch failed:", err);
        return [];
    }
};

export const getMatrixTreeNodes = async (nodeId, level, count = 2) => {
    const contract = await getCoreContract();
    try {
        const matrixLevel = Math.max(0, level - 1);
        const nodes = await contract.getMatrixUsers(nodeId, matrixLevel, 0, count);
        return nodes.map(n => ({
            wallet: n.wallet,
            nodeId: Number(n.nodeId),
            sponsor: Number(n.sponsor),
            tier: Number(n.tier),
            joinedAt: Number(n.joinedAt)
        })).filter(n => n.nodeId > 0);
    } catch (err) {
        console.error("Matrix tree fetch failed:", err);
        return [];
    }
};

export const getUnilevelTreeNodes = async (nodeId, level, count = 20) => {
    const contract = await getCoreContract();
    try {
        const unilevelLevel = Math.max(0, level - 1);
        const nodes = await contract.getNetworkNodes(nodeId, unilevelLevel, count);
        return nodes.map(n => ({
            wallet: n.wallet,
            nodeId: Number(n.nodeId),
            sponsor: Number(n.sponsor),
            tier: Number(n.tier),
            joinedAt: Number(n.joinedAt)
        })).filter(n => n.nodeId > 0);
    } catch (err) {
        console.error("Unilevel tree fetch failed:", err);
        return [];
    }
};

export const getContractOwner = async () => {
    const contract = await getCoreContract();
    try {
        const config = await contract.getConfig();
        return config._owner;
    } catch (err) {
        console.error("Failed to fetch owner:", err);
        return null;
    }
};
