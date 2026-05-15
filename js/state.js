// Simple State Management with Pub/Sub

const state = {
    rawParticipants: [], // The initial loaded list
    pool: [], // Participants left to be selected
    selected: [], // Participants already selected in order
    bracketData: null, // Computed structure for the bracket
    lastSelected: null, // Last team selected from spin (for bracket highlight)
    isSpinning: false,
    autoSpin: false,
    theme: 'emerald'
};

const listeners = [];

export function getState() {
    return state;
}

export function subscribe(listener) {
    listeners.push(listener);
}

function notify() {
    listeners.forEach(listener => listener(state));
}

export function updateState(newStatePart) {
    Object.assign(state, newStatePart);
    notify();
}

export function resetState() {
    updateState({
        rawParticipants: [],
        pool: [],
        selected: [],
        bracketData: null,
        lastSelected: null,
        isSpinning: false
    });
}
