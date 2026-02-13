const canvas = document.createElement('canvas');
document.body.appendChild(canvas);
const ctx = canvas.getContext('2d');

canvas.style.position = 'fixed';
canvas.style.top = '0';
canvas.style.left = '0';
canvas.style.width = '100%';
canvas.style.height = '100%';
canvas.style.zIndex = '-1';
canvas.style.pointerEvents = 'none';

let width, height;
let boids = [];
const numBoids = 150; // Number of points in the flock
let time = 0;

// Mouse interaction
const mouse = { x: -1000, y: -1000 };

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.originX = x;
        this.originY = y;
        // Random offset for floating motion
        this.angle = Math.random() * Math.PI * 2;
        this.baseRadius = 1.5 + Math.random() * 2;
        this.distortion = 0;
        this.color = 'rgba(0,0,0,0)';
    }

    update() {
        // Water-like organic floating (Multi-axis sine waves)
        // Slower time factor for viscosity feel
        const t = time * 0.5;

        // Horizontal drift depends on vertical position (wave effect)
        const driftX = Math.sin(t + this.originY * 0.01) * 3 + Math.sin(t * 0.5 + this.originX * 0.02) * 2;

        // Vertical lift/fall depends on horizontal position
        const driftY = Math.cos(t + this.originX * 0.01) * 3 + Math.cos(t * 0.3 + this.originY * 0.02) * 2;

        this.x = this.originX + driftX;
        this.y = this.originY + driftY;

        // Mouse interaction
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Visibility and Color logic
        if (dist < 200) {
            // Calculate opacity/visibility based on distance
            const visibility = (200 - dist) / 200;

            // Minimalist Black Only
            // Revert to black with varying opacity
            this.color = `rgba(0, 0, 0, ${visibility})`;

            // Reduced distortion for smoother look
            // Less intensity on the "pulse"
            this.distortion = visibility * 0.5; // Reduced from 1.5
        } else {
            this.color = 'rgba(0,0,0,0)'; // Hidden
            this.distortion = 0;
        }
    }

    draw() {
        if (this.color === 'rgba(0,0,0,0)') return;

        ctx.fillStyle = this.color;
        ctx.beginPath();

        // Draw irregular shape
        const points = 6;
        for (let i = 0; i < points; i++) {
            const angle = (i / points) * Math.PI * 2;
            const irregularity = Math.sin(angle * 3) * 0.5;
            const dynamicDistortion = Math.sin(angle * 5 + time * 5) * this.distortion;

            const r = this.baseRadius + irregularity + dynamicDistortion;

            const px = this.x + Math.cos(angle) * r;
            const py = this.y + Math.sin(angle) * r;

            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }

        ctx.closePath();
        ctx.fill();
    }
}

function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    initPoints();
}

function initPoints() {
    boids = [];
    // Create a grid distribution covering the screen
    const gap = 35; // Grid spacing
    const cols = Math.ceil(width / gap);
    const rows = Math.ceil(height / gap);

    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            // Add some jitter to grid positions for organic feel
            const x = i * gap + (Math.random() - 0.5) * 10;
            const y = j * gap + (Math.random() - 0.5) * 10;
            boids.push(new Point(x, y));
        }
    }
}

window.addEventListener('resize', resize);
window.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

function animate() {
    ctx.clearRect(0, 0, width, height);
    time += 0.05;

    for (let point of boids) {
        point.update();
        point.draw();
    }

    requestAnimationFrame(animate);
}

resize();
animate();
