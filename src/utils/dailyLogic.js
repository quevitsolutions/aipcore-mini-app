/**
 * AIPCore Deterministic Daily Logic
 * Generates identical Cipher and Combo across all users without a backend.
 */

const WORDS = ["CORE", "AIP", "MINE", "NODE", "TREE", "BLOCK", "MINT", "BNB", "BSC", "AIR"];
const CARDS = ["Multitap", "Energy Cap", "Node Unit", "Sponsor"];

const getDailySeed = () => {
    const now = new Date();
    return `${now.getFullYear()}${now.getMonth() + 1}${now.getDate()}`;
};

// Simple pseudo-random based on seed string
const seededRandom = (seed) => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = ((hash << 5) - hash) + seed.charCodeAt(i);
        hash |= 0;
    }
    const x = Math.sin(hash++) * 10000;
    return x - Math.floor(x);
};

export const getDailyCipher = () => {
    const seed = getDailySeed();
    const index = Math.floor(seededRandom(seed + "cipher") * WORDS.length);
    return WORDS[index];
};

export const getDailyCombo = () => {
    const seed = getDailySeed();
    const r1 = Math.floor(seededRandom(seed + "c1") * 10);
    const r2 = Math.floor(seededRandom(seed + "c2") * 10);
    const r3 = Math.floor(seededRandom(seed + "c3") * 10);
    // Return mock card indexes for the combo
    return [r1 % 4, r2 % 4, r3 % 4]; 
};

export const charToMorse = (char) => {
    const morse = {
        'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
        'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
        'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
        'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
        'Y': '-.--', 'Z': '--..',
        '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
        '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.'
    };
    return morse[char.toUpperCase()] || '';
};
