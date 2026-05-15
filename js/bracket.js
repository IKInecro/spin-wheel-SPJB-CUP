/**
 * bracket.js
 * Fixed 16-team single-elimination bracket.
 * Rounds: R16 (8 matches) → QF (4) → SF (2) → Final (1)
 */

/**
 * Returns the static bracket skeleton (always 16 teams, 4 rounds).
 */
export function calculateBracket() {
    const totalSlots = 16;
    const numRounds = 4;
    const rounds = [];
    let matchesInRound = 8; // 8 matches in R16

    for (let i = 0; i < numRounds; i++) {
        const matches = [];
        for (let j = 0; j < matchesInRound; j++) {
            matches.push({ player1: null, player2: null });
        }
        rounds.push(matches);
        matchesInRound = Math.floor(matchesInRound / 2);
    }

    return { rounds, totalSlots, byes: 0, numRounds };
}

/**
 * Fills the first round with selected teams (in spin order).
 * Fill pattern: Match1-P1, Match1-P2, Match2-P1, Match2-P2 ...
 */
export function updateBracketNodes(bracketData, selected) {
    if (!bracketData) return null;

    const rounds = JSON.parse(JSON.stringify(bracketData.rounds));
    const firstRound = rounds[0];
    let idx = 0;

    for (let i = 0; i < firstRound.length; i++) {
        firstRound[i].player1 = idx < selected.length ? selected[idx++] : null;
        firstRound[i].player2 = idx < selected.length ? selected[idx++] : null;
    }

    return { ...bracketData, rounds };
}

/**
 * Renders the full bracket into bracketContainer.
 * lastSelected: the most recently added team name (for highlight animation).
 */
export function renderBracket(bracketContainer, bracketData, lastSelected = null) {
    if (!bracketData) {
        bracketContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🏆</div>
                <p>Load 16 teams to generate bracket</p>
            </div>`;
        return;
    }

    bracketContainer.innerHTML = '';

    const roundTitles = ['ROUND OF 16', 'QUARTER FINALS', 'SEMI FINALS', 'GRAND FINAL'];

    // Outer wrapper: horizontal flex (one column per round)
    const wrapper = document.createElement('div');
    wrapper.className = 'bracket-wrapper';

    bracketData.rounds.forEach((round, roundIndex) => {
        const col = document.createElement('div');
        col.className = 'bracket-round';
        col.dataset.round = roundIndex;

        // Round title
        const title = document.createElement('div');
        title.className = 'round-title';
        title.textContent = roundTitles[roundIndex] || `ROUND ${roundIndex + 1}`;
        col.appendChild(title);

        // Matches container
        const matchesWrap = document.createElement('div');
        matchesWrap.className = 'round-matches';

        round.forEach((match, matchIndex) => {
            const matchEl = document.createElement('div');
            matchEl.className = 'bracket-match';
            matchEl.dataset.match = matchIndex;
            matchEl.dataset.round = roundIndex;

            // Seed number (only for R16)
            const matchNum = roundIndex === 0 ? matchIndex + 1 : null;

            // Player 1
            const p1IsNew = match.player1 && match.player1 === lastSelected && roundIndex === 0;
            const p1El = createTeamSlot(match.player1, matchNum ? `#${matchNum * 2 - 1}` : '', p1IsNew);

            // VS divider
            const vsDivider = document.createElement('div');
            vsDivider.className = 'vs-divider';
            vsDivider.innerHTML = '<span>VS</span>';

            // Player 2
            const p2IsNew = match.player2 && match.player2 === lastSelected && roundIndex === 0;
            const p2El = createTeamSlot(match.player2, matchNum ? `#${matchNum * 2}` : '', p2IsNew);

            matchEl.appendChild(p1El);
            matchEl.appendChild(vsDivider);
            matchEl.appendChild(p2El);
            matchesWrap.appendChild(matchEl);
        });

        col.appendChild(matchesWrap);
        wrapper.appendChild(col);
    });

    bracketContainer.appendChild(wrapper);

    // Draw SVG connector lines after DOM is rendered
    requestAnimationFrame(() => drawConnectors(bracketContainer, bracketData));
}

function createTeamSlot(name, seed, isNew) {
    const slot = document.createElement('div');
    slot.className = `team-slot${name ? ' filled' : ''}${isNew ? ' newly-added' : ''}`;

    if (seed) {
        const seedEl = document.createElement('span');
        seedEl.className = 'seed-num';
        seedEl.textContent = seed;
        slot.appendChild(seedEl);
    }

    const nameEl = document.createElement('span');
    nameEl.className = 'team-name';
    nameEl.textContent = name || 'TBD';
    slot.appendChild(nameEl);

    return slot;
}

/**
 * Draws SVG connector lines between rounds.
 */
function drawConnectors(bracketContainer, bracketData) {
    // Remove old SVG overlay if any
    const old = bracketContainer.querySelector('.connector-svg');
    if (old) old.remove();

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('connector-svg');
    svg.style.cssText = `
        position: absolute;
        top: 0; left: 0;
        width: 100%; height: 100%;
        pointer-events: none;
        overflow: visible;
        z-index: 0;
    `;

    const containerRect = bracketContainer.getBoundingClientRect();
    const rounds = bracketContainer.querySelectorAll('.bracket-round');

    for (let rIdx = 0; rIdx < rounds.length - 1; rIdx++) {
        const currentRound = rounds[rIdx];
        const nextRound = rounds[rIdx + 1];
        const currentMatches = currentRound.querySelectorAll('.bracket-match');
        const nextMatches = nextRound.querySelectorAll('.bracket-match');

        // Every 2 current matches feed into 1 next match
        for (let nIdx = 0; nIdx < nextMatches.length; nIdx++) {
            const srcA = currentMatches[nIdx * 2];
            const srcB = currentMatches[nIdx * 2 + 1];
            const dst = nextMatches[nIdx];

            if (!srcA || !srcB || !dst) continue;

            const rA = srcA.getBoundingClientRect();
            const rB = srcB.getBoundingClientRect();
            const rD = dst.getBoundingClientRect();

            // Midpoint on right edge of src matches
            const xA = rA.right - containerRect.left;
            const yA = rA.top + rA.height / 2 - containerRect.top;

            const xB = rB.right - containerRect.left;
            const yB = rB.top + rB.height / 2 - containerRect.top;

            // Left edge of destination match (mid)
            const xD = rD.left - containerRect.left;
            const yD = rD.top + rD.height / 2 - containerRect.top;

            // Midpoint X between rounds
            const midX = (xA + xD) / 2;

            // Line A: srcA right → midX (horizontal), then midX (vertical to yMid), then midX → dst left
            // We'll draw: A → vertical bracket → D
            const yMid = (yA + yB) / 2;

            // Path from srcA
            const pathA = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            pathA.setAttribute('d', `M ${xA} ${yA} H ${midX} V ${yMid}`);
            pathA.setAttribute('fill', 'none');
            pathA.setAttribute('stroke', 'rgba(0, 255, 55, 0.35)');
            pathA.setAttribute('stroke-width', '2');
            pathA.setAttribute('stroke-linecap', 'round');

            // Path from srcB
            const pathB = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            pathB.setAttribute('d', `M ${xB} ${yB} H ${midX} V ${yMid}`);
            pathB.setAttribute('fill', 'none');
            pathB.setAttribute('stroke', 'rgba(0, 255, 55, 0.35)');
            pathB.setAttribute('stroke-width', '2');
            pathB.setAttribute('stroke-linecap', 'round');

            // Path from midpoint → dst
            const pathC = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            pathC.setAttribute('d', `M ${midX} ${yMid} H ${xD}`);
            pathC.setAttribute('fill', 'none');
            pathC.setAttribute('stroke', 'rgba(0, 255, 55, 0.35)');
            pathC.setAttribute('stroke-width', '2');
            pathC.setAttribute('stroke-linecap', 'round');

            svg.appendChild(pathA);
            svg.appendChild(pathB);
            svg.appendChild(pathC);
        }
    }

    bracketContainer.style.position = 'relative';
    bracketContainer.appendChild(svg);

    // Add champion logo at the far right near the Grand Final match
    const oldLogo = bracketContainer.querySelector('.bracket-champion-logo');
    if (oldLogo) oldLogo.remove();

    const finalRound = rounds[rounds.length - 1];
    if (finalRound) {
        const finalMatchEl = bracketContainer.querySelector('.bracket-round[data-round="' + (rounds.length - 1) + '"] .bracket-match');
        if (finalMatchEl) {
            const rFinal = finalMatchEl.getBoundingClientRect();
            const containerRect2 = bracketContainer.getBoundingClientRect();

            const logo = document.createElement('img');
            logo.src = 'logo.png';
            logo.alt = 'Logo';
            logo.className = 'bracket-champion-logo';

            // Position to the right edge of the final match, vertically centered
            const yCenter = rFinal.top + rFinal.height / 2 - containerRect2.top;
            const xRight = rFinal.right - containerRect2.left + 12; // small gap

            logo.style.position = 'absolute';
            logo.style.left = `${xRight}px`;
            logo.style.top = `${yCenter - 60}px`; // 120px height / 2
            logo.style.width = '120px';
            logo.style.height = '120px';
            logo.style.pointerEvents = 'none';
            logo.style.zIndex = '10002';

            bracketContainer.appendChild(logo);
        }
    }
}
