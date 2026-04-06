
import { ethers } from 'ethers';
import fs from 'fs';

const abi = JSON.parse(fs.readFileSync('f:/AIPCORE MINI APP/archive_legacy_v1/src/utils/abi.json', 'utf8'));
const CORE_CONTRACT = '0xB6CbD70147835D4eA93B4a768D8e101B6E9A420f';
const USER_ADDRESS = '0x8112011370FDBA02c428dA5938fe72cbf3e0d54A'; 

async function test() {
    const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
    const coreContract = new ethers.Contract(CORE_CONTRACT, abi, provider);

    console.log("Checking registration for:", USER_ADDRESS);
    
    try {
        const id = await coreContract.addressToId(USER_ADDRESS);
        console.log("Found ID:", Number(id));

        if (id > 0) {
            console.log("Fetching data for ID:", Number(id));
            const [node, qualData] = await Promise.all([
                coreContract.nodes(id),
                coreContract.getPoolQualificationData(id)
            ]);

            console.log("Node Struct Tier (node[5]):", Number(node[5]));
            console.log("Pool qualData Tier (qualData[3]):", Number(qualData[3]));
            console.log("Directs (qualData[1]):", Number(qualData[1]));
            console.log("Matrix (qualData[5]):", Number(qualData[5]));
        } else {
            console.log("Address not registered in contract!");
        }

    } catch (e) {
        console.error("Test failed:", e.message);
    }
}

test();
