(() => {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  // Quiet particle field in the landing-page hero; paused for reduced motion.
  const canvas = document.querySelector('.network-canvas');
  if (canvas && !reduceMotion.matches) {
    const context = canvas.getContext('2d');
    if (context) {
      let width = 0, height = 0, particles = [], frame = 0, running = true;
      const resize = () => {
        const rect = canvas.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        width = rect.width; height = rect.height;
        canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
        context.setTransform(dpr, 0, 0, dpr, 0, 0);
        const count = Math.min(50, Math.max(20, Math.floor(width / 23)));
        particles = Array.from({ length: count }, () => ({
          x: Math.random() * width, y: Math.random() * height,
          vx: (Math.random() - .5) * .18, vy: (Math.random() - .5) * .15,
          r: Math.random() * 1.4 + .4
        }));
      };
      const draw = () => {
        if (!running) return;
        context.clearRect(0, 0, width, height);
        const light = root.dataset.theme === 'light';
        const point = light ? '37, 110, 128' : '125, 207, 223';
        for (let i = 0; i < particles.length; i += 1) {
          const p = particles[i];
          p.x += p.vx; p.y += p.vy;
          if (p.x < 0 || p.x > width) p.vx *= -1;
          if (p.y < 0 || p.y > height) p.vy *= -1;
          context.beginPath(); context.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          context.fillStyle = `rgba(${point}, .58)`; context.fill();
          for (let j = i + 1; j < particles.length; j += 1) {
            const q = particles[j];
            const dx = p.x - q.x, dy = p.y - q.y, distance = Math.hypot(dx, dy);
            if (distance < 115) {
              context.beginPath(); context.moveTo(p.x, p.y); context.lineTo(q.x, q.y);
              context.strokeStyle = `rgba(${point}, ${(1 - distance / 115) * .13})`;
              context.lineWidth = .6; context.stroke();
            }
          }
        }
        frame = requestAnimationFrame(draw);
      };
      resize(); draw();
      window.addEventListener('resize', resize, { passive: true });
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) { running = false; cancelAnimationFrame(frame); }
        else if (!running) { running = true; draw(); }
      });
    }
  }
})();
