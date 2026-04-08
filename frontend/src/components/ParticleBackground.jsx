import { useEffect, useRef } from 'react';

const PARTICLE_COUNT = 130;
const COLORS = ['#00F5FF', '#8B5CF6', '#00F5FF', '#34d399', '#00F5FF'];

function randomBetween(a, b) {
  return a + Math.random() * (b - a);
}

export default function ParticleBackground() {
  const canvasRef = useRef(null);
  const frameRef = useRef(null);
  const particlesRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Init particles
    particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: randomBetween(0, canvas.width),
      y: randomBetween(0, canvas.height),
      r: randomBetween(0.5, 2.2),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      vx: randomBetween(-0.15, 0.15),
      vy: randomBetween(-0.12, 0.12),
      alpha: randomBetween(0.1, 0.45),
      alphaDir: randomBetween(0.001, 0.005),
    }));

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particlesRef.current.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha += p.alphaDir;
        if (p.alpha > 0.45 || p.alpha < 0.05) p.alphaDir *= -1;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
      frameRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 0.7,
      }}
    />
  );
}
