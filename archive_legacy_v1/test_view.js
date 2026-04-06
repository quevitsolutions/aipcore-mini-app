
import { ethers } from 'ethers';
import fs from 'fs';

const abi = JSON.parse(fs.readFileSync('f:/AIPCORE MINI APP/archive_legacy_v1/src/utils/abi.json', 'utf8'));
const CORE_CONTRACT = '0xB6CbD70147835D4eA93B4a768D8e101B6E9A420f';
const NODE_ID = 36999; 

async function test() {
    const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
    const coreContract = new ethers.Contract(CORE_CONTRACT, abi, provider);

    console.log("Simulating getNodeData...");
    
    try {
        const [node, qualData] = await Promise.all([
            coreContract.nodes(NODE_ID).catch((e) => {
                console.log("nodes() failed:", e);
                return null;
            }),
            coreContract.getPoolQualificationData(NODE_ID).catch((e) => {
                console.log("getPoolQualificationData() failed:", e);
                return null;
            })
        ]);

        console.log("node:", node ? "EXISTS" : "NULL");
        console.log("node wallet:", node?.wallet);
        console.log("node === ethers.ZeroAddress:", node?.wallet === ethers.ZeroAddress);
        
        if (!node || node.wallet === ethers.ZeroAddress) {
            console.log("RETURN NULL TRIGGGGRED!");
        }

        const directNodes = (qualData && qualData[1] !== undefined) ? Number(qualData[1]) : Number(node?.directNodes || 0);
        const totalMatrixNodes = (qualData && qualData[5] !== undefined) ? Number(qualData[5]) : Number(node?.totalMatrixNodes || 0);
        const qualTier  = (qualData && qualData[3] !== undefined) ? Number(qualData[3]) : 0;
        const structTier = Number(node?.tier || 0);

        const liveTier = Math.max(qualTier, structTier);

        console.log({
            wallet: node?.wallet,
            tier: liveTier,
            directNodes,
            totalMatrixNodes
        });

    } catch (e) {
        console.error(e.message);
    }
}

test();
