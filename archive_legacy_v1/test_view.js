
import { ethers } from 'ethers';
import fs from 'fs';

const abi = JSON.parse(fs.readFileSync('f:/AIPCORE MINI APP/archive_legacy_v1/src/utils/abi.json', 'utf8'));
const CORE_CONTRACT = '0xB6CbD70147835D4eA93B4a768D8e101B6E9A420f';
const NODE_ID = 36999; 

async function test() {
    const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
    const coreContract = new ethers.Contract(CORE_CONTRACT, abi, provider);

    console.log("Testing nodes() output format...");
    
    try {
        const nodeTuple = await coreContract.nodes(NODE_ID);
        console.log("nodeTuple type:", typeof nodeTuple);
        console.log("nodeTuple isArray:", Array.isArray(nodeTuple));
        console.log("nodeTuple.nodeId:", nodeTuple.nodeId);
        console.log("nodeTuple.wallet:", nodeTuple.wallet);
        console.log("nodeTuple.tier:", nodeTuple.tier);
    } catch (e) {
        console.error(e.message);
    }
}

test();
