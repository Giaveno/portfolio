const themeButton = document.querySelector('.theme-toggle');
const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const systemThemeQuery = window.matchMedia('(prefers-color-scheme: light)');
let hasThemePreference = false;
try {
  const preference = localStorage.getItem('portfolio-theme');
  hasThemePreference = preference === 'dark' || preference === 'light';
} catch {}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const isDark = theme === 'dark';
  const label = isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';
  themeButton.setAttribute('aria-label', label);
  themeButton.setAttribute('title', label);
  themeButton.setAttribute('aria-pressed', String(isDark));
  document.querySelector('meta[name="theme-color"]').content = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
}

applyTheme(document.documentElement.dataset.theme);
let themeAnimationTimer;
let themeButtonAnimation;
themeButton.addEventListener('click', () => {
  const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  hasThemePreference = true;
  if (!motionQuery.matches) {
    document.documentElement.classList.add('theme-changing');
    clearTimeout(themeAnimationTimer);
    themeAnimationTimer = setTimeout(() => document.documentElement.classList.remove('theme-changing'), 400);
    if (typeof themeButton.animate === 'function') {
      themeButtonAnimation?.cancel();
      themeButtonAnimation = themeButton.animate([{ rotate: '0deg' }, { rotate: '180deg' }], { duration: 400, easing: 'cubic-bezier(.2,.8,.2,1)' });
    }
  }
  applyTheme(theme);
  try { localStorage.setItem('portfolio-theme', theme); } catch {}
});
systemThemeQuery.addEventListener('change', event => {
  if (!hasThemePreference) applyTheme(event.matches ? 'light' : 'dark');
});

const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');

function closeMenu() {
  navigation.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Abrir navegación');
}

menuButton.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
  navigation.classList.toggle('open', !isOpen);
  menuButton.setAttribute('aria-expanded', String(!isOpen));
  menuButton.setAttribute('aria-label', isOpen ? 'Abrir navegación' : 'Cerrar navegación');
});

document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', () => {
    const target = document.getElementById(link.getAttribute('href').slice(1));
    if (!target) return;
    closeMenu();
    const section = target.closest('section') || target;
    section.querySelectorAll('.reveal-pending').forEach(element => {
      element.classList.remove('reveal-pending');
      revealObserver?.unobserve(element);
    });
    target.classList.remove('reveal-pending');
    target.getAnimations?.().forEach(animation => animation.cancel());
  });
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    menuButton.focus();
  }
});

const copyButton = document.querySelector('[data-copy-email]');
const copyLabel = copyButton.querySelector('[data-copy-label]');
const copyIcon = copyButton.querySelector('use');
const copyStatus = document.querySelector('.copy-status');
let resetTimer;
copyButton.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText('giavenomartin@gmail.com');
    copyLabel.textContent = 'Email copiado';
    copyIcon.setAttribute('href', 'assets/ui-icons.svg#check');
    copyStatus.textContent = 'Email copiado al portapapeles.';
    clearTimeout(resetTimer);
    resetTimer = setTimeout(() => {
      copyLabel.textContent = 'Copiar email';
      copyIcon.setAttribute('href', 'assets/ui-icons.svg#copy');
      copyStatus.textContent = '';
    }, 2500);
  } catch {
    copyLabel.textContent = 'Seleccioná el email para copiarlo';
    copyIcon.setAttribute('href', 'assets/ui-icons.svg#copy');
    copyStatus.textContent = 'No se pudo copiar automáticamente. Podés seleccionar el email o abrirlo para escribir un mensaje.';
  }
});

document.querySelector('[data-year]').textContent = String(new Date().getFullYear());

const galleryViews = [...document.querySelectorAll('[data-flowy-view]')];
const galleryImage = document.querySelector('#flowy-screenshot');
const galleryTitle = document.querySelector('#flowy-view-title');
const galleryDescription = document.querySelector('#flowy-view-description');
const galleryCounter = document.querySelector('.gallery-counter');
const galleryStatus = document.querySelector('[data-gallery-status]');
const galleryDialog = document.querySelector('#flowy-preview');
const galleryOpen = document.querySelector('.gallery-open');
const dialogImage = document.querySelector('[data-dialog-image]');
let galleryRequest = 0;
let galleryAnimation;

galleryViews.forEach((button, index) => {
  button.addEventListener('click', async () => {
    const request = ++galleryRequest;
    const source = button.querySelector('img').getAttribute('src');
    if (source === galleryImage.getAttribute('src')) return;
    const nextImage = new Image();
    nextImage.src = source;
    try {
      await nextImage.decode();
    } catch {
      if (request === galleryRequest) galleryStatus.textContent = 'No se pudo cargar la captura. Intentá nuevamente.';
      return;
    }
    if (request !== galleryRequest) return;
    galleryAnimation?.cancel();
    galleryViews.forEach(view => view.setAttribute('aria-pressed', String(view === button)));
    galleryImage.src = source;
    galleryImage.alt = button.dataset.alt;
    galleryTitle.textContent = button.dataset.title;
    galleryDescription.textContent = button.dataset.description;
    galleryCounter.textContent = `${String(index + 1).padStart(2, '0')} / 05`;
    galleryOpen.setAttribute('aria-label', `Ampliar captura: ${button.dataset.title}`);
    galleryStatus.textContent = `Captura ${index + 1} de 5: ${button.dataset.title}.`;
    if (!motionQuery.matches && typeof galleryImage.animate === 'function') {
      galleryAnimation = galleryImage.animate(
        [{ opacity: .35, translate: '0 12px' }, { opacity: 1, translate: '0 0' }],
        { duration: 420, easing: 'cubic-bezier(.2,.8,.2,1)' }
      );
    }
  });
});

galleryOpen.addEventListener('click', () => {
  dialogImage.src = galleryImage.getAttribute('src');
  dialogImage.alt = galleryImage.alt;
  document.querySelector('#flowy-dialog-title').textContent = `Flowy · ${galleryTitle.textContent}`;
  document.querySelector('[data-original-image]').href = galleryImage.getAttribute('src');
  galleryDialog.showModal();
  document.body.classList.add('gallery-modal-open');
});

document.querySelector('.gallery-close').addEventListener('click', () => galleryDialog.close());
galleryDialog.addEventListener('click', event => {
  const bounds = galleryDialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) {
    galleryDialog.close();
  }
});
galleryDialog.addEventListener('close', () => {
  document.body.classList.remove('gallery-modal-open');
  galleryOpen.focus();
});

const motionAnimations = new Set();
const revealElements = [...document.querySelectorAll('.section-heading, .project-card, .about-intro > div, .thinking-grid > div, .education, .skill-row, .contact-top, .contact h2, .contact-bottom')];
const systemArt = document.querySelector('.system-art');
const progressBar = document.querySelector('.reading-progress > span');
let revealObserver;
let artObserver;
let progressFrame = 0;
let parallaxFrame = 0;
let pointerX = 0;
let pointerY = 0;
let currentX = 0;
let currentY = 0;
const finePointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');

function animateElement(element, keyframes, options) {
  if (motionQuery.matches || typeof element.animate !== 'function') return;
  const animation = element.animate(keyframes, options);
  motionAnimations.add(animation);
  animation.finished.then(() => motionAnimations.delete(animation), () => motionAnimations.delete(animation));
}

function revealElement(element) {
  const wasPending = element.classList.contains('reveal-pending');
  element.classList.remove('reveal-pending');
  revealObserver?.unobserve(element);
  if (wasPending) animateElement(element,
    [{ opacity: 0, translate: '0 24px' }, { opacity: 1, translate: '0 0' }],
    { duration: 750, easing: 'cubic-bezier(.16,1,.3,1)', delay: Number(element.dataset.motionDelay || 0), fill: 'backwards' });
}

function startEntranceMotion() {
  if (motionQuery.matches || typeof Element.prototype.animate !== 'function') return;
  const heroElements = [...document.querySelectorAll('.hero-topline, .hero-copy .intro, .hero-line > *, .hero-description, .hero-actions, .system-art, .hero-bottom')];
  heroElements.forEach((element, index) => animateElement(element,
    [{ opacity: 0, translate: `0 ${element.closest('.hero-line') ? 44 : 18}px` }, { opacity: 1, translate: '0 0' }],
    { duration: 900, delay: Math.min(index * 80, 560), easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' }));

  if ('IntersectionObserver' in window) {
    revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) revealElement(entry.target);
    }), { threshold: 0, rootMargin: '0px 0px -30px 0px' });
    revealElements.forEach(element => {
      if (element.getBoundingClientRect().top < innerHeight - 30) return;
      if (element.matches('.thinking-grid > div')) {
        element.dataset.motionDelay = String([...element.parentElement.children].indexOf(element) * 90);
      }
      revealObserver.observe(element);
      element.classList.add('reveal-pending');
    });
    artObserver = new IntersectionObserver(entries => {
      systemArt.classList.toggle('signals-running', entries[0].isIntersecting && !motionQuery.matches);
    });
    artObserver.observe(systemArt);
  } else {
    systemArt.classList.add('signals-running');
  }
}

function updateReadingProgress() {
  if (progressFrame) return;
  progressFrame = requestAnimationFrame(() => {
    const scrollRange = document.documentElement.scrollHeight - innerHeight;
    const progress = scrollRange > 0 ? Math.min(1, Math.max(0, scrollY / scrollRange)) : 0;
    progressBar.style.transform = `scaleX(${progress})`;
    progressFrame = 0;
  });
}

function updateParallax() {
  currentX += (pointerX - currentX) * .1;
  currentY += (pointerY - currentY) * .1;
  systemArt.style.setProperty('--pointer-x', `${currentX.toFixed(2)}px`);
  systemArt.style.setProperty('--pointer-y', `${currentY.toFixed(2)}px`);
  if (Math.abs(pointerX - currentX) + Math.abs(pointerY - currentY) > .05) {
    parallaxFrame = requestAnimationFrame(updateParallax);
  } else {
    parallaxFrame = 0;
  }
}

systemArt.addEventListener('pointermove', event => {
  if (motionQuery.matches || !finePointerQuery.matches) return;
  const bounds = systemArt.getBoundingClientRect();
  pointerX = ((event.clientX - bounds.left) / bounds.width - .5) * 14;
  pointerY = ((event.clientY - bounds.top) / bounds.height - .5) * 14;
  if (!parallaxFrame) parallaxFrame = requestAnimationFrame(updateParallax);
});
systemArt.addEventListener('pointerleave', () => {
  pointerX = 0;
  pointerY = 0;
  if (!motionQuery.matches && !parallaxFrame) parallaxFrame = requestAnimationFrame(updateParallax);
});
document.addEventListener('focusin', event => {
  const pendingElement = event.target.closest('.reveal-pending');
  if (pendingElement) {
    pendingElement.classList.remove('reveal-pending');
    revealObserver?.unobserve(pendingElement);
  }
});
motionQuery.addEventListener('change', () => {
  motionAnimations.forEach(animation => animation.cancel());
  galleryAnimation?.cancel();
  themeButtonAnimation?.cancel();
  revealObserver?.disconnect();
  artObserver?.disconnect();
  revealElements.forEach(element => element.classList.remove('reveal-pending'));
  systemArt.classList.remove('signals-running');
  cancelAnimationFrame(parallaxFrame);
  parallaxFrame = 0;
  pointerX = pointerY = currentX = currentY = 0;
  systemArt.style.setProperty('--pointer-x', '0px');
  systemArt.style.setProperty('--pointer-y', '0px');
  document.documentElement.classList.remove('theme-changing');
  if (!motionQuery.matches) startEntranceMotion();
});
window.addEventListener('scroll', updateReadingProgress, { passive: true });
window.addEventListener('resize', updateReadingProgress, { passive: true });
window.addEventListener('load', updateReadingProgress, { once: true });
updateReadingProgress();
startEntranceMotion();

const technologyItems = [...document.querySelectorAll('.technology-item')];
function dismissTechnologyLabels() {
  technologyItems.forEach(item => {
    delete item.dataset.tooltipOpen;
    item.dataset.tooltipDismissed = 'true';
  });
}
technologyItems.forEach(item => {
  item.addEventListener('pointerenter', () => delete item.dataset.tooltipDismissed);
  item.addEventListener('focus', () => delete item.dataset.tooltipDismissed);
  item.addEventListener('blur', () => {
    delete item.dataset.tooltipOpen;
    delete item.dataset.tooltipDismissed;
  });
  item.addEventListener('click', () => {
    const isOpen = item.dataset.tooltipOpen === 'true';
    dismissTechnologyLabels();
    if (!isOpen) {
      delete item.dataset.tooltipDismissed;
      item.dataset.tooltipOpen = 'true';
    }
  });
});
document.addEventListener('click', event => {
  if (!event.target.closest('.technology-item')) dismissTechnologyLabels();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') dismissTechnologyLabels();
});
