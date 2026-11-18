(() => {
  const app = document.querySelector('.archive-app');
  if (!app) return;
  const files = [...app.querySelectorAll('.archive-document')];
  const tabs = [...app.querySelectorAll('[data-file]')];
  const overview = app.querySelector('.archive-overview');
  const reader = app.querySelector('.archive-reader');
  const access = app.querySelector('.archive-access');
  const theme = app.querySelector('.archive-theme');
  let selected = 0;
  let reading = false;
  let scene;
  const boot = document.querySelector('.archive-boot');
  let introClosed = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let introTimer;

  function finishIntro(focus = false) {
    if (introClosed) return;
    introClosed = true;
    clearTimeout(introTimer);
    boot.classList.add('is-leaving');
    app.inert = false;
    app.classList.add('is-arriving');
    scene?.enter();
    setTimeout(() => { boot.hidden = true; }, 550);
    setTimeout(() => app.classList.remove('is-arriving'), 1300);
    if (focus) access.focus({ preventScroll: true });
  }

  if (!introClosed) {
    boot.hidden = false;
    app.inert = true;
    boot.querySelector('.boot-enter').focus({ preventScroll: true });
    introTimer = setTimeout(() => finishIntro(), 2800);
    boot.querySelectorAll('button').forEach(button => button.addEventListener('click', () => finishIntro(true)));
  }

  function render() {
    const file = files[selected];
    app.dataset.view = reading ? 'reader' : 'overview';
    overview.hidden = reading;
    reader.hidden = !reading;
    files.forEach((item, index) => { item.hidden = !reading || index !== selected; });
    tabs.forEach((tab, index) => {
      if (index === selected) tab.setAttribute('aria-current', 'true');
      else tab.removeAttribute('aria-current');
    });
    for (const [id, key] of [['preview-code', 'code'], ['archive-preview-title', 'title'], ['preview-type', 'type'], ['preview-count', 'count'], ['preview-note', 'note']]) {
      document.getElementById(id).textContent = file.dataset[key];
    }
    document.getElementById('archive-position').textContent = String(selected + 1).padStart(2, '0');
    access.setAttribute('aria-label', `Open ${file.dataset.title} file`);
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const content = reading ? file : app.querySelector('.archive-preview');
      content.getAnimations().forEach(animation => animation.cancel());
      content.animate([
        { opacity: 0, transform: 'translateY(12px)', filter: 'blur(3px)' },
        { opacity: 1, transform: 'translateY(0)', filter: 'blur(0)' }
      ], { duration: 550, easing: 'cubic-bezier(.2,.7,.2,1)' });
    }
    scene?.select(selected, reading);
  }

  function select(index) {
    selected = (index + files.length) % files.length;
    app.querySelector('.archive-reader-scroll').scrollTop = 0;
    render();
    if (reading) history.replaceState(null, '', `#${files[selected].id}`);
  }

  function open() {
    reading = true;
    render();
    history.pushState(null, '', `#${files[selected].id}`);
    files[selected].querySelector('h2').focus({ preventScroll: true });
  }

  function close() {
    reading = false;
    render();
    history.pushState(null, '', location.pathname + location.search);
    access.focus({ preventScroll: true });
  }

  function syncHash() {
    const index = files.findIndex(file => `#${file.id}` === location.hash);
    reading = index >= 0;
    if (reading) selected = index;
    render();
  }

  tabs.forEach((tab, index) => tab.addEventListener('click', event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (selected === index && !reading) open();
    else select(index);
  }));
  app.querySelectorAll('[data-step]').forEach(button => button.addEventListener('click', () => select(selected + Number(button.dataset.step))));
  access.addEventListener('click', open);
  app.querySelector('.archive-back').addEventListener('click', close);
  app.querySelectorAll('.archive-tools a[href="#profile"], .archive-tools a[href="#research"]').forEach(link => link.addEventListener('click', event => {
    event.preventDefault();
    app.querySelector(`${link.getAttribute('href')} h2`).focus();
  }));
  window.addEventListener('hashchange', syncHash);
  window.addEventListener('keydown', event => {
    if (!introClosed) {
      if (event.key === 'Escape' || event.key === 'Enter') { event.preventDefault(); finishIntro(true); }
      if (event.key === 'Tab') {
        event.preventDefault();
        const enter = boot.querySelector('.boot-enter');
        const skip = boot.querySelector('.boot-skip');
        (document.activeElement === enter ? skip : enter).focus();
      }
      return;
    }
    if (event.altKey || event.ctrlKey || event.metaKey || event.target.matches('input, textarea, select, [contenteditable]')) return;
    if (event.key === 'Escape' && reading) { event.preventDefault(); close(); }
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault(); select(selected + (event.key === 'ArrowRight' ? 1 : -1));
    }
    if (event.key === 'Enter' && !reading && !event.target.closest('a, button, summary')) { event.preventDefault(); open(); }
  });

  function applyTheme(dark) {
    document.documentElement.toggleAttribute('data-theme', dark);
    if (dark) document.documentElement.setAttribute('data-theme', 'dark');
    theme.setAttribute('aria-label', `Switch to ${dark ? 'light' : 'dark'} theme`);
    scene?.setTheme(dark);
  }
  let savedTheme;
  try { savedTheme = localStorage.getItem('theme'); } catch (_) { /* Browser storage is optional. */ }
  applyTheme(savedTheme === 'dark');
  theme.addEventListener('click', () => {
    const dark = !document.documentElement.hasAttribute('data-theme');
    applyTheme(dark);
    try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch (_) { /* Browser storage is optional. */ }
  });
  app.classList.add('is-enhanced');
  syncHash();

  const script = document.currentScript;
  import(new URL('archive-scene.js', script.src).href).then(async ({ createArchiveScene }) => {
    scene = await createArchiveScene(app.querySelector('.archive-scene'), files.map(file => file.dataset));
    scene.select(selected, reading);
    boot.querySelector('.boot-status').textContent = 'ARCHIVE READY';
    if (introClosed) scene.enter();
    app.querySelector('.archive-inspect').hidden = false;
    app.querySelectorAll('[data-scene-action]').forEach(button => button.addEventListener('click', () => {
      const action = button.dataset.sceneAction;
      if (action === 'reset') scene.reset();
      else scene.zoom(action === 'zoom-in' ? 1.2 : 1 / 1.2);
    }));
    scene.setTheme(document.documentElement.hasAttribute('data-theme'));
  }).catch(() => {
    // The CSS cassette and all archive content remain available without WebGL.
    app.dataset.scene = 'fallback';
    boot.querySelector('.boot-status').textContent = 'ARCHIVE READY';
  });
})();
