    function hexToRgb(hex) {
      let c = hex.replace('#', '').trim();
      if (c.length === 3) c = c.split('').map(x => x + x).join('');
      const num = parseInt(c, 16);
      return {
        r: (num >> 16) & 255,
        g: (num >> 8) & 255,
        b: num & 255
      };
    }

    function rgbToHex(r, g, b) {
      const clamp = v => Math.max(0, Math.min(255, Math.round(v)));
      return '#' + [clamp(r), clamp(g), clamp(b)].map(x => x.toString(16).padStart(2, '0')).join('');
    }

    function hexToHsl(hex) {
      let c = hex.replace('#', '').trim();
      if (c.length === 3) c = c.split('').map(x => x + x).join('');
      const r = parseInt(c.substring(0, 2), 16) / 255;
      const g = parseInt(c.substring(2, 4), 16) / 255;
      const b = parseInt(c.substring(4, 6), 16) / 255;
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      let h, s, l = (max + min) / 2;
      if (max === min) {
        h = s = 0;
      } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
      }
      return { h, s, l };
    }

    function hslToHex(h, s, l) {
      l = Math.max(0, Math.min(1, l));
      s = Math.max(0, Math.min(1, s));
      let r, g, b;
      if (s === 0) {
        r = g = b = l;
      } else {
        function hue2rgb(p, q, t) {
          if (t < 0) t += 1;
          if (t > 1) t -= 1;
          if (t < 1 / 6) return p + (q - p) * 6 * t;
          if (t < 1 / 2) return q;
          if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
          return p;
        }
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
      }
      const toHex = x => {
        const hex = Math.round(Math.max(0, Math.min(255, x * 255))).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      };
      return '#' + toHex(r) + toHex(g) + toHex(b);
    }

    // Hand-crafted Neumorphic Theme Presets: Diverse, colorful clay base palettes across all aesthetics
    const THEME_PRESETS = {
      'custom-default': {
        name: 'Warm Clay (Default)',
        bgColor: '#e8dfd5',
        accentColor: '#d97706',
        radius: 5,
        distance: 4,
        lightIntensity: 39,
        darkIntensity: 5,
        blur: 9
      },
      'dribbble-soft-gray': {
        name: 'Dribbble Soft Canvas',
        bgColor: '#e0e5ec',
        accentColor: '#3b82f6',
        radius: 16,
        distance: 5,
        lightIntensity: 85,
        darkIntensity: 18,
        blur: 10
      },
      'porcelain-ceramic': {
        name: 'Porcelain Ceramic',
        bgColor: '#f1f5f9',
        accentColor: '#2563eb',
        radius: 28,
        distance: 7,
        lightIntensity: 85,
        darkIntensity: 20,
        blur: 16
      },
      'pure-snow': {
        name: 'Pure Snow Clay',
        bgColor: '#f8fafc',
        accentColor: '#0ea5e9',
        radius: 18,
        distance: 4,
        lightIntensity: 90,
        darkIntensity: 15,
        blur: 12
      },
      'alabaster-clean': {
        name: 'Alabaster Minimal',
        bgColor: '#f4f4f5',
        accentColor: '#18181b',
        radius: 12,
        distance: 4,
        lightIntensity: 80,
        darkIntensity: 18,
        blur: 10
      },
      'nordic-linen': {
        name: 'Nordic Linen',
        bgColor: '#dfd9ce',
        accentColor: '#92400e',
        radius: 10,
        distance: 4,
        lightIntensity: 65,
        darkIntensity: 20,
        blur: 8
      },
      'nord-frost': {
        name: 'Nord Frost',
        bgColor: '#e5e9f0',
        accentColor: '#5e81ac',
        radius: 8,
        distance: 3,
        lightIntensity: 32,
        darkIntensity: 16,
        blur: 7
      },
      'silver-chiffon': {
        name: 'Silver Chiffon',
        bgColor: '#e2e8f0',
        accentColor: '#475569',
        radius: 14,
        distance: 4,
        lightIntensity: 75,
        darkIntensity: 18,
        blur: 9
      },
      'retro-sharp': {
        name: 'Retro Paper',
        bgColor: '#f2efe9',
        accentColor: '#e11d48',
        radius: 4,
        distance: 3,
        lightIntensity: 50,
        darkIntensity: 16,
        blur: 0
      },
      'solarized-cream': {
        name: 'Solarized Cream',
        bgColor: '#fdf6e3',
        accentColor: '#b58900',
        radius: 6,
        distance: 3,
        lightIntensity: 32,
        darkIntensity: 14,
        blur: 6
      },
      'butter-cream': {
        name: 'Butter Cream',
        bgColor: '#fef3c7',
        accentColor: '#b45309',
        radius: 14,
        distance: 4,
        lightIntensity: 35,
        darkIntensity: 15,
        blur: 8
      },
      'cappuccino-foam': {
        name: 'Cappuccino Foam',
        bgColor: '#ede0d4',
        accentColor: '#7f4f24',
        radius: 16,
        distance: 4,
        lightIntensity: 45,
        darkIntensity: 16,
        blur: 9
      },
      'desert-caramel': {
        name: 'Desert Caramel',
        bgColor: '#c68b59',
        accentColor: '#451a03',
        radius: 8,
        distance: 3,
        lightIntensity: 25,
        darkIntensity: 22,
        blur: 7
      },
      'roasted-cocoa': {
        name: 'Roasted Cocoa',
        bgColor: '#351c14',
        accentColor: '#fbbf24',
        radius: 10,
        distance: 3,
        lightIntensity: 22,
        darkIntensity: 60,
        blur: 5
      },
      'espresso-mocha': {
        name: 'Espresso Mocha',
        bgColor: '#2b1d14',
        accentColor: '#f59e0b',
        radius: 10,
        distance: 3,
        lightIntensity: 18,
        darkIntensity: 36,
        blur: 7
      },
      'brutalist-concrete': {
        name: 'Brutalist Concrete',
        bgColor: '#78716c',
        accentColor: '#f97316',
        radius: 2,
        distance: 5,
        lightIntensity: 55,
        darkIntensity: 75,
        blur: 0
      },
      'brutalist-amber': {
        name: 'Brutalist Amber',
        bgColor: '#f59e0b',
        accentColor: '#1e1b4b',
        radius: 2,
        distance: 6,
        lightIntensity: 65,
        darkIntensity: 75,
        blur: 0
      },
      'hard-canary': {
        name: 'Hard Canary Yellow',
        bgColor: '#facc15',
        accentColor: '#09090b',
        radius: 0,
        distance: 5,
        lightIntensity: 70,
        darkIntensity: 80,
        blur: 0
      },
      'hard-bubblegum': {
        name: 'Hard Bubblegum Pop',
        bgColor: '#f472b6',
        accentColor: '#0f172a',
        radius: 4,
        distance: 6,
        lightIntensity: 65,
        darkIntensity: 75,
        blur: 0
      },
      'hard-acid-lime': {
        name: 'Hard Acid Lime',
        bgColor: '#a3e635',
        accentColor: '#14532d',
        radius: 1,
        distance: 5,
        lightIntensity: 60,
        darkIntensity: 75,
        blur: 0
      },
      'hard-bauhaus-red': {
        name: 'Hard Bauhaus Red',
        bgColor: '#ef4444',
        accentColor: '#000000',
        radius: 0,
        distance: 7,
        lightIntensity: 60,
        darkIntensity: 80,
        blur: 0
      },
      'hard-blueprint': {
        name: 'Hard Electric Blueprint',
        bgColor: '#2563eb',
        accentColor: '#fde047',
        radius: 0,
        distance: 7,
        lightIntensity: 55,
        darkIntensity: 85,
        blur: 0
      },
      'hard-tangerine': {
        name: 'Hard Tangerine Pop',
        bgColor: '#fb923c',
        accentColor: '#09090b',
        radius: 3,
        distance: 6,
        lightIntensity: 60,
        darkIntensity: 75,
        blur: 0
      },
      'hard-arcade-cyan': {
        name: 'Hard Arcade Cyan',
        bgColor: '#38bdf8',
        accentColor: '#0f172a',
        radius: 6,
        distance: 6,
        lightIntensity: 65,
        darkIntensity: 75,
        blur: 0
      },
      'hard-toxic-mint': {
        name: 'Hard Toxic Mint',
        bgColor: '#34d399',
        accentColor: '#064e3b',
        radius: 2,
        distance: 5,
        lightIntensity: 65,
        darkIntensity: 70,
        blur: 0
      },
      'hard-ultraviolet': {
        name: 'Hard Ultraviolet Pop',
        bgColor: '#8b5cf6',
        accentColor: '#facc15',
        radius: 4,
        distance: 6,
        lightIntensity: 55,
        darkIntensity: 80,
        blur: 0
      },
      'hard-swiss-white': {
        name: 'Hard Swiss Stark White',
        bgColor: '#ffffff',
        accentColor: '#e11d48',
        radius: 0,
        distance: 6,
        lightIntensity: 80,
        darkIntensity: 85,
        blur: 0
      },
      'hard-parchment': {
        name: 'Hard Parchment Blueprint',
        bgColor: '#f6f1eb',
        accentColor: '#1d4ed8',
        radius: 2,
        distance: 4,
        lightIntensity: 60,
        darkIntensity: 65,
        blur: 0
      },
      'hard-hazard': {
        name: 'Hard Industrial Hazard',
        bgColor: '#eab308',
        accentColor: '#000000',
        radius: 0,
        distance: 8,
        lightIntensity: 65,
        darkIntensity: 85,
        blur: 0
      },
      'hard-gameboy': {
        name: 'Hard Dot Matrix Handheld',
        bgColor: '#8bac0f',
        accentColor: '#0f380f',
        radius: 4,
        distance: 4,
        lightIntensity: 50,
        darkIntensity: 75,
        blur: 0
      },
      'hard-steel': {
        name: 'Hard Machined Steel',
        bgColor: '#475569',
        accentColor: '#38bdf8',
        radius: 1,
        distance: 5,
        lightIntensity: 50,
        darkIntensity: 80,
        blur: 0
      },
      'hard-terminal-green': {
        name: 'Hard CRT Terminal Green',
        bgColor: '#052e16',
        accentColor: '#22c55e',
        radius: 0,
        distance: 4,
        lightIntensity: 45,
        darkIntensity: 90,
        blur: 0
      },
      'hard-cyber-black': {
        name: 'Hard Cyber Void',
        bgColor: '#121214',
        accentColor: '#f43f5e',
        radius: 0,
        distance: 6,
        lightIntensity: 45,
        darkIntensity: 90,
        blur: 0
      },
      'hard-midnight-navy': {
        name: 'Hard Midnight Navy',
        bgColor: '#0f172a',
        accentColor: '#38bdf8',
        radius: 2,
        distance: 6,
        lightIntensity: 45,
        darkIntensity: 85,
        blur: 0
      },
      'hard-blood-dark': {
        name: 'Hard Blood Obsidian',
        bgColor: '#260707',
        accentColor: '#ef4444',
        radius: 0,
        distance: 6,
        lightIntensity: 45,
        darkIntensity: 85,
        blur: 0
      },
      'hard-kawaii-lilac': {
        name: 'Hard Kawaii Lilac',
        bgColor: '#ddd6fe',
        accentColor: '#6d28d9',
        radius: 8,
        distance: 6,
        lightIntensity: 70,
        darkIntensity: 70,
        blur: 0
      },
      'hard-matcha': {
        name: 'Hard Matcha Ceramic',
        bgColor: '#d5dfc3',
        accentColor: '#14532d',
        radius: 2,
        distance: 5,
        lightIntensity: 65,
        darkIntensity: 65,
        blur: 0
      },
      'hard-teal-punch': {
        name: 'Hard Teal Punch',
        bgColor: '#0f766e',
        accentColor: '#fef08a',
        radius: 3,
        distance: 6,
        lightIntensity: 55,
        darkIntensity: 80,
        blur: 0
      },
      'hard-neon-coral': {
        name: 'Hard Neon Coral',
        bgColor: '#f43f5e',
        accentColor: '#ffffff',
        radius: 4,
        distance: 7,
        lightIntensity: 60,
        darkIntensity: 80,
        blur: 0
      },
      'hard-amber-slate': {
        name: 'Hard Amber Slate',
        bgColor: '#1c1917',
        accentColor: '#f59e0b',
        radius: 1,
        distance: 5,
        lightIntensity: 45,
        darkIntensity: 85,
        blur: 0
      },
      'hard-industrial-gray': {
        name: 'Hard Industrial Gray',
        bgColor: '#d1d5db',
        accentColor: '#111827',
        radius: 0,
        distance: 6,
        lightIntensity: 75,
        darkIntensity: 80,
        blur: 0
      },
      'hard-peach-punch': {
        name: 'Hard Peach Punch',
        bgColor: '#fed7aa',
        accentColor: '#c2410c',
        radius: 6,
        distance: 5,
        lightIntensity: 70,
        darkIntensity: 70,
        blur: 0
      },
      'solar-tangerine': {
        name: 'Solar Tangerine',
        bgColor: '#ea580c',
        accentColor: '#fef08a',
        radius: 34,
        distance: 5,
        lightIntensity: 38,
        darkIntensity: 42,
        blur: 12
      },
      'peach-fuzz': {
        name: 'Peach Fuzz',
        bgColor: '#fed7aa',
        accentColor: '#c2410c',
        radius: 16,
        distance: 3,
        lightIntensity: 28,
        darkIntensity: 16,
        blur: 7
      },
      'sunset-terracotta': {
        name: 'Sunset Terracotta',
        bgColor: '#8c3a27',
        accentColor: '#fcd34d',
        radius: 12,
        distance: 3,
        lightIntensity: 22,
        darkIntensity: 28,
        blur: 8
      },
      'vintage-rose': {
        name: 'Vintage Rose',
        bgColor: '#b85d68',
        accentColor: '#ffe4e6',
        radius: 14,
        distance: 3,
        lightIntensity: 22,
        darkIntensity: 24,
        blur: 8
      },
      'dusty-blush': {
        name: 'Dusty Blush',
        bgColor: '#ebdcd9',
        accentColor: '#9f1239',
        radius: 18,
        distance: 5,
        lightIntensity: 75,
        darkIntensity: 20,
        blur: 10
      },
      'sakura-blossom': {
        name: 'Sakura Blossom',
        bgColor: '#fce7f3',
        accentColor: '#be123c',
        radius: 18,
        distance: 3,
        lightIntensity: 30,
        darkIntensity: 14,
        blur: 8
      },
      'bubblegum-magenta': {
        name: 'Bubblegum Magenta',
        bgColor: '#db2777',
        accentColor: '#fef08a',
        radius: 30,
        distance: 7,
        lightIntensity: 42,
        darkIntensity: 38,
        blur: 15
      },
      'electric-coral': {
        name: 'Electric Coral',
        bgColor: '#f43f5e',
        accentColor: '#ffffff',
        radius: 20,
        distance: 5,
        lightIntensity: 40,
        darkIntensity: 35,
        blur: 10
      },
      'marshmallow-indigo': {
        name: 'Marshmallow Indigo',
        bgColor: '#4f46e5',
        accentColor: '#fde047',
        radius: 42,
        distance: 8,
        lightIntensity: 40,
        darkIntensity: 48,
        blur: 18
      },
      'lilac-cloud': {
        name: 'Lilac Cloud',
        bgColor: '#c4b5fd',
        accentColor: '#4c1d95',
        radius: 22,
        distance: 4,
        lightIntensity: 36,
        darkIntensity: 22,
        blur: 11
      },
      'lavender-dream': {
        name: 'Lavender Dream',
        bgColor: '#e2d9f3',
        accentColor: '#6b21a8',
        radius: 14,
        distance: 3,
        lightIntensity: 28,
        darkIntensity: 18,
        blur: 8
      },
      'sage-mint': {
        name: 'Sage Mint',
        bgColor: '#c8d6c0',
        accentColor: '#166534',
        radius: 18,
        distance: 3,
        lightIntensity: 24,
        darkIntensity: 18,
        blur: 7
      },
      'matcha-cream': {
        name: 'Matcha Cream',
        bgColor: '#dbe4d2',
        accentColor: '#3f5622',
        radius: 16,
        distance: 3,
        lightIntensity: 26,
        darkIntensity: 18,
        blur: 8
      },
      'eucalyptus-mist': {
        name: 'Eucalyptus Mist',
        bgColor: '#d4ded6',
        accentColor: '#065f46',
        radius: 16,
        distance: 4,
        lightIntensity: 70,
        darkIntensity: 22,
        blur: 9
      },
      'spearmint-gelato': {
        name: 'Spearmint Gelato',
        bgColor: '#6ee7b7',
        accentColor: '#831843',
        radius: 38,
        distance: 6,
        lightIntensity: 48,
        darkIntensity: 28,
        blur: 14
      },
      'pistachio-gelato': {
        name: 'Pistachio Gelato',
        bgColor: '#dcfce7',
        accentColor: '#15803d',
        radius: 20,
        distance: 4,
        lightIntensity: 45,
        darkIntensity: 16,
        blur: 10
      },
      'aqua-marine': {
        name: 'Aqua Marine',
        bgColor: '#cffafe',
        accentColor: '#0369a1',
        radius: 16,
        distance: 3,
        lightIntensity: 30,
        darkIntensity: 16,
        blur: 8
      },
      'sky-blue-pastel': {
        name: 'Sky Blue Pastel',
        bgColor: '#bae6fd',
        accentColor: '#0369a1',
        radius: 16,
        distance: 4,
        lightIntensity: 45,
        darkIntensity: 18,
        blur: 9
      },
      'cyber-cyan': {
        name: 'Cyber Cyan',
        bgColor: '#0891b2',
        accentColor: '#fef08a',
        radius: 18,
        distance: 4,
        lightIntensity: 35,
        darkIntensity: 32,
        blur: 6
      },
      'neon-lime': {
        name: 'Neon Lime Pop',
        bgColor: '#84cc16',
        accentColor: '#1a2e05',
        radius: 16,
        distance: 4,
        lightIntensity: 50,
        darkIntensity: 30,
        blur: 8
      },
      'sunburst-yellow': {
        name: 'Sunburst Gold',
        bgColor: '#eab308',
        accentColor: '#172554',
        radius: 14,
        distance: 4,
        lightIntensity: 55,
        darkIntensity: 35,
        blur: 8
      },
      'laguna-teal': {
        name: 'Laguna Teal',
        bgColor: '#134e4a',
        accentColor: '#2dd4bf',
        radius: 12,
        distance: 3,
        lightIntensity: 20,
        darkIntensity: 30,
        blur: 8
      },
      'forest-emerald': {
        name: 'Forest Emerald',
        bgColor: '#1b4332',
        accentColor: '#52b788',
        radius: 10,
        distance: 3,
        lightIntensity: 20,
        darkIntensity: 30,
        blur: 7
      },
      'matrix-terminal': {
        name: 'Matrix CRT',
        bgColor: '#052e16',
        accentColor: '#22c55e',
        radius: 4,
        distance: 2,
        lightIntensity: 40,
        darkIntensity: 70,
        blur: 2
      },
      'ocean-azure': {
        name: 'Ocean Azure',
        bgColor: '#1e3a5f',
        accentColor: '#38bdf8',
        radius: 14,
        distance: 3,
        lightIntensity: 20,
        darkIntensity: 30,
        blur: 8
      },
      'abyssal-ocean': {
        name: 'Abyssal Ocean',
        bgColor: '#0e2a47',
        accentColor: '#38bdf8',
        radius: 16,
        distance: 4,
        lightIntensity: 22,
        darkIntensity: 55,
        blur: 10
      },
      'electric-cobalt': {
        name: 'Electric Cobalt',
        bgColor: '#1d3557',
        accentColor: '#34d399',
        radius: 10,
        distance: 3,
        lightIntensity: 20,
        darkIntensity: 30,
        blur: 8
      },
      'nordic-slate': {
        name: 'Nordic Slate',
        bgColor: '#334155',
        accentColor: '#60a5fa',
        radius: 10,
        distance: 3,
        lightIntensity: 20,
        darkIntensity: 28,
        blur: 8
      },
      'matte-titanium': {
        name: 'Matte Titanium',
        bgColor: '#1e293b',
        accentColor: '#06b6d4',
        radius: 12,
        distance: 3,
        lightIntensity: 22,
        darkIntensity: 45,
        blur: 7
      },
      'graphite-carbon': {
        name: 'Graphite Studio',
        bgColor: '#24272c',
        accentColor: '#00f2fe',
        radius: 12,
        distance: 4,
        lightIntensity: 18,
        darkIntensity: 42,
        blur: 8
      },
      'royal-violet': {
        name: 'Royal Violet',
        bgColor: '#442759',
        accentColor: '#f472b6',
        radius: 16,
        distance: 4,
        lightIntensity: 20,
        darkIntensity: 32,
        blur: 9
      },
      'midnight-violet': {
        name: 'Midnight Violet',
        bgColor: '#3b0764',
        accentColor: '#f43f5e',
        radius: 24,
        distance: 6,
        lightIntensity: 32,
        darkIntensity: 65,
        blur: 14
      },
      'garnet-obsidian': {
        name: 'Garnet Obsidian',
        bgColor: '#450a0a',
        accentColor: '#fb7185',
        radius: 8,
        distance: 4,
        lightIntensity: 24,
        darkIntensity: 70,
        blur: 9
      },
      'crimson-vampire': {
        name: 'Crimson Vampire',
        bgColor: '#2a0808',
        accentColor: '#ef4444',
        radius: 10,
        distance: 4,
        lightIntensity: 18,
        darkIntensity: 60,
        blur: 8
      },
      'obsidian-gold': {
        name: 'Obsidian Gold',
        bgColor: '#1e1e24',
        accentColor: '#f59e0b',
        radius: 10,
        distance: 4,
        lightIntensity: 16,
        darkIntensity: 48,
        blur: 8
      },
      'synth-slate': {
        name: 'Synthwave Slate',
        bgColor: '#2b2d42',
        accentColor: '#ff007f',
        radius: 12,
        distance: 5,
        lightIntensity: 22,
        darkIntensity: 38,
        blur: 9
      },
      'synthwave-sunset': {
        name: 'Synthwave Sunset',
        bgColor: '#262335',
        accentColor: '#ff7b00',
        radius: 14,
        distance: 4,
        lightIntensity: 20,
        darkIntensity: 32,
        blur: 9
      },
      'tokyo-night': {
        name: 'Tokyo Night',
        bgColor: '#1a1b26',
        accentColor: '#7aa2f7',
        radius: 12,
        distance: 3,
        lightIntensity: 18,
        darkIntensity: 38,
        blur: 8
      },
      'catppuccin-mocha': {
        name: 'Catppuccin Mocha',
        bgColor: '#1e1e2e',
        accentColor: '#cba6f7',
        radius: 14,
        distance: 3,
        lightIntensity: 20,
        darkIntensity: 35,
        blur: 8
      },
      'dracula-classic': {
        name: 'Dracula Classic',
        bgColor: '#282a36',
        accentColor: '#ff79c6',
        radius: 10,
        distance: 3,
        lightIntensity: 20,
        darkIntensity: 32,
        blur: 7
      },
      'monokai-charcoal': {
        name: 'Monokai Charcoal',
        bgColor: '#2d2a2e',
        accentColor: '#ffd866',
        radius: 10,
        distance: 3,
        lightIntensity: 18,
        darkIntensity: 34,
        blur: 7
      },
      'cyberpunk-neon': {
        name: 'Cyberpunk Neon',
        bgColor: '#12131a',
        accentColor: '#fcee0a',
        radius: 6,
        distance: 3,
        lightIntensity: 15,
        darkIntensity: 45,
        blur: 6
      },
      'midnight-onyx': {
        name: 'Midnight Onyx',
        bgColor: '#18181b',
        accentColor: '#a855f7',
        radius: 12,
        distance: 3,
        lightIntensity: 16,
        darkIntensity: 45,
        blur: 7
      },
      'oled-black': {
        name: 'OLED Void',
        bgColor: '#09090b',
        accentColor: '#38bdf8',
        radius: 8,
        distance: 3,
        lightIntensity: 14,
        darkIntensity: 65,
        blur: 6
      },
      'atomic-tangerine': {
        name: 'Atomic Tangerine',
        bgColor: '#151922',
        accentColor: '#ff6b35',
        radius: 12,
        distance: 3,
        lightIntensity: 20,
        darkIntensity: 42,
        blur: 8
      },
      'matcha-pistachio': {
        name: 'Matcha Cream',
        bgColor: '#dce5d8',
        accentColor: '#2d6a4f',
        radius: 16,
        distance: 4,
        lightIntensity: 65,
        darkIntensity: 18,
        blur: 10
      },
      'velvet-amethyst': {
        name: 'Velvet Amethyst',
        bgColor: '#241829',
        accentColor: '#e0aaff',
        radius: 14,
        distance: 4,
        lightIntensity: 22,
        darkIntensity: 48,
        blur: 9
      },
      'golden-dunes': {
        name: 'Golden Dunes',
        bgColor: '#d9c5b2',
        accentColor: '#b05b3b',
        radius: 10,
        distance: 4,
        lightIntensity: 55,
        darkIntensity: 16,
        blur: 8
      },
      'glacial-teal': {
        name: 'Glacial Teal',
        bgColor: '#11222c',
        accentColor: '#00f5d4',
        radius: 12,
        distance: 3,
        lightIntensity: 22,
        darkIntensity: 45,
        blur: 8
      },
      'soft-gray': {
        name: 'Warm Clay (Default)',
        bgColor: '#e8dfd5',
        accentColor: '#d97706',
        radius: 5,
        distance: 4,
        lightIntensity: 39,
        darkIntensity: 5,
        blur: 9
      }
    };

    function deriveRealisticShadows(bgColor, lightIntensity = 20, darkIntensity = 20) {
      const rgb = hexToRgb(bgColor);
      const lum = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255.0;

      // Realistic specular light highlight (blended with pure white)
      let lFactor;
      if (lum < 0.25) {
        lFactor = (lightIntensity / 100.0) * 0.45;
      } else if (lum < 0.55) {
        lFactor = (lightIntensity / 100.0) * 0.65;
      } else {
        lFactor = (lightIntensity / 100.0) * 0.95;
      }
      lFactor = Math.min(0.95, Math.max(0.03, lFactor));

      const lightR = Math.min(255, Math.round(rgb.r + (255 - rgb.r) * lFactor));
      const lightG = Math.min(255, Math.round(rgb.g + (255 - rgb.g) * lFactor));
      const lightB = Math.min(255, Math.round(rgb.b + (255 - rgb.b) * lFactor));

      // Realistic ambient occlusion shadow (blended with pure black)
      let dFactor;
      if (lum < 0.25) {
        dFactor = (darkIntensity / 100.0) * 0.75;
      } else if (lum < 0.55) {
        dFactor = (darkIntensity / 100.0) * 0.95;
      } else {
        dFactor = (darkIntensity / 100.0) * 1.15;
      }
      dFactor = Math.min(0.95, Math.max(0.03, dFactor));

      const darkR = Math.max(0, Math.round(rgb.r * (1.0 - dFactor)));
      const darkG = Math.max(0, Math.round(rgb.g * (1.0 - dFactor)));
      const darkB = Math.max(0, Math.round(rgb.b * (1.0 - dFactor)));

      const deepFactor = Math.min(0.98, dFactor * 1.35);
      const deepR = Math.max(0, Math.round(rgb.r * (1.0 - deepFactor)));
      const deepG = Math.max(0, Math.round(rgb.g * (1.0 - deepFactor)));
      const deepB = Math.max(0, Math.round(rgb.b * (1.0 - deepFactor)));

      return {
        shadowLight: rgbToHex(lightR, lightG, lightB),
        shadowDark: rgbToHex(darkR, darkG, darkB),
        shadowDarkDeep: rgbToHex(deepR, deepG, deepB)
      };
    }

    function computePresetShadow(bgColor, lightIntensity = 20, darkIntensity = 20, distance = 3, blur = 8) {
      const d = Math.max(2, Math.round(distance * 0.75));
      const b = blur;
      const maxDark = (blur === 0) ? 0.85 : 0.55;
      const maxLight = (blur === 0) ? 0.85 : 0.65;
      const darkAlpha = Math.min(maxDark, Math.max(0.12, (darkIntensity / 100.0) * 1.1));
      const lightAlpha = Math.min(maxLight, Math.max(0.10, (lightIntensity / 100.0) * 1.1));
      if (blur === 0) {
        return `${d}px ${d}px 0px rgba(0, 0, 0, ${darkAlpha.toFixed(2)}), -${d}px -${d}px 0px rgba(255, 255, 255, ${lightAlpha.toFixed(2)})`;
      }
      return `${d}px ${d}px ${b}px rgba(0, 0, 0, ${darkAlpha.toFixed(2)}), -${d}px -${d}px ${b}px rgba(255, 255, 255, ${lightAlpha.toFixed(2)})`;
    }

    function lightenHex(hex, percent) {
      const rgb = hexToRgb(hex);
      const factor = percent / 100;
      return rgbToHex(
        rgb.r + (255 - rgb.r) * factor,
        rgb.g + (255 - rgb.g) * factor,
        rgb.b + (255 - rgb.b) * factor
      );
    }

    function darkenHex(hex, percent) {
      const rgb = hexToRgb(hex);
      const factor = 1 - (percent / 100);
      return rgbToHex(rgb.r * factor, rgb.g * factor, rgb.b * factor);
    }

    function getLuminance(r, g, b) {
      const a = [r, g, b].map(v => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      });
      return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
    }

    function getContrastRatio(lum1, lum2) {
      const lighter = Math.max(lum1, lum2);
      const darker = Math.min(lum1, lum2);
      return (lighter + 0.05) / (darker + 0.05);
    }

    function deriveHarmonicTypography(bgHex) {
      const rgb = hexToRgb(bgHex);
      const bgLum = getLuminance(rgb.r, rgb.g, rgb.b);
      const hsl = hexToHsl(bgHex);

      const contrastWhite = (1.0 + 0.05) / (bgLum + 0.05);
      const contrastBlack = (bgLum + 0.05) / (0.0 + 0.05);

      // Harmonic undertone saturation (keeps text naturally keyed to the base clay)
      const harmSat = Math.min(0.22, Math.max(0.06, hsl.s * 0.45));
      const useDarkText = contrastBlack >= contrastWhite;

      let textPrimary, textSecondary, textMuted, textDisabled;

      if (useDarkText) {
        // Dark text mode (on light, beige, caramel, mint backgrounds)
        textPrimary = hslToHex(hsl.h, harmSat, 0.09);

        // Search lightness for secondary text (minimum contrast 5.5:1)
        let secL = 0.09;
        for (let l = 12; l <= 45; l++) {
          const testHex = hslToHex(hsl.h, harmSat, l / 100);
          const testRgb = hexToRgb(testHex);
          const testLum = getLuminance(testRgb.r, testRgb.g, testRgb.b);
          if (getContrastRatio(bgLum, testLum) >= 5.5) {
            secL = l / 100;
          } else {
            break;
          }
        }
        textSecondary = hslToHex(hsl.h, harmSat, secL);

        // Search lightness for muted text (guaranteed WCAG AA >= 4.5:1)
        let mutedL = secL;
        for (let l = Math.round(secL * 100); l <= 55; l++) {
          const testHex = hslToHex(hsl.h, harmSat, l / 100);
          const testRgb = hexToRgb(testHex);
          const testLum = getLuminance(testRgb.r, testRgb.g, testRgb.b);
          if (getContrastRatio(bgLum, testLum) >= 4.5) {
            mutedL = l / 100;
          } else {
            break;
          }
        }
        textMuted = hslToHex(hsl.h, harmSat, mutedL);

        // Search lightness for disabled text (minimum contrast 2.4:1)
        let disL = mutedL;
        for (let l = Math.round(mutedL * 100); l <= 75; l++) {
          const testHex = hslToHex(hsl.h, harmSat, l / 100);
          const testRgb = hexToRgb(testHex);
          const testLum = getLuminance(testRgb.r, testRgb.g, testRgb.b);
          if (getContrastRatio(bgLum, testLum) >= 2.4) {
            disL = l / 100;
          } else {
            break;
          }
        }
        textDisabled = hslToHex(hsl.h, harmSat, disL);
      } else {
        // Light text mode (on dark, navy, emerald, terracotta, violet backgrounds)
        textPrimary = hslToHex(hsl.h, harmSat * 0.5, 0.96);

        // Search lightness for secondary text (minimum contrast 5.5:1)
        let secL = 0.96;
        for (let l = 92; l >= 50; l--) {
          const testHex = hslToHex(hsl.h, harmSat, l / 100);
          const testRgb = hexToRgb(testHex);
          const testLum = getLuminance(testRgb.r, testRgb.g, testRgb.b);
          if (getContrastRatio(bgLum, testLum) >= 5.5) {
            secL = l / 100;
          } else {
            break;
          }
        }
        textSecondary = hslToHex(hsl.h, harmSat, secL);

        // Search lightness for muted text (guaranteed WCAG AA >= 4.5:1)
        let mutedL = secL;
        for (let l = Math.round(secL * 100); l >= 40; l--) {
          const testHex = hslToHex(hsl.h, harmSat, l / 100);
          const testRgb = hexToRgb(testHex);
          const testLum = getLuminance(testRgb.r, testRgb.g, testRgb.b);
          if (getContrastRatio(bgLum, testLum) >= 4.5) {
            mutedL = l / 100;
          } else {
            break;
          }
        }
        textMuted = hslToHex(hsl.h, harmSat, mutedL);

        // Search lightness for disabled text (minimum contrast 2.4:1)
        let disL = mutedL;
        for (let l = Math.round(mutedL * 100); l >= 20; l--) {
          const testHex = hslToHex(hsl.h, harmSat, l / 100);
          const testRgb = hexToRgb(testHex);
          const testLum = getLuminance(testRgb.r, testRgb.g, testRgb.b);
          if (getContrastRatio(bgLum, testLum) >= 2.4) {
            disL = l / 100;
          } else {
            break;
          }
        }
        textDisabled = hslToHex(hsl.h, harmSat, disL);
      }

      return {
        textPrimary,
        textSecondary,
        textMuted,
        textDisabled
      };
    }

    function applyTheme(bgColor, accentColor, save = false, neo = null) {
      if (!bgColor) bgColor = '#e8dfd5';
      if (!accentColor) accentColor = '#d97706';
      if (!bgColor.startsWith('#')) bgColor = '#' + bgColor;
      if (!accentColor.startsWith('#')) accentColor = '#' + accentColor;

      // Resolve Neumorphism Parameters (Radius, Distance, Light/Dark Intensity, Blur)
      const radius = (neo && typeof neo.radius !== 'undefined')
        ? parseInt(neo.radius, 10)
        : ((state.config && state.config.theme && typeof state.config.theme.radius !== 'undefined') ? parseInt(state.config.theme.radius, 10) : 5);

      const distance = Math.min(10, Math.max(1, (neo && typeof neo.distance !== 'undefined')
        ? parseInt(neo.distance, 10)
        : ((state.config && state.config.theme && typeof state.config.theme.distance !== 'undefined') ? parseInt(state.config.theme.distance, 10) : 3)));

      const lightIntensity = (neo && typeof neo.lightIntensity !== 'undefined')
        ? parseInt(neo.lightIntensity, 10)
        : ((state.config && state.config.theme && typeof state.config.theme.lightIntensity !== 'undefined')
          ? parseInt(state.config.theme.lightIntensity, 10)
          : ((state.config && state.config.theme && typeof state.config.theme.intensity !== 'undefined')
            ? parseInt(state.config.theme.intensity, 10) : 22));

      const darkIntensity = (neo && typeof neo.darkIntensity !== 'undefined')
        ? parseInt(neo.darkIntensity, 10)
        : ((state.config && state.config.theme && typeof state.config.theme.darkIntensity !== 'undefined')
          ? parseInt(state.config.theme.darkIntensity, 10)
          : ((state.config && state.config.theme && typeof state.config.theme.intensity !== 'undefined')
            ? parseInt(state.config.theme.intensity, 10) : 6));

      const blur = (neo && typeof neo.blur !== 'undefined')
        ? parseInt(neo.blur, 10)
        : ((state.config && state.config.theme && typeof state.config.theme.blur !== 'undefined') ? parseInt(state.config.theme.blur, 10) : 10);

      const avgIntensity = Math.round((lightIntensity + darkIntensity) / 2);

      // Compute Chromatic Shadows: exact lighter tint for top and darker shade for bottom
      const chromatic = deriveRealisticShadows(bgColor, lightIntensity, darkIntensity);
      const shadowLight = chromatic.shadowLight;
      const shadowDark = chromatic.shadowDark;
      const shadowDarkDeep = chromatic.shadowDarkDeep;

      // Dynamic WCAG-compliant harmonic typography system (guaranteed >= 4.5:1 contrast)
      const typography = deriveHarmonicTypography(bgColor);
      const textPrimary = typography.textPrimary;
      const textSecondary = typography.textSecondary;
      const textMuted = typography.textMuted;
      const textDisabled = typography.textDisabled;

      // Derived accent color shades
      const accRgb = hexToRgb(accentColor);
      const accLight = lightenHex(accentColor, 20);
      const accPastel = lightenHex(accentColor, 45);
      const accSuperPastel = lightenHex(accentColor, 60);
      const accDark = darkenHex(accentColor, 18);
      const accDeep = darkenHex(accentColor, 35);
      const deepRgb = hexToRgb(accDeep);

      const accGlow = `0 4px 16px rgba(${accRgb.r}, ${accRgb.g}, ${accRgb.b}, 0.45)`;
      const accGradient = `linear-gradient(135deg, ${accLight} 0%, ${accentColor} 100%)`;
      const accTroughGrad = accentColor;
      const accTroughShadow = `inset 0 2px 4px rgba(0, 0, 0, 0.35), 0 0 10px ${accentColor}`;

      const root = document.documentElement;
      root.style.setProperty('--bg-color', bgColor);
      root.style.setProperty('--surface-color', bgColor);
      root.style.setProperty('--shadow-light', shadowLight);
      root.style.setProperty('--shadow-dark', shadowDark);
      root.style.setProperty('--shadow-dark-deep', shadowDarkDeep);
      root.style.setProperty('--text-primary', textPrimary);
      root.style.setProperty('--text-secondary', textSecondary);
      root.style.setProperty('--text-muted', textMuted);
      root.style.setProperty('--text-disabled', textDisabled);

      root.style.setProperty('--accent-primary', accentColor);
      root.style.setProperty('--accent-light', accLight);
      root.style.setProperty('--accent-pastel', accPastel);
      root.style.setProperty('--accent-dark', accDark);
      root.style.setProperty('--accent-deep', accDeep);
      root.style.setProperty('--accent-glow', accGlow);
      root.style.setProperty('--accent-gradient', accGradient);
      root.style.setProperty('--accent-trough-gradient', accTroughGrad);
      root.style.setProperty('--accent-trough-shadow', accTroughShadow);

      // Dynamic theme-matching scrollbar variables
      root.style.setProperty('--scrollbar-thumb', shadowDark);
      root.style.setProperty('--scrollbar-thumb-hover', accentColor);
      root.style.setProperty('--bg-hover', shadowDark);

      // Apply dynamic Neumorphism core parameters
      root.style.setProperty('--neo-radius', `${radius}px`);
      root.style.setProperty('--neo-dist', `${distance}px`);
      root.style.setProperty('--neo-blur', `${blur}px`);
      root.style.setProperty('--neo-light-intensity', `${lightIntensity}%`);
      root.style.setProperty('--neo-dark-intensity', `${darkIntensity}%`);
      root.style.setProperty('--neo-intensity', `${avgIntensity}%`);

      // Sync state
      if (!state.config.theme) {
        state.config.theme = {};
      }
      state.config.theme.bgColor = bgColor;
      state.config.theme.accentColor = accentColor;
      state.config.theme.radius = radius;
      state.config.theme.distance = distance;
      state.config.theme.lightIntensity = lightIntensity;
      state.config.theme.darkIntensity = darkIntensity;
      state.config.theme.intensity = avgIntensity;
      state.config.theme.blur = blur;

      // Persist to localStorage immediately
      try {
        localStorage.setItem('ahk_theme', JSON.stringify({
          bgColor,
          accentColor,
          radius,
          distance,
          lightIntensity,
          darkIntensity,
          intensity: avgIntensity,
          blur
        }));
      } catch (e) { }

      // Sync input controls if present
      if (themeBgColorPicker) themeBgColorPicker.value = bgColor;
      if (themeBgHex) themeBgHex.value = bgColor.toUpperCase();
      if (themeAccentColorPicker) themeAccentColorPicker.value = accentColor;
      if (themeAccentHex) themeAccentHex.value = accentColor.toUpperCase();

      if (themeSliderRadius) {
        themeSliderRadius.value = radius;
        updateSliderProgress(themeSliderRadius);
        if (badgeRadius) badgeRadius.textContent = `${radius}px`;
      }
      if (themeSliderDistance) {
        themeSliderDistance.value = distance;
        updateSliderProgress(themeSliderDistance);
        if (badgeDistance) badgeDistance.textContent = `${distance}px`;
      }
      if (themeSliderLightIntensity) {
        themeSliderLightIntensity.value = lightIntensity;
        updateSliderProgress(themeSliderLightIntensity);
        if (badgeLightIntensity) badgeLightIntensity.textContent = `${lightIntensity}%`;
      }
      if (themeSliderDarkIntensity) {
        themeSliderDarkIntensity.value = darkIntensity;
        updateSliderProgress(themeSliderDarkIntensity);
        if (badgeDarkIntensity) badgeDarkIntensity.textContent = `${darkIntensity}%`;
      }
      if (themeSliderBlur) {
        themeSliderBlur.value = blur;
        updateSliderProgress(themeSliderBlur);
        if (badgeBlur) badgeBlur.textContent = `${blur}px`;
      }

      const osdMode = (state.config && state.config.theme && state.config.theme.profileNotificationMode)
        || ((state.config && state.config.theme && (state.config.theme.osdIconOnly === 1 || state.config.theme.osdIconOnly === true)) ? 'icon' : 'both');
      updateThemeOsdModeUI(osdMode);

      // Refresh all neumorphic sliders so track fills dynamically adapt to the active theme colors
      document.querySelectorAll('.neumorphic-slider').forEach(sl => {
        updateSliderProgress(sl);
      });

      updateActivePresetChips();

      if (save) {
        syncConfig();
      }
    }

    function updateThemeOsdModeUI(mode) {
      const pills = document.getElementById('themeOsdModePills');
      if (pills) {
        pills.querySelectorAll('.trigger-pill').forEach(btn => {
          btn.classList.toggle('active', btn.dataset.mode === mode);
        });
      }
      const desc = document.getElementById('themeOsdModeDesc');
      if (desc) {
        if (mode === 'icon') {
          desc.textContent = 'Display floating icon badge only without text';
        } else if (mode === 'text') {
          desc.textContent = 'Display floating pill with profile name text only';
        } else if (mode === 'off') {
          desc.textContent = 'Notifications completely disabled for all profiles';
        } else {
          desc.textContent = 'Display both profile icon and name pill';
        }
      }
    }

    function getCurrentThemeColors(preferDom = true) {
      let bg = '';
      let acc = '';

      if (preferDom) {
        if (themeBgHex && /^#[0-9A-Fa-f]{6}$/i.test(themeBgHex.value.trim())) {
          bg = themeBgHex.value.trim();
        } else if (themeBgColorPicker && /^#[0-9A-Fa-f]{6}$/i.test(themeBgColorPicker.value)) {
          bg = themeBgColorPicker.value;
        }

        if (themeAccentHex && /^#[0-9A-Fa-f]{6}$/i.test(themeAccentHex.value.trim())) {
          acc = themeAccentHex.value.trim();
        } else if (themeAccentColorPicker && /^#[0-9A-Fa-f]{6}$/i.test(themeAccentColorPicker.value)) {
          acc = themeAccentColorPicker.value;
        }
      }

      if (!bg) {
        bg = (state.config && state.config.theme && state.config.theme.bgColor)
          || document.documentElement.style.getPropertyValue('--bg-color')
          || '#e8dfd5';
      }

      if (!acc) {
        acc = (state.config && state.config.theme && state.config.theme.accentColor)
          || document.documentElement.style.getPropertyValue('--accent-primary')
          || '#d97706';
      }

      const radius = (preferDom && themeSliderRadius)
        ? parseInt(themeSliderRadius.value, 10)
        : ((state.config && state.config.theme && typeof state.config.theme.radius !== 'undefined') ? parseInt(state.config.theme.radius, 10) : 5);

      const distance = Math.min(10, Math.max(1, (preferDom && themeSliderDistance)
        ? parseInt(themeSliderDistance.value, 10)
        : ((state.config && state.config.theme && typeof state.config.theme.distance !== 'undefined') ? parseInt(state.config.theme.distance, 10) : 3)));

      const lightIntensity = (preferDom && themeSliderLightIntensity)
        ? parseInt(themeSliderLightIntensity.value, 10)
        : ((state.config && state.config.theme && typeof state.config.theme.lightIntensity !== 'undefined')
          ? parseInt(state.config.theme.lightIntensity, 10)
          : ((state.config && state.config.theme && typeof state.config.theme.intensity !== 'undefined') ? parseInt(state.config.theme.intensity, 10) : 22));

      const darkIntensity = (preferDom && themeSliderDarkIntensity)
        ? parseInt(themeSliderDarkIntensity.value, 10)
        : ((state.config && state.config.theme && typeof state.config.theme.darkIntensity !== 'undefined')
          ? parseInt(state.config.theme.darkIntensity, 10)
          : ((state.config && state.config.theme && typeof state.config.theme.intensity !== 'undefined') ? parseInt(state.config.theme.intensity, 10) : 6));

      const blur = (preferDom && themeSliderBlur)
        ? parseInt(themeSliderBlur.value, 10)
        : ((state.config && state.config.theme && typeof state.config.theme.blur !== 'undefined') ? parseInt(state.config.theme.blur, 10) : 10);

      return {
        bg: bg.trim(),
        acc: acc.trim(),
        radius,
        distance,
        lightIntensity,
        darkIntensity,
        intensity: Math.round((lightIntensity + darkIntensity) / 2),
        blur
      };
    }

    function getNeoSliderValues() {
      return {
        radius: themeSliderRadius ? parseInt(themeSliderRadius.value, 10) : 22,
        distance: themeSliderDistance ? parseInt(themeSliderDistance.value, 10) : 3,
        lightIntensity: themeSliderLightIntensity ? parseInt(themeSliderLightIntensity.value, 10) : 18,
        darkIntensity: themeSliderDarkIntensity ? parseInt(themeSliderDarkIntensity.value, 10) : 18,
        blur: themeSliderBlur ? parseInt(themeSliderBlur.value, 10) : 8
      };
    }

    function getCustomThemePresets() {
      if (state.config && state.config.theme && Array.isArray(state.config.theme.customPresets)) {
        return state.config.theme.customPresets;
      }
      try {
        const cached = localStorage.getItem('ahk_custom_theme_presets');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) {
            if (!state.config.theme) state.config.theme = {};
            state.config.theme.customPresets = parsed;
            return parsed;
          }
        }
      } catch (e) { }
      return [];
    }

    function renderCuratedPresets() {
      const grid = document.getElementById('bgSwatchesGrid');
      if (!grid) return;

      grid.innerHTML = '';
      const currentColors = getCurrentThemeColors(true);

      Object.entries(THEME_PRESETS).forEach(([key, preset]) => {
        if (key === 'soft-gray') return;

        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'theme-swatch-chip theme-card-chip';
        chip.dataset.preset = key;
        chip.dataset.color = preset.bgColor;
        chip.title = `${preset.name} (Background: ${preset.bgColor}, Accent: ${preset.accentColor || currentColors.acc})`;
        chip.setAttribute('aria-label', preset.name);
        chip.style.backgroundColor = preset.bgColor;
        chip.style.borderColor = preset.accentColor || currentColors.acc;
        chip.style.color = preset.accentColor || currentColors.acc;
        chip.style.borderRadius = `${Math.min(24, Math.max(0, typeof preset.radius !== 'undefined' ? preset.radius : 10))}px`;
        chip.style.boxShadow = computePresetShadow(
          preset.bgColor,
          preset.lightIntensity,
          preset.darkIntensity,
          preset.distance,
          preset.blur
        );

        chip.innerHTML = `
        <svg class="theme-check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      `;

        grid.appendChild(chip);
      });

      updateActivePresetChips();
    }

    function updateActivePresetChips() {
      const currentColors = getCurrentThemeColors(true);
      const currentSliders = getNeoSliderValues();

      // Check curated swatches
      document.querySelectorAll('#bgSwatchesGrid .theme-swatch-chip').forEach(chip => {
        const presetKey = chip.dataset.preset;
        const preset = presetKey ? THEME_PRESETS[presetKey] : null;
        let isMatch = false;
        if (preset) {
          isMatch = (
            preset.bgColor.toLowerCase() === currentColors.bg.toLowerCase() &&
            (preset.accentColor || currentColors.acc).toLowerCase() === currentColors.acc.toLowerCase() &&
            parseInt(preset.radius, 10) === currentSliders.radius &&
            parseInt(preset.distance, 10) === currentSliders.distance &&
            parseInt(preset.blur, 10) === currentSliders.blur &&
            parseInt(preset.lightIntensity, 10) === currentSliders.lightIntensity &&
            parseInt(preset.darkIntensity, 10) === currentSliders.darkIntensity
          );
          chip.style.backgroundColor = preset.bgColor;
          chip.style.borderColor = preset.accentColor || currentColors.acc;
          chip.style.color = preset.accentColor || currentColors.acc;
          chip.style.borderRadius = `${Math.min(24, Math.max(0, typeof preset.radius !== 'undefined' ? preset.radius : 10))}px`;
          chip.style.boxShadow = computePresetShadow(preset.bgColor, preset.lightIntensity, preset.darkIntensity, preset.distance, preset.blur);
        } else if (chip.dataset.color) {
          isMatch = (chip.dataset.color.toLowerCase() === currentColors.bg.toLowerCase());
        }
        chip.classList.toggle('active', isMatch);
      });

      document.querySelectorAll('#accentSwatchesGrid .theme-swatch-chip').forEach(chip => {
        chip.classList.toggle('active', chip.dataset.color.toLowerCase() === currentColors.acc.toLowerCase());
      });

      // Check custom presets
      const presets = getCustomThemePresets();
      document.querySelectorAll('#customPresetsGrid .custom-preset-chip').forEach(chip => {
        const p = presets.find(item => item.id === chip.dataset.presetId);
        if (!p) {
          chip.classList.remove('active');
          return;
        }
        const isMatch = (
          p.bgColor.toLowerCase() === currentColors.bg.toLowerCase() &&
          p.accentColor.toLowerCase() === currentColors.acc.toLowerCase() &&
          parseInt(p.radius, 10) === currentSliders.radius &&
          parseInt(p.distance, 10) === currentSliders.distance &&
          parseInt(p.blur, 10) === currentSliders.blur &&
          (typeof p.lightIntensity === 'undefined' || parseInt(p.lightIntensity, 10) === currentSliders.lightIntensity) &&
          (typeof p.darkIntensity === 'undefined' || parseInt(p.darkIntensity, 10) === currentSliders.darkIntensity)
        );
        chip.classList.toggle('active', isMatch);
      });
    }

    function renderCustomPresets() {
      const grid = document.getElementById('customPresetsGrid');
      if (!grid) return;

      const presets = getCustomThemePresets();
      grid.innerHTML = '';

      if (presets.length === 0) {
        grid.innerHTML = '<span class="empty-custom-presets-hint">No custom presets saved yet. Adjust colors & sliders above, name your preset, and click Save Preset!</span>';
        return;
      }

      const currentColors = getCurrentThemeColors();
      const currentSliders = getNeoSliderValues();

      presets.forEach(p => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'theme-swatch-chip theme-card-chip custom-preset-chip';
        chip.dataset.presetId = p.id;
        chip.title = `${p.name} (Background: ${p.bgColor}, Accent: ${p.accentColor}, Radius: ${p.radius}px, Blur: ${p.blur}px)`;
        chip.setAttribute('aria-label', p.name);
        chip.style.backgroundColor = p.bgColor;
        chip.style.borderColor = p.accentColor;
        chip.style.color = p.accentColor;
        chip.style.borderRadius = `${Math.min(22, Math.max(0, typeof p.radius !== 'undefined' ? p.radius : 10))}px`;
        chip.style.boxShadow = computePresetShadow(
          p.bgColor,
          (typeof p.lightIntensity !== 'undefined') ? p.lightIntensity : 20,
          (typeof p.darkIntensity !== 'undefined') ? p.darkIntensity : 20,
          (typeof p.distance !== 'undefined') ? p.distance : 3,
          (typeof p.blur !== 'undefined') ? p.blur : 8
        );

        const isMatch = (
          p.bgColor.toLowerCase() === currentColors.bg.toLowerCase() &&
          p.accentColor.toLowerCase() === currentColors.acc.toLowerCase() &&
          parseInt(p.radius, 10) === currentSliders.radius &&
          parseInt(p.distance, 10) === currentSliders.distance &&
          parseInt(p.blur, 10) === currentSliders.blur &&
          (typeof p.lightIntensity === 'undefined' || parseInt(p.lightIntensity, 10) === currentSliders.lightIntensity) &&
          (typeof p.darkIntensity === 'undefined' || parseInt(p.darkIntensity, 10) === currentSliders.darkIntensity)
        );

        if (isMatch) {
          chip.classList.add('active');
        }

        chip.innerHTML = `
        <svg class="theme-check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span class="btn-delete-preset" data-delete-id="${p.id}" title="Delete preset">&times;</span>
      `;

        chip.addEventListener('click', (e) => {
          if (e.target.closest('.btn-delete-preset')) return;

          applyTheme(p.bgColor, p.accentColor, true, {
            radius: p.radius,
            distance: p.distance,
            lightIntensity: p.lightIntensity,
            darkIntensity: p.darkIntensity,
            blur: p.blur
          });

          updateActivePresetChips();
        });

        const btnDelete = chip.querySelector('.btn-delete-preset');
        if (btnDelete) {
          btnDelete.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteCustomPreset(p.id);
          });
        }

        grid.appendChild(chip);
      });
    }

    function saveCurrentCustomPreset() {
      const input = document.getElementById('inputCustomPresetName');
      const nameVal = input ? input.value.trim() : '';

      if (!state.config.theme) state.config.theme = {};
      let presets = getCustomThemePresets();

      const name = nameVal || `Custom Theme ${presets.length + 1}`;
      const current = getCurrentThemeColors();
      const sliders = getNeoSliderValues();

      const existingIndex = presets.findIndex(p => p.name.toLowerCase() === name.toLowerCase());
      const newPreset = {
        id: (existingIndex >= 0) ? presets[existingIndex].id : ('custom_' + Date.now()),
        name: name,
        bgColor: current.bg,
        accentColor: current.acc,
        radius: sliders.radius,
        distance: sliders.distance,
        lightIntensity: sliders.lightIntensity,
        darkIntensity: sliders.darkIntensity,
        blur: sliders.blur
      };

      if (existingIndex >= 0) {
        presets[existingIndex] = newPreset;
      } else {
        presets.push(newPreset);
      }

      state.config.theme.customPresets = presets;

      try {
        localStorage.setItem('ahk_custom_theme_presets', JSON.stringify(presets));
      } catch (e) { }

      syncConfig();

      if (input) input.value = '';

      renderCustomPresets();
      updateActivePresetChips();

      const btnSave = document.getElementById('btnSaveCustomPreset');
      if (btnSave) {
        const origText = btnSave.innerHTML;
        btnSave.classList.add('btn-saved');
        btnSave.innerHTML = '<span>SAVED!</span>';
        setTimeout(() => {
          btnSave.classList.remove('btn-saved');
          btnSave.innerHTML = origText;
        }, 1200);
      }
    }

    function deleteCustomPreset(id) {
      if (!state.config.theme) state.config.theme = {};
      let presets = getCustomThemePresets();
      presets = presets.filter(p => p.id !== id);
      state.config.theme.customPresets = presets;

      try {
        localStorage.setItem('ahk_custom_theme_presets', JSON.stringify(presets));
      } catch (e) { }

      syncConfig();
      renderCustomPresets();
      updateActivePresetChips();
    }

    // ============================================================================
    // Event Listeners & Initialization
    // ============================================================================

