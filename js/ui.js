import { getState, updateState, subscribe } from './state.js';
import { loadParticipants, shufflePool, pickWinner, parseParticipants } from './participants.js';
import { Wheel } from './spin.js';
import { calculateBracket, updateBracketNodes, renderBracket } from './bracket.js';
import { showWinnerCard, hideWinnerCard } from './animation.js';

let wheel;

export function initUI() {
    // Initialize Wheel
    wheel = new Wheel('wheelCanvas');

    // DOM Elements
    const participantInput = document.getElementById('participantInput');
    const btnAdd            = document.getElementById('btnAdd');
    const btnClear          = document.getElementById('btnClear');
    const btnRandomize      = document.getElementById('btnRandomize');
    const btnSpin           = document.getElementById('btnSpin');
    const toggleAutoSpin    = document.getElementById('toggleAutoSpin');
    const btnNextSpin       = document.getElementById('btnNextSpin');
    const bracketContainer  = document.getElementById('bracketContainer');

    // ----- Event Listeners -----

    btnAdd.addEventListener('click', () => {
        const text = participantInput.value;
        const list = parseParticipants(text);

        if (list.length === 16) {
            if (loadParticipants(text)) {
                const state = getState();
                const bData = calculateBracket();          // Fixed 16 teams, no arg needed
                updateState({ bracketData: bData });
            }
        } else {
            alert(`Wajib masukkan tepat 16 team (1 baris = 1 team).\nSaat ini terdeteksi: ${list.length} team.`);
        }
    });

    btnClear.addEventListener('click', () => {
        participantInput.value = '';
        updateState({
            rawParticipants: [],
            pool: [],
            selected: [],
            bracketData: null,
            lastSelected: null
        });
    });

    btnRandomize.addEventListener('click', () => {
        shufflePool();
    });

    btnSpin.addEventListener('click', () => {
        startSpinSequence();
    });

    toggleAutoSpin.addEventListener('change', (e) => {
    updateState({ autoSpin: e.target.checked });
});



    btnNextSpin.addEventListener('click', () => {
        hideWinnerCard();

        const state = getState();
        if (state.autoSpin && state.pool.length > 0) {
            setTimeout(() => startSpinSequence(), 600);
        }
    });

    // Logo error handler
    const logoImage = document.getElementById('logoImage');
    if (logoImage) {
        logoImage.onerror = () => {
            console.warn('logo.png not found in directory');
            logoImage.style.display = 'none';
        };
    }

    // Subscribe to state changes → re-render UI
    subscribe(renderUI);

    // Initial render
    renderUI(getState());
}

// ─────────────────────────────────────────────
//  Spin Sequence
// ─────────────────────────────────────────────
function startSpinSequence() {
    const { pool, isSpinning } = getState();
    if (pool.length === 0 || isSpinning) return;

    updateState({ isSpinning: true });

    // Pointer bounce animation
    const pointer = document.querySelector('.wheel-pointer');
    if (pointer) {
        pointer.classList.add('pointer-bounce');
        setTimeout(() => pointer.classList.remove('pointer-bounce'), 200);
    }

    wheel.spin((winningIndex) => {
        // pickWinner removes from pool and adds to selected
        const winner = pickWinner(winningIndex);

        // Store lastSelected so bracket can highlight it
        updateState({ isSpinning: false, lastSelected: winner });

        // Show winner card with team name
        showWinnerCard(winner);

        // If auto-spin is on, auto-continue after 2 seconds
        const state = getState();
        if (state.autoSpin) {
            setTimeout(() => {
                const btn = document.getElementById('btnNextSpin');
                if (btn) btn.click();
            }, 2000);
        }
    });
}

// ─────────────────────────────────────────────
//  Render UI (called on every state change)
// ─────────────────────────────────────────────
function renderUI(state) {
    // Redraw wheel
    if (wheel) wheel.draw();

    // Participant count badge
    const countEl = document.getElementById('participantCount');
    if (countEl) countEl.textContent = state.pool.length;

    // Spin button enable/disable
    const btnSpin = document.getElementById('btnSpin');
    if (btnSpin) btnSpin.disabled = state.pool.length === 0 || state.isSpinning;

    // Bracket status label
    const statusBracket = document.getElementById('statusBracket');
    if (statusBracket) {
        if (state.selected.length === 16) {
            statusBracket.textContent = 'Complete ✓';
            statusBracket.className = 'text-emerald';
        } else if (state.selected.length > 0) {
            statusBracket.textContent = `In Progress (${state.selected.length}/16)`;
            statusBracket.className = 'text-emerald';
        } else {
            statusBracket.textContent = 'Waiting';
            statusBracket.className = 'text-muted';
        }
    }

    // Slots & byes
    const slotsEl = document.getElementById('statusSlots');
    const byesEl  = document.getElementById('statusByes');
    if (state.bracketData) {
        if (slotsEl) slotsEl.textContent = state.bracketData.totalSlots;
        if (byesEl)  byesEl.textContent  = state.bracketData.byes;
    } else {
        if (slotsEl) slotsEl.textContent = '-';
        if (byesEl)  byesEl.textContent  = '-';
    }

    // ── Bracket Render ──
    const bracketContainer = document.getElementById('bracketContainer');
    if (state.bracketData) {
        const filledBracket = updateBracketNodes(state.bracketData, state.selected);
        renderBracket(bracketContainer, filledBracket, state.lastSelected || null);
    } else {
        renderBracket(bracketContainer, null);
    }
}
