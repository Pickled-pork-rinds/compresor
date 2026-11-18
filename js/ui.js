/* ==========================================================================
   js/ui.js — Piezas compartidas por las tres páginas
   --------------------------------------------------------------------------
   · Íconos SVG (window.UI.icon)
   · Barra de navegación, menú móvil y pie de página (se insertan aquí para
     no repetir el mismo HTML en index.html, app.html y mst.html)
   · Inicio de sesión opcional con Google + modo invitado
   · Historial local, avisos (toasts), descargas, copiar al portapapeles
   · Control segmentado, foco de luz en tarjetas y aparición al hacer scroll
   ========================================================================== */
(function () {
  'use strict';
  const CFG = window.HUFFLY_CONFIG || {};

  /* ------------------------------------------------------------------------
     Íconos (trazos de 24×24, estilo Lucide)
     ------------------------------------------------------------------------ */
  const PATHS = {
    check: '<path d="M20 6 9 17l-5-5"/>',
    arrow: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
    file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
    shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
    book: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    binary: '<rect x="14" y="14" width="4" height="6" rx="2"/><rect x="6" y="4" width="4" height="6" rx="2"/><path d="M6 20h4"/><path d="M14 10h4"/><path d="M6 14h2v6"/><path d="M14 4h2v6"/>',
    tree: '<circle cx="12" cy="5" r="2.5"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M10.6 7.1 7.2 15.8"/><path d="m13.4 7.1 3.4 8.7"/>',
    inspect: '<path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M4.27 21a2 2 0 0 0 1.73 1H18a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v3"/><path d="m9 18-1.5-1.5"/><circle cx="5" cy="14" r="3"/>',
    terminal: '<path d="m4 17 6-6-6-6"/><path d="M12 19h8"/>',
    chart: '<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
    lock: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    github: '<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    play: '<path d="M7 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5z" fill="currentColor" stroke="none"/>',
    pause: '<rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor" stroke="none"/><rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor" stroke="none"/>',
    first: '<path d="M19 20 9 12l10-8z"/><path d="M5 19V5"/>',
    last: '<path d="m5 4 10 8-10 8z"/><path d="M19 5v14"/>',
    prev: '<path d="m15 18-6-6 6-6"/>',
    next: '<path d="m9 18 6-6-6-6"/>',
    zoomIn: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><path d="M11 8v6"/><path d="M8 11h6"/>',
    zoomOut: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><path d="M8 11h6"/>',
    fit: '<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>',
    copy: '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    package: '<path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
    pen: '<path d="M12 20h9"/><path d="M16.38 3.62a1 1 0 0 1 3 3L7.37 18.64a2 2 0 0 1-.86.5l-2.87.84a.5.5 0 0 1-.62-.62l.84-2.87a2 2 0 0 1 .5-.86z"/>',
    flask: '<path d="M4.5 3h15"/><path d="M6 3v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V3"/><path d="M6 14h12"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
    history: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',
    reset: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
    shuffle: '<path d="m18 14 4 4-4 4"/><path d="m18 2 4 4-4 4"/><path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22"/><path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2"/><path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8"/>',
    external: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    globe: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
    layers: '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
    graph: '<circle cx="5" cy="6" r="2.5"/><circle cx="19" cy="5" r="2.5"/><circle cx="12" cy="19" r="2.5"/><circle cx="18" cy="15" r="2"/><path d="M7.4 6.6 16.6 5.3"/><path d="m6.2 8.2 4.6 8.6"/><path d="m14.4 18.2 2-1.8"/>',
    zap: '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
    eye: '<path d="M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0"/><circle cx="12" cy="12" r="3"/>',
    user: '<circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/>',
  };

  function icon(name, size = 18, cls = '') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="${cls}">${PATHS[name] || ''}</svg>`;
  }

  const GOOGLE_G = '<svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.7-.4-3.9z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2A11.9 11.9 0 0 1 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3a12 12 0 0 1-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.7-.4-3.9z"/></svg>';

  const LOGO_MARK = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 4.2 4.3 10.4M8 4.2l3.7 6.2" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/><circle cx="8" cy="3.6" r="2.1" fill="#fff"/><circle cx="4" cy="11.6" r="2.1" fill="#fff" fill-opacity=".9"/><circle cx="12" cy="11.6" r="2.1" fill="#fff" fill-opacity=".55"/></svg>';

  /* ------------------------------------------------------------------------
     Utilidades
     ------------------------------------------------------------------------ */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const nf = new Intl.NumberFormat('es-MX');
  const fmtInt = (n) => nf.format(n);
  const fmtNum = (n, d = 2) => new Intl.NumberFormat('es-MX', { minimumFractionDigits: d, maximumFractionDigits: d }).format(n);

  const store = {
    get(key, fallback = null) {
      try {
        const v = localStorage.getItem(key);
        return v === null ? fallback : JSON.parse(v);
      } catch (e) {
        return fallback;
      }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* almacenamiento bloqueado */ }
    },
    del(key) {
      try { localStorage.removeItem(key); } catch (e) { /* nada */ }
    },
  };

  /* ------------------------------------------------------------------------
     Avisos
     ------------------------------------------------------------------------ */
  function toast(msg, type = 'info') {
    let box = $('.toasts');
    if (!box) {
      box = document.createElement('div');
      box.className = 'toasts';
      box.setAttribute('role', 'status');
      box.setAttribute('aria-live', 'polite');
      document.body.appendChild(box);
    }
    const ico = type === 'ok' ? `<span class="check-dot">${icon('check', 11)}</span>` : type === 'err' ? `<span class="x-dot">${icon('x', 11)}</span>` : `<span class="text-[var(--violet-soft)]">${icon('info', 18)}</span>`;
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `${ico}<span>${esc(msg)}</span>`;
    box.appendChild(el);
    setTimeout(() => {
      el.classList.add('is-out');
      el.addEventListener('animationend', () => el.remove(), { once: true });
    }, type === 'err' ? 5200 : 3200);
  }

  function download(data, filename, mime = 'application/octet-stream') {
    const blob = data instanceof Blob ? data : new Blob([data], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      const t = document.createElement('textarea');
      t.value = text;
      t.style.position = 'fixed';
      t.style.opacity = '0';
      document.body.appendChild(t);
      t.select();
      document.execCommand('copy');
      t.remove();
    }
  }

  /* ------------------------------------------------------------------------
     Sesión e historial (sólo en este navegador)
     ------------------------------------------------------------------------ */
  const auth = {
    user() { return store.get('huffly:usuario'); },
    signOut() {
      store.del('huffly:usuario');
      if (window.google && google.accounts && google.accounts.id) google.accounts.id.disableAutoSelect();
      renderAuth();
      toast('Sesión cerrada');
    },
  };
  const history = {
    key() {
      const u = auth.user();
      return 'huffly:historial:' + (u ? u.sub : 'invitado');
    },
    list() { return store.get(history.key(), []); },
    add(item) {
      const list = history.list();
      list.unshift({ ...item, fecha: Date.now() });
      store.set(history.key(), list.slice(0, 12));
      document.dispatchEvent(new CustomEvent('huffly:historial'));
    },
    clear() {
      store.del(history.key());
      document.dispatchEvent(new CustomEvent('huffly:historial'));
    },
  };

  function decodeJwt(token) {
    const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(b64);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  }

  let gisPromise = null;
  function loadGoogle() {
    if (window.google && google.accounts && google.accounts.id) return Promise.resolve();
    if (!gisPromise) {
      gisPromise = new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://accounts.google.com/gsi/client';
        s.async = true;
        s.onload = resolve;
        s.onerror = () => reject(new Error('No se pudo cargar el servicio de Google.'));
        document.head.appendChild(s);
      });
    }
    return gisPromise;
  }

  function onGoogleCredential(resp) {
    try {
      const p = decodeJwt(resp.credential);
      store.set('huffly:usuario', { sub: p.sub, name: p.name || p.email, email: p.email, picture: p.picture || '' });
      $('#login-modal')?.close();
      renderAuth();
      toast(`Hola, ${(p.given_name || p.name || '').split(' ')[0]}. Tu historial se guardará en este navegador.`, 'ok');
      document.dispatchEvent(new CustomEvent('huffly:historial'));
    } catch (e) {
      toast('Google respondió, pero no se pudo leer tu perfil. Intenta de nuevo.', 'err');
    }
  }

  async function mountGoogleButton(slot, note) {
    const fallback = `<button class="btn btn-glass w-full" type="button" data-google-off>${GOOGLE_G}Continuar con Google</button>`;
    if (!CFG.googleClientId) {
      slot.innerHTML = fallback;
      note.textContent = 'El inicio con Google no está activado en este sitio. Puedes usar todas las funciones sin cuenta.';
      console.info('[Huffly] Para activar Google, agrega googleClientId en js/config.js (ver README → "Inicio de sesión con Google").');
      return;
    }
    slot.innerHTML = '<div class="skeleton h-11 w-full"></div>';
    try {
      await loadGoogle();
      google.accounts.id.initialize({ client_id: CFG.googleClientId, callback: onGoogleCredential, ux_mode: 'popup' });
      slot.innerHTML = '';
      google.accounts.id.renderButton(slot, { theme: 'filled_black', size: 'large', shape: 'pill', text: 'continue_with', width: Math.min(slot.clientWidth || 340, 400), locale: 'es' });
      note.textContent = 'Sólo usamos tu nombre y foto para mostrar tu sesión. No hay servidor que los guarde.';
    } catch (e) {
      slot.innerHTML = fallback;
      note.textContent = 'No se pudo conectar con Google. Revisa tu conexión o continúa sin cuenta.';
    }
  }

  function buildModal() {
    if ($('#login-modal')) return;
    const d = document.createElement('dialog');
    d.className = 'modal';
    d.id = 'login-modal';
    d.setAttribute('aria-labelledby', 'login-title');
    d.innerHTML = `
      <div class="modal-card glass-solid edge-glow p-7 sm:p-8">
        <button class="btn btn-ghost btn-icon absolute top-3 right-3" data-close aria-label="Cerrar">${icon('x', 18)}</button>
        <span class="logo-mark" style="width:42px;height:42px;border-radius:13px">${LOGO_MARK}</span>
        <h2 id="login-title" class="mt-5 text-[22px] font-semibold tracking-tight">Inicia sesión en ${esc(CFG.nombre || 'Huffly')}</h2>
        <p class="mt-2 text-[15px] leading-relaxed">Tu cuenta sólo sirve para guardar el historial de compresiones en este navegador. Los archivos nunca salen de tu equipo.</p>
        <div class="mt-6 min-h-11 flex justify-center" id="gis-slot"></div>
        <div class="divider-text my-5">o</div>
        <button class="btn btn-glass w-full" type="button" data-guest>Continuar sin cuenta</button>
        <p class="mt-5 text-[12.5px] leading-relaxed muted" id="gis-note"></p>
      </div>`;
    document.body.appendChild(d);
    d.addEventListener('click', (e) => {
      if (e.target === d || e.target.closest('[data-close]')) d.close();
      if (e.target.closest('[data-guest]')) {
        d.close();
        if (!/app\.html$/.test(location.pathname)) location.href = 'app.html#fuente';
        else toast('Estás usando Huffly como invitado.');
      }
      if (e.target.closest('[data-google-off]')) toast('El inicio con Google no está activado en este sitio. Continúa sin cuenta.');
    });
  }

  function openLogin() {
    buildModal();
    const d = $('#login-modal');
    d.showModal();
    mountGoogleButton($('#gis-slot', d), $('#gis-note', d));
  }

  function renderAuth() {
    const slot = $('#auth-slot');
    if (!slot) return;
    const u = auth.user();
    if (!u) {
      slot.innerHTML = `<button class="btn btn-ghost btn-sm" type="button" data-login>Iniciar sesión</button>`;
      return;
    }
    const initial = esc((u.name || '?').trim().charAt(0).toUpperCase());
    const avatar = u.picture
      ? `<img class="avatar" src="${esc(u.picture)}" alt="" referrerpolicy="no-referrer">`
      : `<span class="avatar avatar-fallback">${initial}</span>`;
    slot.innerHTML = `
      <div class="relative">
        <button class="flex items-center gap-2 rounded-full p-1 pr-3 hover:bg-white/5 transition" type="button" id="user-btn" aria-haspopup="menu" aria-expanded="false">
          ${avatar}<span class="text-[14px] text-[var(--text-1)] max-w-32 truncate">${esc((u.name || '').split(' ')[0])}</span>
        </button>
        <div class="menu glass-solid" role="menu" id="user-menu">
          <div class="px-3 py-2 text-[12.5px] muted truncate">${esc(u.email || '')}</div>
          <a href="app.html#historial" role="menuitem">${icon('history', 16)}Mis compresiones</a>
          <button type="button" role="menuitem" data-signout>${icon('logout', 16)}Cerrar sesión</button>
        </div>
      </div>`;
  }

  /* ------------------------------------------------------------------------
     Navegación y pie de página
     ------------------------------------------------------------------------ */
  const NAV = [
    { id: 'como', label: 'Cómo funciona', href: 'index.html#como-funciona' },
    { id: 'estudio', label: 'Estudio', href: 'app.html' },
    { id: 'inspector', label: 'Inspector', href: 'app.html#inspector' },
    { id: 'mst', label: 'Expansión mínima', href: 'mst.html' },
    { id: 'formato', label: 'Formato .hfz', href: 'index.html#formato' },
  ];

  function renderNav() {
    const root = $('#nav-root');
    if (!root) return;
    const active = root.dataset.active || '';
    const link = (l, cls) => `<a class="${cls}${l.id === active ? ' is-active' : ''}" href="${l.href}" data-nav="${l.id}">${l.label}</a>`;
    root.innerHTML = `
      <nav class="nav" id="nav" aria-label="Principal">
        <div class="shell nav-inner">
          <a href="index.html" class="logo" aria-label="${esc(CFG.nombre)}, inicio"><span class="logo-mark">${LOGO_MARK}</span>${esc(CFG.nombre)}</a>
          <div class="hidden lg:flex items-center gap-0.5 ml-6">${NAV.map((l) => link(l, 'nav-link')).join('')}</div>
          <div class="ml-auto flex items-center gap-2">
            <div id="auth-slot" class="hidden sm:flex items-center"></div>
            <a href="app.html#fuente" class="btn btn-cta btn-sm hidden sm:inline-flex">Comprimir un libro</a>
            <button class="btn btn-ghost btn-icon lg:hidden burger flex-col" type="button" id="burger" aria-label="Abrir menú" aria-expanded="false" aria-controls="nav-mobile"><span></span><span></span></button>
          </div>
        </div>
        <div class="nav-mobile lg:hidden" id="nav-mobile">
          <div>
            <div class="shell pb-5 pt-1 flex flex-col">
              ${NAV.map((l) => link(l, 'nav-link block rounded-xl py-3 text-[15.5px]')).join('')}
              <div class="flex gap-2 pt-4 sm:hidden">
                <button class="btn btn-glass btn-sm flex-1" type="button" data-login>Iniciar sesión</button>
                <a href="app.html#fuente" class="btn btn-cta btn-sm flex-1">Comprimir un libro</a>
              </div>
            </div>
          </div>
        </div>
      </nav>`;

    const nav = $('#nav');
    const burger = $('#burger');
    const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    burger.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    });
    $$('#nav-mobile a').forEach((a) => a.addEventListener('click', () => {
      nav.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
    }));
    renderAuth();
  }

  /* En la portada, el enlace activo sigue a la sección visible */
  function scrollSpy() {
    const map = { 'como-funciona': 'como', formato: 'formato' };
    const targets = Object.keys(map).map((id) => document.getElementById(id)).filter(Boolean);
    if (!targets.length || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        const id = map[en.target.id];
        $$(`[data-nav="${id}"]`).forEach((a) => a.classList.toggle('is-active', en.isIntersecting));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    targets.forEach((t) => io.observe(t));
  }

  function renderFooter() {
    const root = $('#footer-root');
    if (!root) return;
    const team = (CFG.equipo || []).map((n) => `<li>${esc(n)}</li>`).join('');
    root.innerHTML = `
      <footer class="footer border-t border-[var(--line)] mt-28">
        <div class="shell py-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div class="max-w-xs">
            <a href="index.html" class="logo"><span class="logo-mark">${LOGO_MARK}</span>${esc(CFG.nombre)}</a>
            <p class="mt-4 text-[14.5px] leading-relaxed muted">Compresión de texto con el algoritmo de Huffman, explicada paso a paso.</p>
            <p class="mt-4 text-[13px] text-[var(--text-4)]">${esc(CFG.materia)}, ${esc(CFG.ciclo)}<br>${esc(CFG.institucion)}</p>
          </div>
          <div>
            <h4 class="text-[13.5px] font-semibold mb-4">Producto</h4>
            <ul class="space-y-2.5 text-[14px]">
              <li><a href="app.html">Estudio</a></li>
              <li><a href="app.html#inspector">Inspector</a></li>
              <li><a href="mst.html">Expansión mínima</a></li>
              <li><a href="index.html#formato">Formato .hfz</a></li>
            </ul>
          </div>
          <div>
            <h4 class="text-[13.5px] font-semibold mb-4">Recursos</h4>
            <ul class="space-y-2.5 text-[14px]">
              <li><a href="${esc(CFG.repositorio)}" target="_blank" rel="noopener">Repositorio en GitHub</a></li>
              ${CFG.tablero ? `<li><a href="${esc(CFG.tablero)}" target="_blank" rel="noopener">Tablero del proyecto</a></li>` : ''}
              <li><a href="https://www.gutenberg.org/" target="_blank" rel="noopener">Project Gutenberg</a></li>
              <li><a href="https://gutendex.com/" target="_blank" rel="noopener">API Gutendex</a></li>
            </ul>
          </div>
          <div>
            <h4 class="text-[13.5px] font-semibold mb-4">Equipo</h4>
            <ul class="space-y-2.5 text-[14px] muted">${team}</ul>
          </div>
        </div>
        <div class="shell pb-10 flex flex-col sm:flex-row gap-3 justify-between text-[12.5px] text-[var(--text-4)]">
          <span>Proyecto académico sin fines de lucro. Huffman implementado por el equipo, sin librerías de compresión.</span>
          <span>Los libros provienen de Project Gutenberg.</span>
        </div>
      </footer>`;
  }

  /* ------------------------------------------------------------------------
     Control segmentado (pestañas con indicador deslizante)
     ------------------------------------------------------------------------ */
  function segmented(root, onChange) {
    const buttons = $$('button[role="tab"]', root);
    let ind = $('.indicator', root);
    if (!ind) {
      ind = document.createElement('span');
      ind.className = 'indicator';
      root.prepend(ind);
    }
    const move = () => {
      const cur = buttons.find((b) => b.getAttribute('aria-selected') === 'true') || buttons[0];
      if (!cur) return;
      ind.style.left = cur.offsetLeft + 'px';
      ind.style.width = cur.offsetWidth + 'px';
    };
    const select = (btn, silent) => {
      buttons.forEach((b) => {
        const on = b === btn;
        b.setAttribute('aria-selected', String(on));
        b.tabIndex = on ? 0 : -1;
      });
      move();
      if (!silent && onChange) onChange(btn.dataset.value, btn);
    };
    buttons.forEach((b, i) => {
      b.addEventListener('click', () => select(b));
      b.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        const next = buttons[(i + (e.key === 'ArrowRight' ? 1 : buttons.length - 1)) % buttons.length];
        next.focus();
        select(next);
      });
    });
    window.addEventListener('resize', move);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(move);
    requestAnimationFrame(move);
    return { select: (value, silent) => select(buttons.find((b) => b.dataset.value === value) || buttons[0], silent), move };
  }

  /* ------------------------------------------------------------------------
     Efectos: foco de luz, aparición al hacer scroll, rangos con relleno
     ------------------------------------------------------------------------ */
  function effects() {
    document.addEventListener('pointermove', (e) => {
      const el = e.target.closest && e.target.closest('.spot');
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - r.left}px`);
      el.style.setProperty('--my', `${e.clientY - r.top}px`);
    }, { passive: true });

    const reveals = $$('.reveal');
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add('is-in');
            io.unobserve(en.target);
          }
        });
      }, { rootMargin: '0px 0px -10% 0px' });
      reveals.forEach((el) => io.observe(el));
    } else {
      reveals.forEach((el) => el.classList.add('is-in'));
    }

    document.addEventListener('input', (e) => {
      if (e.target.matches('input[type="range"]')) paintRange(e.target);
    });
    $$('input[type="range"]').forEach(paintRange);
  }

  function paintRange(el) {
    const min = +el.min || 0;
    const max = +el.max || 100;
    el.style.setProperty('--p', `${((+el.value - min) / (max - min)) * 100}%`);
  }

  /* ------------------------------------------------------------------------
     Arranque
     ------------------------------------------------------------------------ */
  function ready() {
    // Se espera a que Tailwind genere los estilos para evitar un parpadeo
    const show = () => document.body.classList.add('is-ready');
    const fonts = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    Promise.race([fonts, new Promise((r) => setTimeout(r, 700))]).then(() => requestAnimationFrame(() => requestAnimationFrame(show)));
    setTimeout(show, 1200);
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderNav();
    renderFooter();
    scrollSpy();
    effects();
    ready();
    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-login]')) {
        e.preventDefault();
        openLogin();
      }
      if (e.target.closest('[data-signout]')) auth.signOut();
      const userBtn = e.target.closest('#user-btn');
      const menu = $('#user-menu');
      if (menu) {
        if (userBtn) {
          const open = menu.classList.toggle('is-open');
          userBtn.setAttribute('aria-expanded', String(open));
        } else if (!e.target.closest('#user-menu')) {
          menu.classList.remove('is-open');
        }
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') $('#user-menu')?.classList.remove('is-open');
    });
  });

  window.UI = { icon, GOOGLE_G, LOGO_MARK, $, $$, esc, fmtInt, fmtNum, store, toast, download, copy, auth, history, openLogin, segmented, paintRange };
})();
