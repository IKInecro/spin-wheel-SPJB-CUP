import { getState } from './state.js';

export class Wheel {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.centerX = this.width / 2;
        this.centerY = this.height / 2;
        this.radius = Math.min(this.centerX, this.centerY) - 10;
        
        this.rotationAngle = 0;
        this.spinVelocity = 0;
        this.isSpinning = false;
        
        // Theme colors for segments
        this.colors = [
            '#01420F', // dark green
            '#098925', // medium green
            '#0f172a', // slate-900
            '#1e293b'  // slate-800
        ];
        
        this.onSpinComplete = null;
        
        // Render initial state
        this.draw();
    }

    draw() {
        const { pool } = getState();
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        if (!pool || pool.length === 0) {
            this.drawEmptyWheel();
            return;
        }

        const numSegments = pool.length;
        const anglePerSegment = (Math.PI * 2) / numSegments;

        this.ctx.save();
        this.ctx.translate(this.centerX, this.centerY);
        this.ctx.rotate(this.rotationAngle);

        for (let i = 0; i < numSegments; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, 0);
            this.ctx.arc(0, 0, this.radius, i * anglePerSegment, (i + 1) * anglePerSegment);
            this.ctx.closePath();
            
            this.ctx.fillStyle = this.colors[i % this.colors.length];
            this.ctx.fill();
            
            // Neon Border
            this.ctx.lineWidth = 1;
            this.ctx.strokeStyle = '#00FF37'; // primary green
            this.ctx.stroke();

            // Draw Text
            this.ctx.save();
            this.ctx.rotate(i * anglePerSegment + anglePerSegment / 2);
            this.ctx.textAlign = 'right';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillStyle = '#f8fafc'; // slate-50
            
            // Dynamic font sizing
            const fontSize = numSegments <= 8 ? 16 : numSegments <= 12 ? 13 : 11;
            this.ctx.font = `bold ${fontSize}px Inter, sans-serif`;
            
            // Max width for text
            const text = pool[i];
            const maxTextWidth = this.radius - 40;
            
            // Basic text fitting
            this.ctx.fillText(text, this.radius - 20, 0, maxTextWidth);
            this.ctx.restore();
        }

        this.ctx.restore();
    }

    drawEmptyWheel() {
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, this.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = '#0f172a'; // slate-900
        this.ctx.fill();
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = '#00FF37'; // primary green
        this.ctx.stroke();
        
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = '#94a3b8';
        this.ctx.font = '16px Inter, sans-serif';
        this.ctx.fillText('NO PARTICIPANTS', this.centerX, this.centerY);
    }

    spin(callback) {
        if (this.isSpinning) return;
        
        const { pool } = getState();
        if (pool.length === 0) return;

        this.isSpinning = true;
        this.onSpinComplete = callback;

        const numSegments = pool.length;
        const anglePerSegment = (Math.PI * 2) / numSegments;

        // Pick a random winning index to land on
        const winningIndex = Math.floor(Math.random() * numSegments);

        // Compute target rotation so that the chosen segment center is at pointer (12 o'clock)
        // Pointer angle in canvas coords (when rotationAngle=0) is Math.PI * 1.5
        const targetSegmentCenter = Math.PI * 1.5 - (winningIndex + 0.5) * anglePerSegment;

        // Normalize current angle
        const startAngle = this.rotationAngle;

        // Choose random full rotations for pleasing effect
        const fullRotations = Math.floor(Math.random() * 4) + 4; // 4..7 rotations

        const rotationDelta = (fullRotations * Math.PI * 2) + (targetSegmentCenter - startAngle);
        const endAngle = startAngle + rotationDelta;

        // Animation duration (ms)
        const duration = 4200 + Math.floor(Math.random() * 1200); // ~4.2s - 5.4s

        const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

        let startTime = null;

        const step = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;
            const t = Math.min(1, elapsed / duration);
            const eased = easeOutCubic(t);

            this.rotationAngle = startAngle + (endAngle - startAngle) * eased;
            // keep rotationAngle reasonably bounded
            this.rotationAngle = this.rotationAngle % (Math.PI * 2);
            this.draw();

            if (t < 1) {
                requestAnimationFrame(step);
            } else {
                this.isSpinning = false;
                // Determine winner index using the final exact landing spot
                if (this.onSpinComplete) this.onSpinComplete(winningIndex);
            }
        };

        requestAnimationFrame(step);
    }

    // keep determineWinner for compatibility (unused in easing approach)
    determineWinner() {
        const { pool } = getState();
        if (pool.length === 0) return;

        const numSegments = pool.length;
        const anglePerSegment = (Math.PI * 2) / numSegments;

        let currentAngle = (Math.PI * 1.5 - this.rotationAngle) % (Math.PI * 2);
        if (currentAngle < 0) currentAngle += Math.PI * 2;

        let winningIndex = Math.floor(currentAngle / anglePerSegment);
        winningIndex = Math.min(winningIndex, numSegments - 1);
        winningIndex = Math.max(winningIndex, 0);

        if (this.onSpinComplete) {
            this.onSpinComplete(winningIndex);
        }
    }
}
