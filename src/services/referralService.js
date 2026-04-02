/**
 * AIPCore Referral Service (Self-Hosting Bridge)
 * 
 * NOTE: Currently using MOCK data. 
 * When deploying to your VPS with PostgreSQL:
 * 1. Update BASE_URL.
 * 2. Implement real fetch() calls to your backend.
 */

const BASE_URL = 'https://nfengine.online/api';

export const getOffchainReferralStats = async (nodeId) => {
    try {
        const res = await fetch(`${BASE_URL}/referrals/${nodeId}`);
        if (!res.ok) throw new Error('Backend error');
        return await res.json();
    } catch (err) {
        console.error("Offchain sync failed:", err);
        // Fallback to empty if server is down
        return { rawInvites: 0, offlineJoined: 0, guests: [] };
    }
};
