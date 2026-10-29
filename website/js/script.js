(() => {
  const root = document.documentElement;
  root.classList.add('js');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const accentPalettes = {
    aqua: { dark: ['#72e4dc', '#67a8ff', '#b297ff'], light: ['#087d78', '#276dd3', '#6846cf'] },
    blue: { dark: ['#89baff', '#79a4ff', '#bba7ff'], light: ['#145cb8', '#2451b8', '#563fb4'] },
    violet: { dark: ['#c6a5ff', '#9e8dff', '#e1a3ff'], light: ['#7045b5', '#5545bd', '#9f3eb3'] },
    amber: { dark: ['#ffd083', '#ffad5f', '#ff8f8f'], light: ['#925100', '#b44d00', '#b8334c'] },
    rose: { dark: ['#ff9fb7', '#ff8dbb', '#c19cff'], light: ['#ad315d', '#b12e76', '#693eb0'] },
  };
  const validCustomAccent = value => /^#[\da-f]{6}$/i.test(value || '');
  const pickerLimits = { minSaturation: .3, maxSaturation: 1, minValue: .52, maxValue: .96 };
  const readAccentCookie = () => {
    const entry = document.cookie.split('; ').find(cookie => cookie.startsWith('ns2nam-accent='));
    if (!entry) return null;
    try { return decodeURIComponent(entry.slice('ns2nam-accent='.length)); } catch (_) { return null; }
  };
  const writeAccentCookie = accent => {
    const secure = location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `ns2nam-accent=${encodeURIComponent(accent)}; Max-Age=31536000; Path=/; SameSite=Lax${secure}`;
  };
  const hexToHsl = hex => {
    const values = hex.slice(1).match(/.{2}/g).map(part => parseInt(part, 16) / 255);
    const max = Math.max(...values), min = Math.min(...values), delta = max - min;
    let hue = 0;
    const lightness = (max + min) / 2;
    const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));
    if (delta) {
      if (max === values[0]) hue = ((values[1] - values[2]) / delta) % 6;
      else if (max === values[1]) hue = (values[2] - values[0]) / delta + 2;
      else hue = (values[0] - values[1]) / delta + 4;
      hue *= 60;
    }
    return [((hue + 360) % 360), saturation, lightness];
  };
  const hslToHex = (hue, saturation, lightness) => {
    const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
    const section = ((hue % 360) + 360) % 360 / 60;
    const secondary = chroma * (1 - Math.abs(section % 2 - 1));
    const [red, green, blue] = section < 1 ? [chroma, secondary, 0]
      : section < 2 ? [secondary, chroma, 0]
      : section < 3 ? [0, chroma, secondary]
      : section < 4 ? [0, secondary, chroma]
      : section < 5 ? [secondary, 0, chroma] : [chroma, 0, secondary];
    const match = lightness - chroma / 2;
    return `#${[red, green, blue].map(value => Math.round((value + match) * 255).toString(16).padStart(2, '0')).join('')}`;
  };
  const hslToHsv = (hue, saturation, lightness) => {
    const value = lightness + saturation * Math.min(lightness, 1 - lightness);
    return [hue, value === 0 ? 0 : 2 * (1 - lightness / value), value];
  };
  const constrainPickerHsv = ([hue, saturation, value], fallbackHue = 215) => [
    Number.isFinite(hue) ? (hue + 360) % 360 : fallbackHue,
    Math.max(pickerLimits.minSaturation, Math.min(pickerLimits.maxSaturation, saturation)),
    Math.max(pickerLimits.minValue, Math.min(pickerLimits.maxValue, value)),
  ];
  const hsvToHex = (hue, saturation, value) => {
    const lightness = value * (1 - saturation / 2);
    const hslSaturation = lightness === 0 || lightness === 1 ? 0 : (value - lightness) / Math.min(lightness, 1 - lightness);
    return hslToHex(hue, hslSaturation, lightness);
  };
  const customAccentPalette = (hex, light) => {
    const [hue, saturation, lightness] = hexToHsl(hex);
    const sat = Math.max(.58, saturation);
    const tone = light ? Math.max(.34, Math.min(.46, lightness)) : Math.max(.66, Math.min(.78, lightness));
    return [hslToHex(hue, Math.min(.92, Math.max(sat, .72)), tone),
      hslToHex(hue + 28, Math.min(.9, Math.max(sat * .9, .66)), tone),
      hslToHex(hue - 32, Math.min(.88, Math.max(sat * .82, .62)), tone)];
  };
  let activeAccent = 'blue';
  let cookieAccent = null;
  try {
    cookieAccent = readAccentCookie();
  } catch (_) {}
  if (accentPalettes[cookieAccent] || validCustomAccent(cookieAccent)) activeAccent = cookieAccent;
  else {
    try {
      const legacyAccent = localStorage.getItem('ns2nam-accent');
      if (accentPalettes[legacyAccent] || validCustomAccent(legacyAccent)) {
        activeAccent = legacyAccent;
        writeAccentCookie(legacyAccent);
      }
    } catch (_) {}
  }
  if (validCustomAccent(activeAccent)) {
    const [hue, saturation, lightness] = hexToHsl(activeAccent);
    const [, hsvSaturation, value] = hslToHsv(hue, saturation, lightness);
    if (hsvSaturation < pickerLimits.minSaturation || value < pickerLimits.minValue || value > pickerLimits.maxValue) {
      activeAccent = 'blue';
      writeAccentCookie(activeAccent);
      try { localStorage.setItem('ns2nam-accent', activeAccent); } catch (_) {}
    }
  }
  const applySiteAccent = (accent = activeAccent, persist = false) => {
    activeAccent = accentPalettes[accent] || validCustomAccent(accent) ? accent : 'aqua';
    const colors = accentPalettes[activeAccent]
      ? accentPalettes[activeAccent][root.dataset.theme === 'light' ? 'light' : 'dark']
      : customAccentPalette(activeAccent, root.dataset.theme === 'light');
    ['--cyan', '--blue', '--violet'].forEach((variable, index) => root.style.setProperty(variable, colors[index]));
    root.style.setProperty('--accent-soft', `color-mix(in srgb, ${colors[0]} 16%, transparent)`);
    root.style.setProperty('--accent-border', `color-mix(in srgb, ${colors[0]} 34%, var(--line-strong))`);
    if (root.classList.contains('high-contrast')) {
      ['--bg', '--bg-soft', '--panel', '--panel-solid', '--panel-light', '--ambient-a', '--ambient-b'].forEach(variable => root.style.removeProperty(variable));
    } else {
      const light = root.dataset.theme === 'light';
      root.style.setProperty('--bg', `color-mix(in srgb, ${light ? '#f4f8f9' : '#081018'} ${light ? '97%' : '94%'}, ${colors[0]} ${light ? '3%' : '6%'})`);
      root.style.setProperty('--bg-soft', `color-mix(in srgb, ${light ? '#e8f0f2' : '#0c1620'} ${light ? '94%' : '90%'}, ${colors[0]} ${light ? '6%' : '10%'})`);
      root.style.setProperty('--panel-solid', `color-mix(in srgb, ${light ? '#ffffff' : '#101d29'} 96%, ${colors[0]})`);
      root.style.setProperty('--panel', `color-mix(in srgb, ${light ? 'rgba(255,255,255,.83)' : 'rgba(16,29,41,.82)'} 96%, ${colors[0]})`);
      root.style.setProperty('--panel-light', `color-mix(in srgb, ${light ? '#f3f8f8' : '#132331'} 95%, ${colors[0]})`);
      root.style.setProperty('--ambient-a', `color-mix(in srgb, ${colors[0]} 18%, transparent)`);
      root.style.setProperty('--ambient-b', `color-mix(in srgb, ${colors[2]} 14%, transparent)`);
    }
    root.dataset.accent = accentPalettes[activeAccent] ? activeAccent : 'custom';
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.content = getComputedStyle(root).getPropertyValue('--bg').trim();
    root.dispatchEvent(new Event('site:accentchange'));
    if (persist) {
      writeAccentCookie(activeAccent);
      try { localStorage.setItem('ns2nam-accent', activeAccent); } catch (_) {}
    }
  };
  const interactiveSelector = 'button, a[href], summary, [role="button"], [role="switch"], input[type="checkbox"], input[type="radio"], input[type="color"], select';
  let uiAudioContext;
  let uiNoiseBuffer;
  const getUiAudioContext = () => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    if (!uiAudioContext) uiAudioContext = new AudioContext();
    if (uiAudioContext.state !== 'running') uiAudioContext.resume().catch(() => {});
    return uiAudioContext;
  };
  const getUiNoiseBuffer = context => {
    if (uiNoiseBuffer) return uiNoiseBuffer;
    const length = Math.ceil(context.sampleRate * .8);
    uiNoiseBuffer = context.createBuffer(1, length, context.sampleRate);
    const samples = uiNoiseBuffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) samples[i] = Math.random() * 2 - 1;
    return uiNoiseBuffer;
  };
  const playUiSound = kind => {
    if (root.classList.contains('sounds-off')) return;
    try {
      const context = getUiAudioContext();
      if (!context) return;

      const recipes = {
        button: [480, 690, .065, .018, 'triangle'],
        toggle: [390, 760, .085, .022, 'sine'],
        'switch-on': [430, 920, .12, .018, 'sine'],
        'switch-off': [760, 360, .13, .016, 'triangle'],
        menu: [340, 610, .095, .02, 'sine'],
        theme: [290, 880, .12, .023, 'sine'],
        navigation: [520, 680, .06, .017, 'triangle'],
        disclosure: [430, 590, .07, .017, 'sine'],
        'window-open': [250, 820, .2, .024, 'sine'],
        'window-restore': [780, 300, .17, .021, 'sine'],
        'node-grab': [560, 360, .07, .014, 'triangle'],
        'node-move': [480, 640, .045, .008, 'sine'],
        'node-drop': [340, 680, .1, .016, 'sine'],
        'pan-start': [260, 430, .06, .012, 'triangle'],
        'pan-end': [430, 300, .075, .012, 'sine'],
        'view-zoom-in': [440, 760, .055, .009, 'sine'],
        'view-zoom-out': [760, 440, .055, .009, 'sine'],
      };
      const [startHz, endHz, duration, volume, waveform] = recipes[kind] || recipes.button;
      const scheduleTone = () => {
        const now = context.currentTime;
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = waveform;
        oscillator.frequency.setValueAtTime(startHz, now);
        oscillator.frequency.exponentialRampToValueAtTime(endHz, now + duration * .72);
        gain.gain.setValueAtTime(.0001, now);
        gain.gain.exponentialRampToValueAtTime(volume, now + .008);
        gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(now);
        oscillator.stop(now + duration + .01);
      };
      if (context.state !== 'running') context.resume().then(scheduleTone).catch(() => {});
      else scheduleTone();
    } catch (_) {
      // Audio is an optional enhancement; controls still work if Web Audio is unavailable.
    }
  };
  window.ns2namPlayUiSound = playUiSound;
  const playThemeWhoosh = nextTheme => {
    if (root.classList.contains('sounds-off')) return;
    try {
      const context = getUiAudioContext();
      if (!context) return;
      const now = context.currentTime;
      const noise = getUiNoiseBuffer(context);
      const lighting = nextTheme === 'light';
      const whoosh = context.createBufferSource();
      const filter = context.createBiquadFilter();
      const gain = context.createGain();
      whoosh.buffer = noise;
      filter.type = 'bandpass';
      filter.Q.setValueAtTime(.55, now);
      filter.frequency.setValueAtTime(lighting ? 170 : 2100, now);
      filter.frequency.exponentialRampToValueAtTime(lighting ? 2100 : 170, now + .55);
      gain.gain.setValueAtTime(.0001, now);
      gain.gain.exponentialRampToValueAtTime(.032, now + .12);
      gain.gain.exponentialRampToValueAtTime(.0001, now + .72);
      whoosh.connect(filter);
      filter.connect(gain);
      gain.connect(context.destination);
      whoosh.start(now);
      whoosh.stop(now + .74);
    } catch (_) {
      // Theme changes work normally if synthesized audio is unavailable.
    }
  };

  const playLiquidMenuSound = opening => {
    if (root.classList.contains('sounds-off')) return;
    try {
      const context = getUiAudioContext();
      if (!context) return;
      const now = context.currentTime;
      const delay = context.createDelay(.2);
      const echo = context.createGain();
      delay.delayTime.setValueAtTime(.065, now);
      echo.gain.setValueAtTime(.13, now);
      delay.connect(echo);
      echo.connect(context.destination);

      const pitches = opening ? [250, 340, 470] : [470, 340, 250];
      pitches.forEach((pitch, index) => {
        const start = now + index * .062;
        const oscillator = context.createOscillator();
        const voice = context.createGain();
        const lowpass = context.createBiquadFilter();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(pitch, start);
        oscillator.frequency.exponentialRampToValueAtTime(pitch * (opening ? 1.65 : .64), start + .035);
        oscillator.frequency.exponentialRampToValueAtTime(pitch * (opening ? .82 : 1.18), start + .082);
        oscillator.frequency.exponentialRampToValueAtTime(pitch * (opening ? 1.08 : .9), start + .125);
        oscillator.frequency.exponentialRampToValueAtTime(pitch * .94, start + .17);
        lowpass.type = 'lowpass';
        lowpass.frequency.setValueAtTime(1450, start);
        voice.gain.setValueAtTime(.0001, start);
        voice.gain.exponentialRampToValueAtTime(.016 - index * .002, start + .009);
        voice.gain.exponentialRampToValueAtTime(.0001, start + .18);
        oscillator.connect(lowpass);
        lowpass.connect(voice);
        voice.connect(context.destination);
        voice.connect(delay);
        oscillator.start(start);
        oscillator.stop(start + .19);
      });
    } catch (_) {
      // Menu controls remain usable if synthesized audio is unavailable.
    }
  };

  const playCandleClickSound = nextTheme => {
    if (root.classList.contains('sounds-off')) return;
    try {
      const context = getUiAudioContext();
      if (!context) return;
      const now = context.currentTime;
      const noise = getUiNoiseBuffer(context);
      const lighting = nextTheme === 'light';

      const fire = context.createBufferSource();
      const fireFilter = context.createBiquadFilter();
      const fireGain = context.createGain();
      fire.buffer = noise;
      fireFilter.type = 'lowpass';
      fireFilter.frequency.setValueAtTime(900, now);
      fireFilter.frequency.exponentialRampToValueAtTime(lighting ? 1450 : 360, now + (lighting ? .62 : .25));
      fireGain.gain.setValueAtTime(.0001, now);
      fireGain.gain.exponentialRampToValueAtTime(lighting ? .012 : .009, now + .045);
      fireGain.gain.exponentialRampToValueAtTime(.0001, now + (lighting ? .64 : .28));
      fire.connect(fireFilter);
      fireFilter.connect(fireGain);
      fireGain.connect(context.destination);
      fire.start(now);
      fire.stop(now + (lighting ? .66 : .3));

      const crackleTimes = lighting ? [.11, .2, .34, .49] : [.035, .105, .18];
      crackleTimes.forEach((offset, index) => {
        const start = now + offset;
        const pop = context.createBufferSource();
        const popFilter = context.createBiquadFilter();
        const popGain = context.createGain();
        pop.buffer = noise;
        popFilter.type = 'bandpass';
        popFilter.frequency.setValueAtTime(1900 + Math.random() * 1500, start);
        popFilter.Q.setValueAtTime(1.1, start);
        const peak = (lighting ? .009 : .006) * (1 - index / (crackleTimes.length * 1.5));
        popGain.gain.setValueAtTime(.0001, start);
        popGain.gain.exponentialRampToValueAtTime(peak, start + .004);
        popGain.gain.exponentialRampToValueAtTime(.0001, start + .032);
        pop.connect(popFilter);
        popFilter.connect(popGain);
        popGain.connect(context.destination);
        pop.start(start);
        pop.stop(start + .04);
      });

      if (!lighting) {
        const smoke = context.createBufferSource();
        const smokeFilter = context.createBiquadFilter();
        const smokeGain = context.createGain();
        smoke.buffer = noise;
        smokeFilter.type = 'highpass';
        smokeFilter.frequency.setValueAtTime(850, now + .06);
        smokeFilter.frequency.exponentialRampToValueAtTime(2400, now + .42);
        smokeGain.gain.setValueAtTime(.0001, now + .06);
        smokeGain.gain.exponentialRampToValueAtTime(.008, now + .13);
        smokeGain.gain.exponentialRampToValueAtTime(.0001, now + .44);
        smoke.connect(smokeFilter);
        smokeFilter.connect(smokeGain);
        smokeGain.connect(context.destination);
        smoke.start(now + .06);
        smoke.stop(now + .46);
      }
    } catch (_) {
      // Theme changes work normally if synthesized audio is unavailable.
    }
  };
  let audioActivationStored = false;
  try { audioActivationStored = sessionStorage.getItem('ns2nam-audio-activated') === '1'; } catch (_) {}
  const unlockAudio = () => {
    if (root.classList.contains('sounds-off')) return;
    try {
      const context = getUiAudioContext();
      if (context && context.state !== 'running') context.resume().catch(() => {});
      if (!audioActivationStored) {
        sessionStorage.setItem('ns2nam-audio-activated', '1');
        audioActivationStored = true;
      }
    } catch (_) {}
  };
  document.addEventListener('pointerdown', event => {
    if (event.button === 0) unlockAudio();
  }, true);
  window.addEventListener('wheel', unlockAudio, { capture: true, passive: true });
  window.addEventListener('touchend', unlockAudio, { capture: true, passive: true });
  document.addEventListener('keydown', event => {
    if (!['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) return;
    if (event.target instanceof Element && event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
    unlockAudio();
  }, true);
  document.addEventListener('click', event => {
    const control = event.target.closest(interactiveSelector);
    if (!control || control.disabled || control.matches('.display-options-toggle, .window-control, .draggable-node')) return;
    if (!root.classList.contains('sounds-off')) {
      try { sessionStorage.setItem('ns2nam-audio-activated', '1'); } catch (_) {}
    }
    if (control.matches('.display-option[data-preference]')) return;
    const kind = control.matches('[data-preference], [role="switch"], input[type="checkbox"], input[type="radio"], input[type="color"]')
      ? 'toggle'
      : control.matches('.display-options-toggle, .menu-toggle')
        ? 'menu'
        : control.matches('.theme-toggle')
          ? 'theme'
          : control.matches('summary')
            ? 'disclosure'
            : control.matches('a[href]')
              ? 'navigation'
              : 'button';
    playUiSound(kind);
  }, true);
  const readSessionPreference = key => {
    try { return sessionStorage.getItem(key) === '1'; } catch (_) { return false; }
  };
  root.classList.toggle('animations-off', readSessionPreference('ns2nam-animations-off'));
  root.classList.toggle('high-contrast', readSessionPreference('ns2nam-high-contrast'));
  root.classList.toggle('sounds-off', readSessionPreference('ns2nam-mute-interface-sounds-v2'));
  const siteHeader = document.querySelector('.site-header');
  const navShell = siteHeader?.querySelector('.nav-shell');
  const navActions = siteHeader?.querySelector('.nav-actions');
  let navReturnTimer;
  const updateFloatingNav = () => {
    if (!siteHeader) return;
    const isFloating = siteHeader.classList.contains('is-floating');
    // Use separate enter/exit points so slow scrolling near the boundary cannot chatter the animation.
    const shouldFloat = isFloating ? window.scrollY > 96 : window.scrollY > 160;
    const detachActions = shouldFloat && window.matchMedia('(min-width: 981px)').matches;
    const actionsParent = detachActions ? siteHeader : navShell;
    if (navActions && actionsParent && navActions.parentElement !== actionsParent) actionsParent.append(navActions);
    if (shouldFloat === isFloating) return;
    clearTimeout(navReturnTimer);
    siteHeader.classList.remove('is-unfloating');
    siteHeader.classList.toggle('is-floating', shouldFloat);
    if (!shouldFloat) {
      siteHeader.classList.add('is-unfloating');
      navReturnTimer = setTimeout(() => siteHeader.classList.remove('is-unfloating'), 650);
    }
  };
  updateFloatingNav();
  window.addEventListener('scroll', updateFloatingNav, { passive: true });
  window.addEventListener('resize', updateFloatingNav, { passive: true });
  if (!root.classList.contains('sounds-off') && readSessionPreference('ns2nam-audio-activated')) {
    try { getUiAudioContext()?.resume().catch(() => {}); } catch (_) {}
  }

  if (navActions) {
    const displayOptions = document.createElement('div');
    displayOptions.className = 'display-options';
    displayOptions.innerHTML = `<button class="display-options-toggle" type="button" aria-label="Open options" aria-expanded="false" aria-controls="display-options-panel" title="Options"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 6h14M5 12h14M5 18h14"/><circle cx="9" cy="6" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="8" cy="18" r="2"/></svg></button>
      <section class="display-options-panel" id="display-options-panel" aria-label="Options" hidden>
        <h2>Options</h2>
        <section class="display-options-group display-theme-group" aria-labelledby="display-theme-heading">
          <h3 id="display-theme-heading">Theme color</h3>
          <div class="theme-color-controls">
            <div class="accent-swatches" role="group" aria-label="Preset theme colors">
              <button class="accent-swatch" type="button" data-accent-choice="aqua" aria-label="Aqua theme color" title="Aqua" style="--swatch-color:#25bfb4"><span></span></button>
              <button class="accent-swatch" type="button" data-accent-choice="blue" aria-label="Blue theme color" title="Blue" style="--swatch-color:#4d82e8"><span></span></button>
              <button class="accent-swatch" type="button" data-accent-choice="violet" aria-label="Violet theme color" title="Violet" style="--swatch-color:#9a66df"><span></span></button>
              <button class="accent-swatch" type="button" data-accent-choice="amber" aria-label="Amber theme color" title="Amber" style="--swatch-color:#d98a32"><span></span></button>
              <button class="accent-swatch" type="button" data-accent-choice="rose" aria-label="Rose theme color" title="Rose" style="--swatch-color:#df5c88"><span></span></button>
            </div>
            <div class="custom-color-picker">
              <button class="custom-picker-trigger" type="button" aria-expanded="false" aria-controls="custom-picker-popover"><span class="custom-picker-swatch"></span><span>Custom color</span><code class="custom-accent-value">#89BAFF</code><span class="custom-picker-chevron" aria-hidden="true"><svg viewBox="0 0 12 12"><path d="m2.5 4.5 3.5 3 3.5-3"/></svg></span></button>
              <div class="custom-picker-popover" id="custom-picker-popover" hidden>
                <div class="custom-picker-field" role="slider" tabindex="0" aria-label="Color saturation and brightness" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100"><span class="custom-picker-thumb"></span></div>
                <label class="custom-picker-hue"><span>HUE</span><input class="custom-picker-hue-input" type="range" min="0" max="359" value="215" aria-label="Color hue"></label>
                <div class="custom-picker-footer"><span class="custom-picker-preview"></span><label for="custom-picker-hex">HEX<input id="custom-picker-hex" class="custom-picker-hex" type="text" value="#89BAFF" maxlength="7" spellcheck="false" aria-label="Hex color value"></label></div>
              </div>
            </div>
          </div>
          <p class="theme-color-note">Tints accents and page background.</p>
        </section>
        <section class="display-options-group" aria-labelledby="display-sound-heading">
          <h3 id="display-sound-heading">Sound</h3>
          <button class="display-option" type="button" role="switch" data-preference="sounds-off" aria-checked="false"><span class="display-option-copy"><b>Turn off sounds</b><small>Mute interface sounds for this session.</small></span><span class="display-switch" aria-hidden="true"><span class="display-switch-sheen"></span></span></button>
        </section>
        <section class="display-options-group" aria-labelledby="display-motion-heading">
          <h3 id="display-motion-heading">Motion</h3>
          <button class="display-option" type="button" role="switch" data-preference="animations-off" aria-checked="false"><span class="display-option-copy"><b>Turn off animations</b><small>Reduce motion and visual effects for smoother performance.</small></span><span class="display-switch" aria-hidden="true"><span class="display-switch-sheen"></span></span></button>
        </section>
        <section class="display-options-group" aria-labelledby="display-visibility-heading">
          <h3 id="display-visibility-heading">Visibility</h3>
          <button class="display-option" type="button" role="switch" data-preference="high-contrast" aria-checked="false"><span class="display-option-copy"><b>High contrast</b><small>Strengthen text and panel contrast for visibility.</small></span><span class="display-switch" aria-hidden="true"><span class="display-switch-sheen"></span></span></button>
        </section>
      </section>`;
    navActions.append(displayOptions);
    const trigger = displayOptions.querySelector('.display-options-toggle');
    const panel = displayOptions.querySelector('.display-options-panel');
    let closeCustomPicker = null;
    let closeTimer;
    const setOpen = open => {
      const currentlyOpen = trigger.getAttribute('aria-expanded') === 'true';
      if (open === currentlyOpen) return;
      window.clearTimeout(closeTimer);
      playLiquidMenuSound(open);
      if (open) {
        panel.hidden = false;
        panel.classList.remove('is-closing');
        requestAnimationFrame(() => {
          if (trigger.getAttribute('aria-expanded') === 'true') panel.classList.add('is-open');
        });
      } else {
        closeCustomPicker?.();
        panel.classList.remove('is-open');
        if (root.classList.contains('animations-off') || reduceMotion.matches) {
          panel.classList.remove('is-closing');
          panel.hidden = true;
        } else {
          panel.classList.add('is-closing');
          closeTimer = window.setTimeout(() => {
            panel.hidden = true;
            panel.classList.remove('is-closing');
          }, 440);
        }
      }
      trigger.setAttribute('aria-expanded', String(open));
      trigger.setAttribute('aria-label', open ? 'Close options' : 'Open options');
      root.classList.toggle('options-overlay-open', open || root.classList.contains('options-picker-open'));
    };
    const syncOptions = () => {
      displayOptions.querySelectorAll('[data-preference]').forEach(option => {
        option.setAttribute('aria-checked', String(root.classList.contains(option.dataset.preference)));
      });
    };
    const pickerTrigger = displayOptions.querySelector('.custom-picker-trigger');
    const pickerPopover = displayOptions.querySelector('.custom-picker-popover');
    const customColorPicker = displayOptions.querySelector('.custom-color-picker');
    const pickerField = displayOptions.querySelector('.custom-picker-field');
    const pickerHue = displayOptions.querySelector('.custom-picker-hue-input');
    const pickerHex = displayOptions.querySelector('.custom-picker-hex');
    const pickerSwatch = displayOptions.querySelector('.custom-picker-swatch');
    const pickerPreview = displayOptions.querySelector('.custom-picker-preview');
    const accentValue = displayOptions.querySelector('.custom-accent-value');
    const accentSwatches = [...displayOptions.querySelectorAll('[data-accent-choice]')];
    let pickerHsv = [215, .65, 1];
    let pickerCloseTimer;
    const positionFloatingPicker = () => {
      const anchor = pickerTrigger.getBoundingClientRect();
      const width = Math.min(320, window.innerWidth - 24);
      const height = Math.max(pickerPopover.scrollHeight, 270);
      const left = Math.max(12, Math.min(window.innerWidth - width - 12, anchor.right - width));
      let top = anchor.bottom + 10;
      if (top + height > window.innerHeight - 12) top = Math.max(12, anchor.top - height - 10);
      pickerPopover.style.left = `${left}px`;
      pickerPopover.style.top = `${top}px`;
      pickerPopover.style.width = `${width}px`;
      pickerPopover.style.setProperty('--picker-origin-x', `${Math.max(8, Math.min(92, ((anchor.right - left) / width) * 100))}%`);
      pickerPopover.style.setProperty('--picker-origin-y', top >= anchor.bottom ? '0%' : '100%');
    };
    const blockOutsideClickThrough = event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      let expiryTimer;
      const swallowClick = clickEvent => {
        clickEvent.preventDefault();
        clickEvent.stopImmediatePropagation();
        clearTimeout(expiryTimer);
        document.removeEventListener('click', swallowClick, true);
      };
      document.addEventListener('click', swallowClick, true);
      expiryTimer = window.setTimeout(() => document.removeEventListener('click', swallowClick, true), 700);
    };
    const onPickerOutsidePointer = event => {
      if (pickerPopover.contains(event.target) || pickerTrigger.contains(event.target)) return;
      const insideMenu = displayOptions.contains(event.target);
      closeCustomPicker?.();
      if (!insideMenu) setOpen(false);
      blockOutsideClickThrough(event);
    };
    const onPickerEscape = event => {
      if (event.key === 'Escape' && pickerTrigger.getAttribute('aria-expanded') === 'true') {
        event.stopImmediatePropagation();
        closeCustomPicker?.();
        pickerTrigger.focus();
      }
    };
    const detachFloatingPickerEvents = () => {
      document.removeEventListener('pointerdown', onPickerOutsidePointer, true);
      document.removeEventListener('keydown', onPickerEscape, true);
      document.removeEventListener('scroll', positionFloatingPicker, true);
      window.removeEventListener('resize', positionFloatingPicker);
    };
    const finishFloatingPickerClose = () => {
      pickerPopover.hidden = true;
      pickerPopover.classList.remove('is-closing', 'is-open');
      pickerPopover.removeAttribute('style');
      customColorPicker.append(pickerPopover);
    };
    closeCustomPicker = () => {
      if (pickerTrigger.getAttribute('aria-expanded') !== 'true') return;
      clearTimeout(pickerCloseTimer);
      pickerTrigger.setAttribute('aria-expanded', 'false');
      root.classList.remove('options-picker-open');
      root.classList.toggle('options-overlay-open', trigger.getAttribute('aria-expanded') === 'true');
      pickerPopover.classList.remove('is-open');
      detachFloatingPickerEvents();
      if (root.classList.contains('animations-off') || reduceMotion.matches) finishFloatingPickerClose();
      else {
        pickerPopover.classList.add('is-closing');
        pickerCloseTimer = window.setTimeout(finishFloatingPickerClose, 440);
      }
    };
    const setPickerColor = (hex, persist = false) => {
      if (!validCustomAccent(hex)) return;
      const [hue, saturation, lightness] = hexToHsl(hex);
      const nextHsv = hslToHsv(hue, saturation, lightness);
      const visibleHue = nextHsv[1] < pickerLimits.minSaturation ? pickerHsv[0] : hue;
      pickerHsv = constrainPickerHsv([visibleHue, nextHsv[1], nextHsv[2]], pickerHsv[0]);
      const normalizedHex = hsvToHex(...pickerHsv);
      pickerHue.value = String(Math.round(pickerHsv[0]));
      pickerField.style.setProperty('--picker-hue', `${pickerHsv[0]}deg`);
      pickerHue.style.setProperty('--picker-hue', `${pickerHsv[0]}deg`);
      pickerField.style.setProperty('--picker-x', `${((pickerHsv[1] - pickerLimits.minSaturation) / (pickerLimits.maxSaturation - pickerLimits.minSaturation)) * 100}%`);
      pickerField.style.setProperty('--picker-y', `${((pickerLimits.maxValue - pickerHsv[2]) / (pickerLimits.maxValue - pickerLimits.minValue)) * 100}%`);
      pickerField.setAttribute('aria-valuenow', String(Math.round(pickerHsv[1] * 100)));
      pickerField.setAttribute('aria-valuetext', `${normalizedHex.toUpperCase()}, saturation ${Math.round(pickerHsv[1] * 100)}%, brightness ${Math.round(pickerHsv[2] * 100)}%`);
      pickerHex.value = normalizedHex.toUpperCase();
      pickerSwatch.style.backgroundColor = normalizedHex;
      pickerPreview.style.backgroundColor = normalizedHex;
      applySiteAccent(normalizedHex, persist);
    };
    const syncAccentControls = () => {
      accentSwatches.forEach(swatch => swatch.setAttribute('aria-pressed', String(swatch.dataset.accentChoice === activeAccent)));
      const selected = validCustomAccent(activeAccent) ? activeAccent : accentPalettes[activeAccent][root.dataset.theme === 'light' ? 'light' : 'dark'][0];
      const [hue, saturation, lightness] = hexToHsl(selected);
      const nextHsv = hslToHsv(hue, saturation, lightness);
      const visibleHue = nextHsv[1] < pickerLimits.minSaturation ? pickerHsv[0] : hue;
      pickerHsv = constrainPickerHsv([visibleHue, nextHsv[1], nextHsv[2]], pickerHsv[0]);
      pickerHue.value = String(Math.round(pickerHsv[0]));
      pickerField.style.setProperty('--picker-hue', `${pickerHsv[0]}deg`);
      pickerHue.style.setProperty('--picker-hue', `${pickerHsv[0]}deg`);
      pickerField.style.setProperty('--picker-x', `${((pickerHsv[1] - pickerLimits.minSaturation) / (pickerLimits.maxSaturation - pickerLimits.minSaturation)) * 100}%`);
      pickerField.style.setProperty('--picker-y', `${((pickerLimits.maxValue - pickerHsv[2]) / (pickerLimits.maxValue - pickerLimits.minValue)) * 100}%`);
      pickerField.setAttribute('aria-valuenow', String(Math.round(pickerHsv[1] * 100)));
      pickerField.setAttribute('aria-valuetext', `${selected.toUpperCase()}, saturation ${Math.round(pickerHsv[1] * 100)}%, brightness ${Math.round(pickerHsv[2] * 100)}%`);
      pickerHex.value = selected.toUpperCase();
      pickerSwatch.style.backgroundColor = selected;
      pickerPreview.style.backgroundColor = selected;
      if (accentValue) accentValue.textContent = selected.toUpperCase();
    };
    root.addEventListener('site:accentchange', syncAccentControls);
    applySiteAccent();
    syncAccentControls();
    if (window.matchMedia('(min-width: 761px) and (hover: hover) and (pointer: fine)').matches) {
      accentSwatches.forEach(swatch => swatch.addEventListener('click', () => {
        applySiteAccent(swatch.dataset.accentChoice, true);
        syncAccentControls();
        playUiSound('toggle');
      }));
      pickerTrigger.addEventListener('click', () => {
        const open = pickerTrigger.getAttribute('aria-expanded') !== 'true';
        clearTimeout(pickerCloseTimer);
        if (open) {
          pickerTrigger.setAttribute('aria-expanded', 'true');
          root.classList.add('options-picker-open', 'options-overlay-open');
          document.body.append(pickerPopover);
          pickerPopover.hidden = false;
          pickerPopover.classList.remove('is-closing');
          positionFloatingPicker();
          requestAnimationFrame(() => pickerPopover.classList.add('is-open'));
          document.addEventListener('pointerdown', onPickerOutsidePointer, true);
          document.addEventListener('keydown', onPickerEscape, true);
          document.addEventListener('scroll', positionFloatingPicker, true);
          window.addEventListener('resize', positionFloatingPicker);
        } else {
          closeCustomPicker();
        }
      });
      const updateFieldFromPointer = event => {
        const bounds = pickerField.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
        const y = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height));
        pickerHsv[1] = pickerLimits.minSaturation + x * (pickerLimits.maxSaturation - pickerLimits.minSaturation);
        pickerHsv[2] = pickerLimits.maxValue - y * (pickerLimits.maxValue - pickerLimits.minValue);
        setPickerColor(hsvToHex(...pickerHsv));
      };
      pickerField.addEventListener('pointerdown', event => {
        event.preventDefault();
        pickerField.setPointerCapture(event.pointerId);
        updateFieldFromPointer(event);
      });
      pickerField.addEventListener('pointermove', event => {
        if (pickerField.hasPointerCapture(event.pointerId)) updateFieldFromPointer(event);
      });
      pickerField.addEventListener('pointerup', () => applySiteAccent(hsvToHex(...pickerHsv), true));
      pickerField.addEventListener('pointercancel', () => applySiteAccent(hsvToHex(...pickerHsv), true));
      pickerField.addEventListener('keydown', event => {
        const step = event.shiftKey ? .1 : .02;
        if (event.key === 'ArrowLeft') pickerHsv[1] = Math.max(0, pickerHsv[1] - step);
        else if (event.key === 'ArrowRight') pickerHsv[1] = Math.min(1, pickerHsv[1] + step);
        else if (event.key === 'ArrowUp') pickerHsv[2] = Math.min(1, pickerHsv[2] + step);
        else if (event.key === 'ArrowDown') pickerHsv[2] = Math.max(0, pickerHsv[2] - step);
        else return;
        event.preventDefault();
        setPickerColor(hsvToHex(...pickerHsv), true);
      });
      pickerHue.addEventListener('input', () => {
        pickerHsv[0] = Number(pickerHue.value);
        pickerField.style.setProperty('--picker-hue', `${pickerHsv[0]}deg`);
        pickerHue.style.setProperty('--picker-hue', `${pickerHsv[0]}deg`);
        setPickerColor(hsvToHex(...pickerHsv));
      });
      pickerHue.addEventListener('change', () => applySiteAccent(hsvToHex(...pickerHsv), true));
      pickerHex.addEventListener('input', () => {
        const hex = pickerHex.value.startsWith('#') ? pickerHex.value : `#${pickerHex.value}`;
        if (validCustomAccent(hex)) setPickerColor(hex);
      });
      pickerHex.addEventListener('change', () => {
        const hex = pickerHex.value.startsWith('#') ? pickerHex.value : `#${pickerHex.value}`;
        if (validCustomAccent(hex)) setPickerColor(hex, true);
        else syncAccentControls();
      });
    }
    syncOptions();
    trigger.addEventListener('click', () => setOpen(trigger.getAttribute('aria-expanded') !== 'true'));
    displayOptions.querySelectorAll('[data-preference]').forEach(option => {
      option.addEventListener('click', () => {
        const preference = option.dataset.preference;
        const enabled = !root.classList.contains(preference);
        root.classList.toggle(preference, enabled);
        if (preference === 'high-contrast') applySiteAccent();
        const preferenceKey = preference === 'sounds-off' ? 'ns2nam-mute-interface-sounds-v2' : `ns2nam-${preference}`;
        try { sessionStorage.setItem(preferenceKey, enabled ? '1' : '0'); } catch (_) {}
        syncOptions();
        option.classList.remove('swipe-on', 'swipe-off');
        void option.offsetWidth;
        option.classList.add(enabled ? 'swipe-on' : 'swipe-off');
        window.clearTimeout(option.swipeTimer);
        option.swipeTimer = window.setTimeout(() => option.classList.remove('swipe-on', 'swipe-off'), 650);
        if (preference === 'animations-off') {
          if (enabled) {
            document.querySelectorAll('.glow-card').forEach(card => {
              card.style.removeProperty('--pointer-x');
              card.style.removeProperty('--pointer-y');
              card.style.removeProperty('--glow-active');
              card.style.removeProperty('--tilt-x');
              card.style.removeProperty('--tilt-y');
            });
          }
          document.dispatchEvent(new CustomEvent('site:motionchange', { detail: { animationsOff: enabled } }));
        }
        if (preference === 'sounds-off') {
          if (enabled && uiAudioContext) uiAudioContext.suspend().catch(() => {});
          else if (!enabled) {
            try { sessionStorage.setItem('ns2nam-audio-activated', '1'); } catch (_) {}
          }
        }
        playUiSound(enabled ? 'switch-on' : 'switch-off');
      });
    });
    document.addEventListener('pointerdown', event => {
      if (panel.hidden || displayOptions.contains(event.target) || pickerPopover.contains(event.target)) return;
      setOpen(false);
      blockOutsideClickThrough(event);
    }, true);
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !panel.hidden) {
        setOpen(false);
        trigger.focus();
      }
    });
  }

  // A lightweight cursor accent for mouse and trackpad users.
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches && !reduceMotion.matches && !root.classList.contains('animations-off')) {
    const cursor = document.createElement('div');
    cursor.className = 'cursor-aura';
    cursor.setAttribute('aria-hidden', 'true');
    cursor.innerHTML = '<span class="cursor-aura-ring"></span><span class="cursor-aura-dot"></span>';
    document.body.appendChild(cursor);
    window.addEventListener('pointermove', event => {
      cursor.style.setProperty('--cursor-x', `${event.clientX}px`);
      cursor.style.setProperty('--cursor-y', `${event.clientY}px`);
      cursor.classList.add('is-visible');
      cursor.classList.toggle('is-over-link', Boolean(event.target.closest('a, button, summary, input')));
    }, { passive: true });
    document.addEventListener('pointerleave', () => cursor.classList.remove('is-visible'));
    document.addEventListener('pointerenter', () => cursor.classList.add('is-visible'));
  }

  // Let the BMC popup auto-open only on the first page of a tab session.
  const supportSeenKey = 'ns2nam-bmc-auto-opened-v2';
  let supportWasShown = false;
  try { supportWasShown = sessionStorage.getItem(supportSeenKey) === '1'; } catch (_) {}
  const supportLink = document.createElement('a');
  supportLink.className = 'support-fallback';
  supportLink.href = 'https://www.buymeacoffee.com/deeptanusen';
  supportLink.target = '_blank';
  supportLink.rel = 'noopener noreferrer';
  supportLink.setAttribute('aria-label', 'Support NS2/Nam for macOS on Buy Me a Coffee');
  supportLink.title = 'Support this project (optional)';
  supportLink.innerHTML = '<span class="support-coffee-icon" aria-hidden="true">☕</span><span class="support-label">Support</span>';
  document.body.appendChild(supportLink);

  if (!supportWasShown) {
    const supportWidget = document.createElement('script');
    supportWidget.dataset.name = 'BMC-Widget';
    supportWidget.dataset.cfasync = 'false';
    supportWidget.dataset.id = 'deeptanusen';
    supportWidget.dataset.description = 'Support this project';
    supportWidget.dataset.message = 'Thanks for using NS2/Nam! Support is optional and appreciated.';
    supportWidget.dataset.color = '#70e4dc';
    supportWidget.dataset.position = 'Right';
    supportWidget.dataset.x_margin = '18';
    supportWidget.dataset.y_margin = '18';
    supportWidget.src = 'https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js';
    supportWidget.addEventListener('load', () => {
      try { sessionStorage.setItem(supportSeenKey, '1'); } catch (_) {}
    }, { once: true });
    document.body.appendChild(supportWidget);
  }

  // Persist the selected palette without requiring any server-side state.
  const themeButton = document.querySelector('.theme-toggle');
  let savedTheme = null;
  try { savedTheme = localStorage.getItem('ns2nam-theme'); } catch (_) {}
  if (savedTheme === 'light' || savedTheme === 'dark') root.dataset.theme = savedTheme;
  applySiteAccent();
  if (themeButton) {
    themeButton.innerHTML = '<svg class="theme-glyph" viewBox="0 0 40 40" aria-hidden="true"><g class="theme-rays"><path d="M20 2v5M20 33v5M2 20h5M33 20h5M7.3 7.3l3.5 3.5m18.4 18.4 3.5 3.5m0-25.4-3.5 3.5m-18.4 18.4-3.5 3.5"/></g><circle class="theme-sun" cx="20" cy="20" r="7"/><path class="theme-moon" d="M27.8 7.1A14.2 14.2 0 1 0 32.9 27.8 12 12 0 0 1 27.8 7.1Z"/><path class="torch-handle" d="m20 24-3 13h6l-3-13Z"/><path class="torch-flame" d="M20 3c-4 5 2 8-3 13-4 4-5 8-2 12 2 3 8 4 11 0 4-5 1-10-2-13-1-2-2-4-1-7-2 2-3 4-3 6-3-3 1-7 0-11Z"/></svg><span class="theme-smoke" aria-hidden="true"><i></i><i></i><i></i></span>';
    const syncThemeLabel = () => {
      const target = root.dataset.theme === 'light' ? 'dark' : 'light';
      themeButton.setAttribute('aria-label', `Switch to ${target} theme`);
      themeButton.title = `Switch to ${target} theme`;
    };
    syncThemeLabel();
    themeButton.addEventListener('click', () => {
      if (themeButton.disabled) return;
      const next = root.dataset.theme === 'light' ? 'dark' : 'light';
      playCandleClickSound(next);
      const applyTheme = () => {
        root.dataset.theme = next;
        applySiteAccent();
        try { localStorage.setItem('ns2nam-theme', next); } catch (_) {}
        syncThemeLabel();
        if (next === 'dark' && !reduceMotion.matches && !root.classList.contains('animations-off')) {
          const smoke = themeButton.querySelector('.theme-smoke');
          smoke.classList.add('is-rising');
          window.setTimeout(() => smoke.classList.remove('is-rising'), 1000);
        }
      };

      if (reduceMotion.matches || root.classList.contains('animations-off')) {
        applyTheme();
        return;
      }

      const bounds = themeButton.getBoundingClientRect();
      root.style.setProperty('--theme-origin-x', `${bounds.left + bounds.width / 2}px`);
      root.style.setProperty('--theme-origin-y', `${bounds.top + bounds.height / 2}px`);
      themeButton.disabled = true;
      const runTorch = (direction, done) => {
        if (!document.startViewTransition) playThemeWhoosh(direction);
        root.classList.add('theme-torching');
        root.classList.toggle('theme-torch-reversing', direction === 'dark');
        const torchWash = document.createElement('div');
        torchWash.className = `torch-wash torch-to-${direction}`;
        torchWash.setAttribute('aria-hidden', 'true');
        document.body.appendChild(torchWash);
        window.setTimeout(() => {
          torchWash.remove();
          root.classList.remove('theme-torching', 'theme-torch-reversing');
          done();
        }, 720);
      };
      const runThemeReveal = done => {
        const finishReveal = () => {
          done();
        };
        if (document.startViewTransition) {
          playThemeWhoosh(next);
          const transition = document.startViewTransition({
            update: applyTheme,
            types: [`theme-${next}`],
          });
          transition.finished.then(finishReveal, finishReveal);
        } else {
          applyTheme();
          finishReveal();
        }
      };

      runTorch(next, () => runThemeReveal(() => { themeButton.disabled = false; }));
    });
  }

  // Compact mobile navigation.
  const menuButton = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.primary-nav');
  if (menuButton && nav) {
    const closeMenu = () => {
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.setAttribute('aria-label', 'Open navigation');
      nav.classList.remove('is-open');
    };
    menuButton.addEventListener('click', () => {
      const open = menuButton.getAttribute('aria-expanded') !== 'true';
      menuButton.setAttribute('aria-expanded', String(open));
      menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
      nav.classList.toggle('is-open', open);
    });
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
    document.addEventListener('click', event => {
      if (menuButton.getAttribute('aria-expanded') === 'true' &&
          !nav.contains(event.target) && !menuButton.contains(event.target)) closeMenu();
    });
    document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
  }

  let pageContentController;
  let pageRevealObserver;
  const initializePageContent = () => {
  if (pageContentController) pageContentController.abort();
  if (pageRevealObserver) pageRevealObserver.disconnect();
  pageContentController = new AbortController();
  const pageSignal = pageContentController.signal;
  // Scroll progress, restrained reveal motion, and current year.
  const meter = document.querySelector('.scroll-meter span');
  const tocEntries = [...document.querySelectorAll('.toc a[href^="#"]')].map(link => ({
    link,
    section: document.getElementById(link.hash.slice(1))
  })).filter(entry => entry.section);
  let previousActiveTocEntry = null;
  const updateToc = () => {
    if (!tocEntries.length) return;
    const activationLine = Math.min(220, window.innerHeight * .32);
    let active = tocEntries[0];
    tocEntries.forEach(entry => {
      if (entry.section.getBoundingClientRect().top <= activationLine) active = entry;
    });
    if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) {
      active = tocEntries[tocEntries.length - 1];
    }
    tocEntries.forEach(entry => {
      const isActive = entry === active;
      entry.link.classList.toggle('is-active', isActive);
      if (isActive) entry.link.setAttribute('aria-current', 'location');
      else entry.link.removeAttribute('aria-current');
    });
    if (active !== previousActiveTocEntry && window.matchMedia('(max-width: 760px)').matches) {
      const rail = active.link.closest('.toc-links');
      if (rail) {
        const targetLeft = active.link.offsetLeft - rail.offsetLeft - (rail.clientWidth - active.link.clientWidth) / 2;
        rail.scrollTo({ left: targetLeft, behavior: reduceMotion.matches || root.classList.contains('animations-off') ? 'auto' : 'smooth' });
      }
    }
    previousActiveTocEntry = active;
  };
  let scrollQueued = false;
  const updateScroll = () => {
    if (meter) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      meter.style.width = `${max > 0 ? (window.scrollY / max) * 100 : 0}%`;
    }
    updateToc();
    scrollQueued = false;
  };
  window.addEventListener('scroll', () => {
    if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(updateScroll); }
  }, { passive: true, signal: pageSignal });
  updateScroll();
  window.addEventListener('resize', updateToc, { passive: true, signal: pageSignal });
  window.addEventListener('hashchange', updateToc, { signal: pageSignal });
  document.querySelectorAll('[data-year]').forEach(node => { node.textContent = new Date().getFullYear(); });

  const revealItems = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion.matches && !root.classList.contains('animations-off')) {
    pageRevealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          pageRevealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -35px 0px' });
    revealItems.forEach(item => pageRevealObserver.observe(item));
  } else {
    revealItems.forEach(item => item.classList.add('is-visible'));
  }

  // Keep the card glow moving with the pointer across each card group.
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches && !reduceMotion.matches && !root.classList.contains('animations-off')) {
    const glowGroups = [
      ['.feature-grid', '.feature-card'],
      ['.compat-ready-grid', '.compat-device-card, .compat-app-card'],
      ['.requirements-grid', '.requirement-card'],
      ['.credits-grid', '.credit-card'],
      ['.compat-stack', '.compat-layer'],
      ['.faq-list', '.faq-item'],
    ];
    glowGroups.forEach(([groupSelector, cardSelector]) => {
      document.querySelectorAll(groupSelector).forEach(grid => {
        const cards = [...grid.querySelectorAll(cardSelector)];
        cards.forEach(card => card.classList.add('glow-card'));
        window.addEventListener('pointermove', event => {
          if (root.classList.contains('animations-off')) return;
          const gridBounds = grid.getBoundingClientRect();
          const trackingMargin = 180;
          const nearGrid = event.clientX >= gridBounds.left - trackingMargin
            && event.clientX <= gridBounds.right + trackingMargin
            && event.clientY >= gridBounds.top - trackingMargin
            && event.clientY <= gridBounds.bottom + trackingMargin;
          cards.forEach(card => {
            const bounds = card.getBoundingClientRect();
            card.style.setProperty('--pointer-x', `${event.clientX - bounds.left}px`);
            card.style.setProperty('--pointer-y', `${event.clientY - bounds.top}px`);
            card.style.setProperty('--glow-active', nearGrid ? '1' : '0');
            card.style.removeProperty('--tilt-x');
            card.style.removeProperty('--tilt-y');
          });
          const card = event.target.closest(cardSelector);
          if (nearGrid && card && grid.contains(card)) {
            const bounds = card.getBoundingClientRect();
            const px = (event.clientX - bounds.left) / bounds.width;
            const py = (event.clientY - bounds.top) / bounds.height;
            if (card.matches('.feature-card, .compat-device-card')) {
              card.style.setProperty('--tilt-x', `${((.5 - py) * 3).toFixed(2)}deg`);
              card.style.setProperty('--tilt-y', `${((px - .5) * 4).toFixed(2)}deg`);
            }
          }
        }, { signal: pageSignal });
      });
    });
  }

  // Copy terminal snippets with a small non-blocking confirmation.
  const toast = document.querySelector('.toast');
  let toastTimer;
  const announceCopy = button => {
    if (toast) {
      toast.textContent = 'Copied to clipboard';
      toast.classList.add('is-visible');
      window.clearTimeout(toastTimer);
      toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 1500);
    }
    if (button) {
      button.classList.add('is-copied');
      button.textContent = 'COPIED';
      window.setTimeout(() => { button.classList.remove('is-copied'); button.textContent = 'COPY'; }, 1300);
    }
  };
  document.querySelectorAll('[data-copy]').forEach(button => {
    button.addEventListener('click', async () => {
      const value = button.getAttribute('data-copy') || '';
      try {
        if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(value);
        else {
          const field = document.createElement('textarea');
          field.value = value;
          field.setAttribute('readonly', '');
          field.style.position = 'fixed';
          field.style.opacity = '0';
          document.body.appendChild(field);
          field.select();
          document.execCommand('copy');
          field.remove();
        }
        announceCopy(button);
      } catch (_) {
        if (toast) {
          toast.textContent = 'Copy unavailable — select the command instead';
          toast.classList.add('is-visible');
          window.setTimeout(() => toast.classList.remove('is-visible'), 2200);
        }
      }
    });
  });

  // Keep enough identical ticker segments on screen for a gap-free marquee loop.
  const tickerTrack = document.querySelector('.ticker-track');
  if (tickerTrack) {
    const tickerTemplate = tickerTrack.querySelector('.ticker-group');
    if (tickerTemplate) {
      const fillTicker = () => {
        tickerTrack.querySelectorAll('[data-generated-ticker]').forEach(group => group.remove());
        let groupCount = tickerTrack.querySelectorAll('.ticker-group').length;
        while (tickerTrack.scrollWidth < window.innerWidth * 2 || groupCount % 2 !== 0) {
          const group = tickerTemplate.cloneNode(true);
          group.setAttribute('aria-hidden', 'true');
          group.dataset.generatedTicker = 'true';
          tickerTrack.appendChild(group);
          groupCount += 1;
        }
      };
      fillTicker();
      window.addEventListener('resize', fillTicker, { passive: true, signal: pageSignal });
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(fillTicker);
    }
  }


  if (reduceMotion.matches) document.querySelectorAll('svg').forEach(svg => {
    if (typeof svg.pauseAnimations === 'function') svg.pauseAnimations();
  });
  };
  initializePageContent();

  let routeRequestId = 0;
  const navigateInternally = async (url, addHistory = true) => {
    const requestId = ++routeRequestId;
    try {
      const response = await fetch(url.href);
      if (requestId !== routeRequestId) return;
      if (!response.ok) { window.location.assign(url.href); return; }
      const nextDocument = new DOMParser().parseFromString(await response.text(), 'text/html');
      if (requestId !== routeRequestId) return;
      const nextMain = nextDocument.querySelector('#main');
      const currentMain = document.querySelector('#main');
      if (!nextMain || !currentMain) { window.location.assign(url.href); return; }
      const nextFooter = nextDocument.querySelector('footer.site-footer');
      const currentFooter = document.querySelector('footer.site-footer');

      window.__ns2NetworkWindowCleanup?.();
      window.__ns2AnimationEngineCleanup?.();
      document.querySelectorAll('[data-page-runtime]').forEach(script => script.remove());
      currentMain.replaceWith(document.importNode(nextMain, true));
      if (nextFooter && currentFooter) currentFooter.replaceWith(document.importNode(nextFooter, true));
      document.title = nextDocument.title;
      const nextDescription = nextDocument.querySelector('meta[name="description"]');
      const currentDescription = document.querySelector('meta[name="description"]');
      if (nextDescription && currentDescription) currentDescription.content = nextDescription.content;
      const nextCanonical = nextDocument.querySelector('link[rel="canonical"]');
      const currentCanonical = document.querySelector('link[rel="canonical"]');
      if (nextCanonical && currentCanonical) currentCanonical.href = nextCanonical.href;
      document.querySelectorAll('link[data-page-style]').forEach(style => style.remove());
      nextDocument.querySelectorAll('link[rel="stylesheet"]').forEach(style => {
        const href = new URL(style.getAttribute('href'), url);
        if (!href.pathname.includes('/css/compatibility.css')) return;
        const pageStyle = document.createElement('link');
        pageStyle.rel = 'stylesheet';
        pageStyle.href = href.href;
        pageStyle.dataset.pageStyle = 'true';
        document.head.appendChild(pageStyle);
      });
      if (addHistory) window.history.pushState({}, '', url.href);
      document.querySelectorAll('.primary-nav a').forEach(link => {
        const linkUrl = new URL(link.href, window.location.href);
        link.classList.toggle('active', linkUrl.pathname === url.pathname);
        if (link.classList.contains('active')) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      });
      menuButton?.setAttribute('aria-expanded', 'false');
      menuButton?.setAttribute('aria-label', 'Open navigation');
      nav?.classList.remove('is-open');
      initializePageContent();
      window.scrollTo({ top: 0, behavior: 'auto' });
      if (url.hash) {
        requestAnimationFrame(() => document.getElementById(decodeURIComponent(url.hash.slice(1)))?.scrollIntoView({ block: 'start' }));
      }
      const pageScripts = [...nextDocument.querySelectorAll('script[src]')]
        .map(script => new URL(script.getAttribute('src'), url).href)
        .filter(src => /\/(?:network_window|animation_engine|faq)\.js(?:$|\?)/.test(src));
      pageScripts.forEach(src => {
        const script = document.createElement('script');
        script.src = src;
        script.dataset.pageRuntime = 'true';
        document.body.appendChild(script);
      });
      document.dispatchEvent(new CustomEvent('site:pagechange', { detail: { url: url.href } }));
    } catch (_) {
      window.location.assign(url.href);
    }
  };
  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('a[href]');
    if (!link || link.target || link.hasAttribute('download')) return;
    const url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin || !/\.html?$/.test(url.pathname)) return;
    if (url.pathname === window.location.pathname && url.hash) return;
    event.preventDefault();
    navigateInternally(url);
  });
  window.addEventListener('popstate', () => navigateInternally(new URL(window.location.href), false));
})();
