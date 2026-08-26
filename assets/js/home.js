(() => {
  const home = document.querySelector('.home');
  if (!home) return;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealItems = home.querySelectorAll('[data-reveal]');
  const themeToggle = document.querySelector('#theme-toggle');
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark' || (!savedTheme && matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.querySelector('#theme-icon')?.classList.replace('fa-sun', 'fa-moon');
  }
  themeToggle?.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    const nextTheme = document.documentElement.hasAttribute('data-theme') ? 'light' : 'dark';
    if (nextTheme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('theme', nextTheme);
    document.querySelector('#theme-icon')?.classList.toggle('fa-moon', nextTheme === 'dark');
    document.querySelector('#theme-icon')?.classList.toggle('fa-sun', nextTheme === 'light');
  }, { capture: true });
  if (reducedMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach((item) => item.classList.add('is-visible'));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12 });
  revealItems.forEach((item) => observer.observe(item));
})();
