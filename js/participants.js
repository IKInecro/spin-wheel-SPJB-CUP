import { updateState, getState } from './state.js';

export function parseParticipants(text) {
    if (!text) return [];
    
    // Split by newlines, trim spaces, remove empty lines
    const list = text.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
    
    return list;
}

export function loadParticipants(text) {
    const list = parseParticipants(text);
    if (list.length === 0) return false;

    updateState({
        rawParticipants: [...list],
        pool: [...list],
        selected: [],
        bracketData: null,
        lastSelected: null
    });
    
    return true;
}

export function shufflePool() {
    const { pool } = getState();
    const newPool = [...pool];
    
    // Fisher-Yates shuffle
    for (let i = newPool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newPool[i], newPool[j]] = [newPool[j], newPool[i]];
    }
    
    updateState({ pool: newPool });
}

export function pickWinner(index) {
    const { pool, selected } = getState();
    if (pool.length === 0) return null;
    
    // Clamp index to valid range (safety for spin edge cases)
    const safeIndex = Math.min(Math.max(0, index), pool.length - 1);
    
    const winner = pool[safeIndex];
    const newPool = pool.filter((_, i) => i !== safeIndex);
    const newSelected = [...selected, winner];
    
    updateState({
        pool: newPool,
        selected: newSelected
    });
    
    return winner;
}
