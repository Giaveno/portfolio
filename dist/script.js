/* Theme: system preference until an explicit, storage-safe selection. */
const themeButton = document.querySelector('.theme-toggle');
const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const systemThemeQuery = window.matchMedia('(prefers-color-scheme: light)');
let hasThemePreference = false;
try {
  const preference = localStorage.getItem('portfolio-theme');
  hasThemePreference = preference === 'dark' || preference === 'light';
} catch {}
let requestedTheme = document.documentElement.dataset.theme;
let themeTransition;
let themeAnimationTimer;
let themeButtonAnimation;

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const isDark = theme === 'dark';
  const label = isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';
  themeButton.setAttribute('aria-label', label);
  themeButton.setAttribute('title', label);
  themeButton.setAttribute('aria-pressed', String(isDark));
  document.querySelector('meta[name="theme-color"]').content = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
}
applyTheme(requestedTheme);
themeButton.addEventListener('click', () => {
  const theme = requestedTheme === 'dark' ? 'light' : 'dark';
  requestedTheme = theme;
  hasThemePreference = true;
  try { localStorage.setItem('portfolio-theme', theme); } catch {}
  themeTransition?.skipTransition();
  if (!motionQuery.matches && typeof document.startViewTransition === 'function') {
    const transition = document.startViewTransition(() => {
      if (requestedTheme === theme) applyTheme(theme);
    });
    themeTransition = transition;
    transition.ready.catch(() => {});
    transition.finished.catch(() => {}).finally(() => {
      if (themeTransition === transition) themeTransition = undefined;
    });
  } else {
    // Animation is optional; changing the theme never depends on its completion.
    if (!motionQuery.matches) {
      document.documentElement.classList.add('theme-changing');
      clearTimeout(themeAnimationTimer);
      themeAnimationTimer = setTimeout(() => document.documentElement.classList.remove('theme-changing'), 400);
    }
    applyTheme(theme);
  }
  if (!motionQuery.matches && typeof themeButton.animate === 'function') {
    themeButtonAnimation?.cancel();
    themeButtonAnimation = themeButton.animate([{ rotate: '0deg' }, { rotate: '180deg' }], { duration: 400, easing: 'cubic-bezier(.2,.8,.2,1)' });
  }
});
systemThemeQuery.addEventListener('change', event => {
  if (!hasThemePreference) {
    requestedTheme = event.matches ? 'light' : 'dark';
    applyTheme(requestedTheme);
  }
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

/* Motion: progressive enhancement, finite work, and a single lifecycle. */
const root = document.documentElement;
const easing = 'cubic-bezier(.16,1,.3,1)';
const motionAnimations = new Set();
const counterFrames = new Map();
const revealElements = [...document.querySelectorAll('.section-heading, .project-card, .about-intro > div, .thinking-grid > div, .education, .skill-row, .contact-top, .contact h2, .contact-bottom')];
const counterTargets = [...document.querySelectorAll('[data-count]')];
const countersStarted = new WeakSet();
const systemArt = document.querySelector('.system-art');
const hero = document.querySelector('.hero');
const progressBar = document.querySelector('.reading-progress > span');
const marquee = document.querySelector('[data-marquee]');
const marqueeToggle = document.querySelector('[data-marquee-toggle]');
const finePointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
const navTargets = [...navigation.querySelectorAll('a[href^="#"]')].map(link => ({ link, target: document.getElementById(link.hash.slice(1)), top: 0 })).filter(item => item.target);
let revealObserver;
let ambientObserver;
let artVisible = true;
let marqueeVisible = false;
let continuousPaused = false;
let progressFrame = 0;
let measurePending = true;
let scrollRange = 0;
let activeSection;
let headerHeight = 88;

function animateElement(element, keyframes, options = {}) {
  if (typeof element.animate !== 'function') return;
  const frames = motionQuery.matches ? [{ opacity: 0 }, { opacity: 1 }] : keyframes;
  const animation = element.animate(frames, {
    duration: motionQuery.matches ? 120 : 800,
    easing,
    ...options,
    ...(motionQuery.matches ? { duration: 120, delay: 0 } : {})
  });
  motionAnimations.add(animation);
  animation.finished.then(() => motionAnimations.delete(animation), () => motionAnimations.delete(animation));
  return animation;
}

function prepareSplitText() {
  if (motionQuery.matches) return;
  document.querySelectorAll('[data-split], .hero-statement').forEach(element => {
    if (element.dataset.splitReady) return;
    // Build off-DOM first: an error cannot leave a partially hidden heading.
    const visual = document.createElement('span');
    visual.className = 'split-visual';
    visual.setAttribute('aria-hidden', 'true');
    visual.innerHTML = element.innerHTML;
    const walker = document.createTreeWalker(visual, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      const fragment = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach(word => {
        if (!word.trim()) fragment.append(document.createTextNode(word));
        else {
          const span = document.createElement('span');
          span.className = 'split-word';
          span.textContent = word;
          fragment.append(span);
        }
      });
      node.replaceWith(fragment);
    });
    const accessible = document.createElement('span');
    accessible.className = 'sr-only';
    accessible.textContent = [...element.childNodes].map(node => node.textContent).join(' ').replace(/\s+/g, ' ').trim();
    element.replaceChildren(accessible, visual);
    element.dataset.splitReady = 'true';
  });
}

function startHeroEntrance() {
  if (motionQuery.matches || scrollY > 100) return;
  prepareSplitText();
  document.querySelectorAll('.hero-copy .split-word').forEach((word, index) => {
    animateElement(word, [{ opacity: 0, transform: 'translateY(105%) rotate(3deg)' }, { opacity: 1, transform: 'none' }], {
      duration: 850, delay: Math.min(80 + index * 45, 500), fill: 'backwards'
    });
  });
  document.querySelectorAll('.hero-topline, .hero-copy .intro, .hero-description, .hero-actions, .system-art, .hero-bottom').forEach((element, index) => {
    animateElement(element, [{ opacity: 0, transform: 'translateY(18px)' }, { opacity: 1, transform: 'none' }], {
      duration: 850, delay: Math.min(index * 70, 350), fill: 'backwards'
    });
  });
}

function prepareCounters() {
  counterTargets.forEach(target => {
    if (target.closest('.stack-count')) target.dataset.count = String(document.querySelectorAll('.technology-item').length);
    const value = document.createElement('span');
    value.className = 'counter-value';
    value.setAttribute('aria-hidden', 'true');
    value.textContent = target.dataset.count;
    const accessible = document.createElement('span');
    accessible.className = 'sr-only';
    accessible.textContent = target.dataset.count;
    target.replaceChildren(accessible, value);
  });
}

function finishCounter(target) {
  cancelAnimationFrame(counterFrames.get(target));
  counterFrames.delete(target);
  target.querySelector('.counter-value').textContent = target.dataset.count;
}

function animateCounter(target) {
  if (countersStarted.has(target)) return;
  countersStarted.add(target);
  if (motionQuery.matches || document.hidden) return finishCounter(target);
  const finalValue = Number(target.dataset.count);
  const value = target.querySelector('.counter-value');
  const start = performance.now();
  function step(now) {
    const progress = Math.min(1, (now - start) / 850);
    value.textContent = String(Math.round(finalValue * (1 - Math.pow(1 - progress, 3))));
    if (progress < 1) counterFrames.set(target, requestAnimationFrame(step));
    else finishCounter(target);
  }
  counterFrames.set(target, requestAnimationFrame(step));
}

function revealElement(element) {
  revealObserver?.unobserve(element);
  if (element.hasAttribute('data-count')) return animateCounter(element);
  const pending = element.classList.contains('reveal-pending');
  element.classList.remove('reveal-pending');
  if (!pending) return;
  let from = { opacity: 0, transform: 'translateY(28px)' };
  if (element.matches('.education, .about-intro > div:last-child')) from = { opacity: 0, transform: 'translateX(24px)' };
  if (element.matches('.project-card')) from = { opacity: 0, transform: 'translateY(30px) scale(.985)' };
  animateElement(element, [from, { opacity: 1, transform: 'none' }], {
    delay: Number(element.dataset.motionDelay || 0), fill: 'backwards'
  });
  if (element.matches('.skill-row')) {
    element.querySelectorAll('.technology-item').forEach((chip, index) => {
      animateElement(chip, [{ opacity: 0, translate: '0 10px' }, { opacity: 1, translate: '0 0' }], {
        duration: 500, delay: index * 55, fill: 'backwards'
      });
    });
  }
}

function initializeReveals() {
  revealObserver?.disconnect();
  revealElements.forEach(element => element.classList.remove('reveal-pending'));
  if (!('IntersectionObserver' in window)) {
    counterTargets.forEach(animateCounter);
    return;
  }
  revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting) revealElement(entry.target); });
  }, { threshold: 0, rootMargin: '0px 0px -24px 0px' });
  revealElements.forEach(element => {
    const bounds = element.getBoundingClientRect();
    if (bounds.top < innerHeight - 24) return;
    if (element.matches('.thinking-grid > div')) element.dataset.motionDelay = String([...element.parentElement.children].indexOf(element) * 85);
    if (!motionQuery.matches) element.classList.add('reveal-pending');
    revealObserver.observe(element);
  });
  counterTargets.forEach(target => {
    if (!countersStarted.has(target)) revealObserver.observe(target);
  });
}

function updateContinuousMotion() {
  const enabled = !motionQuery.matches;
  const running = enabled && !continuousPaused && !document.hidden;
  root.classList.toggle('motion-ready', enabled);
  root.classList.toggle('motion-paused', continuousPaused);
  systemArt.classList.toggle('signals-running', running && artVisible);
  hero.classList.toggle('hero-motion-running', running && artVisible);
  marquee.classList.toggle('marquee-active', running && marqueeVisible);
  marqueeToggle.hidden = !enabled;
  marqueeToggle.setAttribute('aria-pressed', String(continuousPaused));
  marqueeToggle.setAttribute('aria-label', continuousPaused ? 'Reanudar animaciones continuas' : 'Pausar animaciones continuas');
  marqueeToggle.querySelector('span').textContent = continuousPaused ? '▶' : 'Ⅱ';
}
marqueeToggle.addEventListener('click', () => {
  continuousPaused = !continuousPaused;
  updateContinuousMotion();
});
marquee.addEventListener('focusin', () => marquee.classList.remove('marquee-active'));
marquee.addEventListener('focusout', updateContinuousMotion);

function initializeAmbientObserver() {
  if ('IntersectionObserver' in window) {
    ambientObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.target === systemArt) artVisible = entry.isIntersecting;
        if (entry.target === marquee) marqueeVisible = entry.isIntersecting;
      });
      updateContinuousMotion();
      updateReadingProgress();
    });
    ambientObserver.observe(systemArt);
    ambientObserver.observe(marquee);
  } else {
    marqueeVisible = true;
  }
  updateContinuousMotion();
}

function layoutTop(element) {
  let top = 0;
  for (let node = element; node; node = node.offsetParent) {
    top += node.offsetTop + (node.offsetParent?.clientTop || 0);
  }
  return top;
}

function updateReadingProgress() {
  if (progressFrame) return;
  progressFrame = requestAnimationFrame(() => {
    // Finish all geometry reads before applying visual writes.
    if (measurePending) {
      headerHeight = document.querySelector('.header').getBoundingClientRect().height;
      // Layout offsets exclude temporary reveal transforms from the cached anchors.
      navTargets.forEach(item => { item.top = layoutTop(item.target); });
      scrollRange = Math.max(0, root.scrollHeight - innerHeight);
      measurePending = false;
    }
    const progress = scrollRange > 0 ? Math.min(1, Math.max(0, scrollY / scrollRange)) : 0;
    let active = null;
    navTargets.forEach(item => {
      if (item.top <= scrollY + headerHeight + innerHeight * .2) active = item.link;
    });
    if (scrollRange > 0 && scrollY >= scrollRange - 4) active = navTargets.at(-1)?.link;
    const bounds = artVisible && !motionQuery.matches && !document.hidden ? systemArt.getBoundingClientRect() : null;
    const shift = bounds ? Math.max(-18, Math.min(18, (innerHeight / 2 - bounds.top - bounds.height / 2) * .045)) : 0;
    progressBar.style.transform = 'scaleX(' + progress + ')';
    systemArt.style.setProperty('--scroll-shift', shift.toFixed(2) + 'px');
    if (active !== activeSection) {
      navTargets.forEach(item => {
        if (item.link === active) item.link.setAttribute('aria-current', 'location');
        else item.link.removeAttribute('aria-current');
      });
      activeSection = active;
    }
    progressFrame = 0;
  });
}
function refreshGeometry() {
  measurePending = true;
  updateReadingProgress();
}
document.addEventListener('focusin', event => {
  const pending = event.target.closest('.reveal-pending');
  if (pending) {
    pending.classList.remove('reveal-pending');
    revealObserver?.unobserve(pending);
  }
});
document.addEventListener('visibilitychange', () => {
  updateContinuousMotion();
  motionAnimations.forEach(animation => document.hidden ? animation.pause() : animation.play());
  if (document.hidden) counterTargets.forEach(finishCounter);
  else refreshGeometry();
});
motionQuery.addEventListener('change', () => {
  motionAnimations.forEach(animation => animation.cancel());
  counterTargets.forEach(finishCounter);
  galleryAnimation?.cancel();
  themeButtonAnimation?.cancel();
  themeTransition?.skipTransition();
  root.classList.remove('theme-changing');
  systemArt.style.setProperty('--scroll-shift', '0px');
  document.querySelector('.site-intro')?.remove();
  initializeReveals();
  updateContinuousMotion();
  refreshGeometry();
});
window.addEventListener('scroll', updateReadingProgress, { passive: true });
window.addEventListener('resize', refreshGeometry, { passive: true });
window.addEventListener('load', refreshGeometry, { once: true });
window.addEventListener('pageshow', refreshGeometry);
window.addEventListener('pagehide', () => { cancelAnimationFrame(progressFrame); progressFrame = 0; });
document.querySelector('.project-deep-dive').addEventListener('toggle', refreshGeometry);
document.fonts?.ready.then(refreshGeometry);
if ('ResizeObserver' in window) new ResizeObserver(refreshGeometry).observe(document.body);
prepareCounters();
startHeroEntrance();
initializeReveals();
initializeAmbientObserver();
refreshGeometry();
setTimeout(() => document.querySelector('.site-intro')?.remove(), 1150);

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
