
import { ethers } from 'ethers';
import fs from 'fs';

const abi = JSON.parse(fs.readFileSync('f:/AIPCORE MINI APP/src/utils/abi.json', 'utf8'));
const CORE_CONTRACT = '0xB6CbD70147835D4eA93B4a768D8e101B6E9A420f';
const NODE_ID = 36999; 

async function test() {
    const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
    const coreContract = new ethers.Contract(CORE_CONTRACT, abi, provider);

    console.log("Testing Tier Indexing for NODE #36999...");
    
    try {
        const node = await coreContract.nodes(NODE_ID);
        const currentTier = Number(node.tier);
        console.log("Current Node Tier (from contract):", currentTier);
        
        console.log("\nFetching individual Tier Costs (getTierCost):");
        for(let i=0; i<8; i++) {
            const cost = await coreContract.getTierCost(i);
            console.log(`Index ${i}: ${ethers.formatEther(cost)} BNB`);
        }

        console.log("\nTesting getUpgradeCost results:");
        for(let i=0; i<8; i++) {
            const cost = await coreContract.getUpgradeCost(i, 1);
            console.log(`getUpgradeCost(${i}, 1): ${ethers.formatEther(cost)} BNB`);
        }

        console.log("\nSimulating App UI Logic:");
        const toTier = currentTier + 1;
        const appFromLevel = toTier - 1;
        const appCost = await coreContract.getUpgradeCost(appFromLevel, 1);
        console.log(`App would call getUpgradeCost(${appFromLevel}, 1) for Tier ${toTier}`);
        console.log(`App calculated cost: ${ethers.formatEther(appCost)} BNB`);

    } catch (e) {
        console.error("Test Failed:", e);
    }
}

test();
