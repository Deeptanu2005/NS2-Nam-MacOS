(() => {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  // Quiet particle field in the landing-page hero; paused for reduced motion.
  const canvas = document.querySelector('.network-canvas');
  if (canvas) {
    const context = canvas.getContext('2d');
    if (context) {
      const controller = new AbortController();
      let width = 0, height = 0, particles = [], frame = 0, running = false;
      const motionAllowed = () => !reduceMotion.matches && !root.classList.contains('animations-off');
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
      const colorToRgb = color => {
        const hex = color.trim().match(/^#([\da-f]{6})$/i)?.[1];
        if (!hex) return '125, 207, 223';
        return [0, 2, 4].map(offset => parseInt(hex.slice(offset, offset + 2), 16)).join(', ');
      };
      const draw = () => {
        if (!running) return;
        context.clearRect(0, 0, width, height);
        const point = colorToRgb(getComputedStyle(root).getPropertyValue('--cyan'));
        const link = colorToRgb(getComputedStyle(root).getPropertyValue('--blue'));
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
              context.strokeStyle = `rgba(${link}, ${(1 - distance / 115) * .13})`;
              context.lineWidth = .6; context.stroke();
            }
          }
        }
        frame = requestAnimationFrame(draw);
      };
      const start = () => {
        if (!running && motionAllowed()) { running = true; draw(); }
      };
      const stop = () => {
        if (running) { running = false; cancelAnimationFrame(frame); }
      };
      resize(); start();
      window.addEventListener('resize', resize, { passive: true, signal: controller.signal });
      document.addEventListener('site:motionchange', () => motionAllowed() ? start() : stop(), { signal: controller.signal });
      reduceMotion.addEventListener('change', () => motionAllowed() ? start() : stop(), { signal: controller.signal });
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) stop();
        else start();
      }, { signal: controller.signal });
      window.__ns2AnimationEngineCleanup = () => { stop(); controller.abort(); };
    }
  }
})();
