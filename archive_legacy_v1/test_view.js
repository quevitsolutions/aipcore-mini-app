
import { ethers } from 'ethers';
import fs from 'fs';

const abi = JSON.parse(fs.readFileSync('f:/AIPCORE MINI APP/archive_legacy_v1/src/utils/abi.json', 'utf8'));
const CORE_CONTRACT = '0xB6CbD70147835D4eA93B4a768D8e101B6E9A420f';
const NODE_ID = 36999; 

async function test() {
    const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
    const coreContract = new ethers.Contract(CORE_CONTRACT, abi, provider);

    console.log("Testing getNode vs nodes for NODE #36999...");
    
    try {
        console.log("\nCalling coreContract.nodes(36999)...");
        const nodeTuple = await coreContract.nodes(NODE_ID);
        console.log("SUCCESS! nodes() output [1]:", Number(nodeTuple[1]));

        console.log("\nCalling coreContract.getNode(36999)...");
        const nodeStruct = await coreContract.getNode(NODE_ID);
        console.log("SUCCESS! getNode() output nodeId:", Number(nodeStruct.nodeId));

    } catch (e) {
        console.log("\nFAILED! Error calling coreContract.getNode(36999):");
        console.error(e.message);
    }
}

test();
