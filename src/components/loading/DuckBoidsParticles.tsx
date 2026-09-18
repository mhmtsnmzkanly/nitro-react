import { FC, useEffect, useRef } from 'react';

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
    life: number;
    maxLife: number;
    trail: { x: number; y: number }[];
}

export const DuckBoidsParticles: FC = () =>
{
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() =>
    {
        const canvas = canvasRef.current;
        if(!canvas) return;

        const ctx = canvas.getContext('2d');
        if(!ctx) return;

        let animationFrameId: number;
        let width = (canvas.width = window.innerWidth);
        let height = (canvas.height = window.innerHeight);

        const handleResize = () =>
        {
            if(!canvas) return;
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };

        const mouse = {
            x: -9999,
            y: -9999,
            active: false
        };

        const handleMouseMove = (e: MouseEvent) =>
        {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
            mouse.active = true;
        };

        const handleTouchMove = (e: TouchEvent) =>
        {
            if(e.touches.length > 0)
            {
                mouse.x = e.touches[0].clientX;
                mouse.y = e.touches[0].clientY;
                mouse.active = true;
            }
        };

        const handleMouseLeave = () =>
        {
            mouse.active = false;
            mouse.x = -9999;
            mouse.y = -9999;
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('touchmove', handleTouchMove, { passive: true });
        window.addEventListener('mouseleave', handleMouseLeave);
        window.addEventListener('touchend', handleMouseLeave);

        const PARTICLE_COUNT = 65;
        const particles: Particle[] = [];

        // Habbo duck-themed warm & sparkling palette: yellow, bright gold, orange, energetic cyan & soft white
        const colors = [
            '#FBD000', // Classic duck yellow
            '#FFE347', // Light yellow glow
            '#FFAE00', // Orange-yellow beak
            '#FFFFFF', // Sparkle white
            '#38BDF8', // Water cyan accent
            '#F97316'  // Beak orange
        ];

        const spawnFromCenter = (p?: Particle): Particle =>
        {
            const cx = width / 2;
            const cy = height / 2;
            // Spawn in a radius around center duck
            const angle = Math.random() * Math.PI * 2;
            const dist = 30 + Math.random() * 50;
            const speed = 1.2 + Math.random() * 2.6;

            const newP: Particle = p || {
                x: 0,
                y: 0,
                vx: 0,
                vy: 0,
                size: 2,
                color: colors[0],
                life: 0,
                maxLife: 100,
                trail: []
            };

            newP.x = cx + Math.cos(angle) * dist;
            newP.y = cy + Math.sin(angle) * dist;
            newP.vx = Math.cos(angle) * speed + (Math.random() - 0.5) * 1.5;
            newP.vy = Math.sin(angle) * speed + (Math.random() - 0.5) * 1.5;
            newP.size = 2 + Math.random() * 2.8;
            newP.color = colors[Math.floor(Math.random() * colors.length)];
            newP.life = 0;
            newP.maxLife = 180 + Math.random() * 180;
            newP.trail = [];

            return newP;
        };

        for(let i = 0; i < PARTICLE_COUNT; i++)
        {
            const p = spawnFromCenter();
            // Stagger initial progress
            p.life = Math.random() * p.maxLife;
            // Pre-warm position outward
            p.x += p.vx * (p.life * 0.3);
            p.y += p.vy * (p.life * 0.3);
            particles.push(p);
        }

        // Boids flocking rules parameters
        const visualRange = 90;
        const minDistance = 25;
        const centerDuckRadius = 110; // keep particles flocking and swirling around duck

        const animate = () =>
        {
            ctx.clearRect(0, 0, width, height);

            const cx = width / 2;
            const cy = height / 2;

            for(let i = 0; i < particles.length; i++)
            {
                const p = particles[i];
                p.life++;

                if(p.life >= p.maxLife || p.x < -100 || p.x > width + 100 || p.y < -100 || p.y > height + 100)
                {
                    spawnFromCenter(p);
                    continue;
                }

                // --- BOIDS FLOCKING BEHAVIORS ---
                let separationX = 0;
                let separationY = 0;
                let alignmentVx = 0;
                let alignmentVy = 0;
                let cohesionX = 0;
                let cohesionY = 0;
                let neighbors = 0;

                for(let j = 0; j < particles.length; j++)
                {
                    if(i === j) continue;
                    const other = particles[j];
                    const dx = other.x - p.x;
                    const dy = other.y - p.y;
                    const distSq = dx * dx + dy * dy;

                    if(distSq < visualRange * visualRange)
                    {
                        const dist = Math.sqrt(distSq);
                        if(dist < minDistance && dist > 0.0001)
                        {
                            // Separation
                            separationX -= (dx / dist) * (1 - dist / minDistance) * 0.6;
                            separationY -= (dy / dist) * (1 - dist / minDistance) * 0.6;
                        }

                        // Alignment
                        alignmentVx += other.vx;
                        alignmentVy += other.vy;

                        // Cohesion
                        cohesionX += other.x;
                        cohesionY += other.y;

                        neighbors++;
                    }
                }

                if(neighbors > 0)
                {
                    alignmentVx /= neighbors;
                    alignmentVy /= neighbors;
                    cohesionX /= neighbors;
                    cohesionY /= neighbors;

                    p.vx += (alignmentVx - p.vx) * 0.04;
                    p.vy += (alignmentVy - p.vy) * 0.04;

                    p.vx += (cohesionX - p.x) * 0.0015;
                    p.vy += (cohesionY - p.y) * 0.0015;
                }

                p.vx += separationX;
                p.vy += separationY;

                // Center repulsion & orbital swirl:
                // Gentle outward push from duck center, plus swirling tangential force
                const dxCenter = p.x - cx;
                const dyCenter = p.y - cy;
                const distCenter = Math.sqrt(dxCenter * dxCenter + dyCenter * dyCenter) || 1;

                if(distCenter < centerDuckRadius)
                {
                    // Push outward strongly if inside duck zone
                    const pushForce = (centerDuckRadius - distCenter) / centerDuckRadius * 0.35;
                    p.vx += (dxCenter / distCenter) * pushForce;
                    p.vy += (dyCenter / distCenter) * pushForce;
                }

                // Add slight clockwise orbit force around center
                const orbitForce = 0.025;
                const perpX = -dyCenter / distCenter;
                const perpY = dxCenter / distCenter;
                p.vx += perpX * orbitForce;
                p.vy += perpY * orbitForce;

                // Boundary soft pull towards screen bounds
                const margin = 100;
                const turnFactor = 0.2;
                if(p.x < margin) p.vx += turnFactor;
                if(p.x > width - margin) p.vx -= turnFactor;
                if(p.y < margin) p.vy += turnFactor;
                if(p.y > height - margin) p.vy -= turnFactor;

                // Mouse / Cursor avoidance behavior (fareden kaçma)
                if(mouse.active)
                {
                    const mouseAvoidRadius = 140;
                    const dxMouse = p.x - mouse.x;
                    const dyMouse = p.y - mouse.y;
                    const distMouseSq = dxMouse * dxMouse + dyMouse * dyMouse;

                    if(distMouseSq < mouseAvoidRadius * mouseAvoidRadius)
                    {
                        const distMouse = Math.sqrt(distMouseSq) || 1;
                        const factor = (mouseAvoidRadius - distMouse) / mouseAvoidRadius;
                        // Strong radial repulsion impulse proportional to proximity
                        const avoidForce = factor * factor * 2.8;
                        p.vx += (dxMouse / distMouse) * avoidForce;
                        p.vy += (dyMouse / distMouse) * avoidForce;
                    }
                }

                // Clamp speed
                const currentSpeed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
                const minSpeed = 1.0;
                // Allow sudden bursts when evading the mouse
                const maxSpeed = mouse.active ? 6.5 : 4.0;
                if(currentSpeed > maxSpeed)
                {
                    p.vx = (p.vx / currentSpeed) * maxSpeed;
                    p.vy = (p.vy / currentSpeed) * maxSpeed;
                }
                else if(currentSpeed < minSpeed && currentSpeed > 0)
                {
                    p.vx = (p.vx / currentSpeed) * minSpeed;
                    p.vy = (p.vy / currentSpeed) * minSpeed;
                }

                // Position update
                p.x += p.vx;
                p.y += p.vy;

                // Record trail history
                p.trail.push({ x: p.x, y: p.y });
                if(p.trail.length > 5) p.trail.shift();

                // Fade alpha according to lifetime
                const progress = p.life / p.maxLife;
                const alpha = progress < 0.15 ? progress / 0.15 : (1 - progress);

                // Draw trail
                if(p.trail.length > 1)
                {
                    ctx.save();
                    ctx.beginPath();
                    ctx.moveTo(p.trail[0].x, p.trail[0].y);
                    for(let t = 1; t < p.trail.length; t++)
                    {
                        ctx.lineTo(p.trail[t].x, p.trail[t].y);
                    }
                    ctx.strokeStyle = p.color;
                    ctx.globalAlpha = Math.max(0, alpha * 0.35);
                    ctx.lineWidth = p.size * 0.7;
                    ctx.stroke();
                    ctx.restore();
                }

                // Draw particle (boid) with directional orientation or spark
                ctx.save();
                ctx.globalAlpha = Math.max(0, alpha);
                ctx.fillStyle = p.color;
                ctx.shadowColor = p.color;
                ctx.shadowBlur = 6;

                ctx.translate(p.x, p.y);
                const angle = Math.atan2(p.vy, p.vx);
                ctx.rotate(angle);

                // Elongated boid teardrop / spark shape
                ctx.beginPath();
                ctx.moveTo(p.size * 1.5, 0);
                ctx.lineTo(-p.size, p.size * 0.7);
                ctx.lineTo(-p.size * 0.5, 0);
                ctx.lineTo(-p.size, -p.size * 0.7);
                ctx.closePath();
                ctx.fill();

                ctx.restore();
            }

            animationFrameId = requestAnimationFrame(animate);
        };

        animate();

        return () =>
        {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('mouseleave', handleMouseLeave);
            window.removeEventListener('touchend', handleMouseLeave);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={ canvasRef }
            className="duck-boids-canvas"
        />
    );
};
