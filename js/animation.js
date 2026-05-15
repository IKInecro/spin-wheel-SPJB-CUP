export function showWinnerCard(winnerName, callback) {
    const cardOverlay = document.getElementById('winnerCard');
    const nameEl = document.getElementById('winnerName');
    
    nameEl.textContent = winnerName;
    cardOverlay.classList.remove('hidden');
    
    // Spawn particles
    spawnParticles();
    
    // Auto continue if callback is provided and auto-spin is on, 
    // but handled by UI usually. We just show it here.
}

export function hideWinnerCard() {
    const cardOverlay = document.getElementById('winnerCard');
    cardOverlay.classList.add('hidden');
    clearParticles();
}

let particleInterval;

function spawnParticles() {
    const container = document.getElementById('particlesContainer');
    container.innerHTML = ''; // Clear old
    
    const colors = ['#00FF37', '#098925', '#01420F'];
    const maxParticles = 50;
    
    for (let i = 0; i < maxParticles; i++) {
        createParticle(container, colors);
    }
    
    // Continuously spawn some
    particleInterval = setInterval(() => {
        if (container.children.length < 100) {
            createParticle(container, colors);
        }
    }, 100);
}

function createParticle(container, colors) {
    const p = document.createElement('div');
    const size = Math.random() * 8 + 4;
    
    p.style.position = 'absolute';
    p.style.width = `${size}px`;
    p.style.height = `${size}px`;
    p.style.background = colors[Math.floor(Math.random() * colors.length)];
    p.style.borderRadius = '50%';
    p.style.boxShadow = `0 0 ${size*2}px ${p.style.background}`;
    
    // Start at center
    p.style.left = '50%';
    p.style.top = '50%';
    
    // Random velocity
    const angle = Math.random() * Math.PI * 2;
    const velocity = Math.random() * 100 + 50;
    const tx = Math.cos(angle) * velocity;
    const ty = Math.sin(angle) * velocity;
    
    // Animate
    p.animate([
        { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
        { transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(0)`, opacity: 0 }
    ], {
        duration: Math.random() * 1000 + 1000,
        easing: 'cubic-bezier(0, .9, .57, 1)'
    }).onfinish = () => p.remove();
    
    container.appendChild(p);
}

function clearParticles() {
    clearInterval(particleInterval);
    const container = document.getElementById('particlesContainer');
    container.innerHTML = '';
}
