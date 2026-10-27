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

/* Gallery: decoded, race-safe swaps and a native keyboard-modal lifecycle. */
const galleryViews = [...document.querySelectorAll('[data-flowy-view]')];
const galleryImage = document.querySelector('#flowy-screenshot');
const galleryTitle = document.querySelector('#flowy-view-title');
const galleryDescription = document.querySelector('#flowy-view-description');
const galleryCounter = document.querySelector('.gallery-counter');
const galleryStatus = document.querySelector('[data-gallery-status]');
const galleryDialog = document.querySelector('#flowy-preview');
const galleryOpen = document.querySelector('.gallery-open');
const dialogImage = document.querySelector('[data-dialog-image]');
const dialogDescription = document.querySelector('#flowy-dialog-description');
const dialogCounter = document.querySelector('[data-dialog-counter]');
let galleryIndex = 0;
let galleryDesiredIndex = 0;
let galleryRequest = 0;
let galleryAnimation;
let dialogAnimation;
let dialogCloseRequest = 0;
let dialogClosing = false;

function galleryPosition(index = galleryIndex) {
  return String(index + 1).padStart(2, '0') + ' / ' + String(galleryViews.length).padStart(2, '0');
}
function syncDialogContents() {
  dialogImage.src = galleryImage.getAttribute('src');
  dialogImage.alt = galleryImage.alt;
  document.querySelector('#flowy-dialog-title').textContent = 'Flowy · ' + galleryTitle.textContent;
  document.querySelector('[data-original-image]').href = galleryImage.getAttribute('src');
  dialogDescription.textContent = galleryDescription.textContent;
  dialogCounter.textContent = galleryPosition();
}
function galleryImageMotion(image, frames, duration) {
  if (motionQuery.matches || typeof image.animate !== 'function') return null;
  const animation = image.animate(frames, { duration, easing: 'cubic-bezier(.16,1,.3,1)' });
  animation.finished.catch(() => {});
  return animation;
}
async function selectGalleryView(index) {
  const request = ++galleryRequest;
  galleryDesiredIndex = (index + galleryViews.length) % galleryViews.length;
  const selectedIndex = galleryDesiredIndex;
  const button = galleryViews[selectedIndex];
  const source = button.querySelector('img').getAttribute('src');
  // Even selecting the current image invalidates a previous pending decode.
  if (source === galleryImage.getAttribute('src')) {
    galleryAnimation?.cancel();
    return;
  }
  const nextImage = new Image();
  nextImage.src = source;
  try {
    if (typeof nextImage.decode === 'function') await nextImage.decode();
    else if (!nextImage.complete) await new Promise((resolve, reject) => {
      nextImage.onload = resolve;
      nextImage.onerror = reject;
    });
    if (!nextImage.naturalWidth) throw new Error('Invalid gallery image');
  } catch {
    if (request === galleryRequest) {
      const message = 'No se pudo cargar la captura. Intentá nuevamente.';
      galleryStatus.textContent = message;
      if (galleryDialog.open) dialogDescription.textContent = message;
      galleryDesiredIndex = galleryIndex;
    }
    return;
  }
  if (request !== galleryRequest) return;
  galleryAnimation?.cancel();
  const visibleImage = galleryDialog.open ? dialogImage : galleryImage;
  galleryAnimation = galleryImageMotion(visibleImage,
    [{ opacity: 1, translate: '0 0' }, { opacity: 0, translate: '0 -7px' }], 120);
  if (galleryAnimation) await galleryAnimation.finished.catch(() => {});
  if (request !== galleryRequest) return;
  galleryIndex = selectedIndex;
  galleryViews.forEach(view => view.setAttribute('aria-pressed', String(view === button)));
  galleryImage.src = source;
  galleryImage.alt = button.dataset.alt;
  galleryTitle.textContent = button.dataset.title;
  galleryDescription.textContent = button.dataset.description;
  galleryCounter.textContent = galleryPosition();
  galleryOpen.setAttribute('aria-label', 'Ampliar captura: ' + button.dataset.title);
  galleryStatus.textContent = 'Captura ' + (selectedIndex + 1) + ' de ' + galleryViews.length + ': ' + button.dataset.title + '.';
  syncDialogContents();
  galleryAnimation = galleryImageMotion(visibleImage,
    [{ opacity: 0, translate: '0 9px' }, { opacity: 1, translate: '0 0' }], 340);
}
galleryViews.forEach((button, index) => button.addEventListener('click', () => selectGalleryView(index)));

function openGalleryDialog() {
  ++dialogCloseRequest;
  dialogClosing = false;
  dialogAnimation?.cancel();
  galleryDialog.classList.remove('is-closing');
  syncDialogContents();
  if (typeof galleryDialog.showModal !== 'function') {
    window.location.assign(galleryImage.getAttribute('src'));
    return;
  }
  if (!galleryDialog.open) galleryDialog.showModal();
  document.body.classList.add('gallery-modal-open');
  configurePointerEffects();
  if (!motionQuery.matches && typeof galleryDialog.animate === 'function') {
    dialogAnimation = galleryDialog.animate(
      [{ opacity: 0, transform: 'translateY(14px) scale(.975)' }, { opacity: 1, transform: 'none' }],
      { duration: 340, easing: 'cubic-bezier(.16,1,.3,1)' }
    );
    dialogAnimation.finished.catch(() => {});
  }
}
async function requestDialogClose() {
  if (!galleryDialog.open || dialogClosing) return;
  dialogClosing = true;
  const request = ++dialogCloseRequest;
  dialogAnimation?.cancel();
  if (!motionQuery.matches && typeof galleryDialog.animate === 'function') {
    galleryDialog.classList.add('is-closing');
    dialogAnimation = galleryDialog.animate(
      [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(8px) scale(.985)' }],
      { duration: 180, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' }
    );
    await dialogAnimation.finished.catch(() => {});
  }
  if (request === dialogCloseRequest && dialogClosing) galleryDialog.close();
}
galleryOpen.addEventListener('click', openGalleryDialog);
document.querySelector('.gallery-close').addEventListener('click', requestDialogClose);
galleryDialog.addEventListener('cancel', event => {
  event.preventDefault();
  requestDialogClose();
});
galleryDialog.addEventListener('click', event => {
  // Keyboard-generated control clicks can have (0, 0); only the backdrop may close.
  if (event.target !== galleryDialog) return;
  const bounds = galleryDialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) requestDialogClose();
});
galleryDialog.addEventListener('keydown', event => {
  if (dialogClosing || event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    selectGalleryView(galleryDesiredIndex + (event.key === 'ArrowRight' ? 1 : -1));
  }
});
document.querySelector('[data-gallery-prev]').addEventListener('click', () => selectGalleryView(galleryDesiredIndex - 1));
document.querySelector('[data-gallery-next]').addEventListener('click', () => selectGalleryView(galleryDesiredIndex + 1));
galleryDialog.addEventListener('close', () => {
  ++dialogCloseRequest;
  dialogClosing = false;
  dialogAnimation?.cancel();
  galleryDialog.classList.remove('is-closing');
  document.body.classList.remove('gallery-modal-open');
  galleryOpen.focus({ preventScroll: true });
  configurePointerEffects();
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
  dialogAnimation?.cancel();
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

/* Fine-mouse enhancements: one scheduled frame per event burst, never an idle loop. */
const cursorElement = document.createElement('span');
cursorElement.className = 'custom-cursor';
cursorElement.setAttribute('aria-hidden', 'true');
cursorElement.hidden = true;
document.body.append(cursorElement);
document.querySelectorAll('[data-tilt]').forEach(card => {
  const clip = document.createElement('span');
  clip.className = 'project-glare-clip';
  clip.setAttribute('aria-hidden', 'true');
  const glare = document.createElement('span');
  glare.className = 'project-glare';
  clip.append(glare);
  card.append(clip);
});
const pointerState = { x: 0, y: 0, target: null, magnet: null, tilt: null, magnetBounds: null, tiltBounds: null };
let pointerController;
let pointerFrame = 0;

function resetPointerFeedback() {
  cancelAnimationFrame(pointerFrame);
  pointerFrame = 0;
  cursorElement.hidden = true;
  cursorElement.style.removeProperty('transform');
  cursorElement.dataset.kind = 'default';
  if (pointerState.magnet) {
    pointerState.magnet.style.removeProperty('--magnet-x');
    pointerState.magnet.style.removeProperty('--magnet-y');
    pointerState.magnet.classList.remove('is-magnetic');
  }
  if (pointerState.tilt) {
    pointerState.tilt.style.removeProperty('--tilt-x');
    pointerState.tilt.style.removeProperty('--tilt-y');
    pointerState.tilt.classList.remove('is-tilting');
    pointerState.tilt.querySelector('.project-glare').style.removeProperty('transform');
  }
  pointerState.target = pointerState.magnet = pointerState.tilt = null;
  pointerState.magnetBounds = pointerState.tiltBounds = null;
}

function renderPointerFeedback() {
  pointerFrame = 0;
  if (!pointerController || !pointerState.target) return;
  const target = pointerState.target;
  const magnet = target.closest('.button, [data-magnetic]');
  const tilt = target.closest('[data-tilt]');
  // Read new bounds before any writes; they remain cached until leave/scroll/resize.
  const magnetBounds = magnet === pointerState.magnet ? pointerState.magnetBounds : magnet?.getBoundingClientRect();
  const tiltBounds = tilt === pointerState.tilt ? pointerState.tiltBounds : tilt?.getBoundingClientRect();
  if (pointerState.magnet && pointerState.magnet !== magnet) {
    pointerState.magnet.style.removeProperty('--magnet-x');
    pointerState.magnet.style.removeProperty('--magnet-y');
    pointerState.magnet.classList.remove('is-magnetic');
  }
  if (pointerState.tilt && pointerState.tilt !== tilt) {
    pointerState.tilt.style.removeProperty('--tilt-x');
    pointerState.tilt.style.removeProperty('--tilt-y');
    pointerState.tilt.classList.remove('is-tilting');
    pointerState.tilt.querySelector('.project-glare').style.removeProperty('transform');
  }
  pointerState.magnet = magnet;
  pointerState.tilt = tilt;
  pointerState.magnetBounds = magnetBounds;
  pointerState.tiltBounds = tiltBounds;
  cursorElement.hidden = false;
  cursorElement.style.transform = 'translate3d(' + pointerState.x + 'px,' + pointerState.y + 'px,0)';
  cursorElement.dataset.kind = target.closest('a[href], button:not(:disabled), summary') ? 'interactive' : tilt ? 'project' : 'default';
  if (magnet && magnetBounds) {
    const x = Math.max(-6, Math.min(6, (pointerState.x - magnetBounds.left - magnetBounds.width / 2) * .09));
    const y = Math.max(-5, Math.min(5, (pointerState.y - magnetBounds.top - magnetBounds.height / 2) * .12));
    magnet.style.setProperty('--magnet-x', x.toFixed(2) + 'px');
    magnet.style.setProperty('--magnet-y', y.toFixed(2) + 'px');
    magnet.classList.add('is-magnetic');
  }
  if (tilt && tiltBounds) {
    const x = Math.max(0, Math.min(tiltBounds.width, pointerState.x - tiltBounds.left));
    const y = Math.max(0, Math.min(tiltBounds.height, pointerState.y - tiltBounds.top));
    const pitch = -(y / tiltBounds.height - .5) * 2.4;
    const yaw = (x / tiltBounds.width - .5) * 3;
    tilt.style.setProperty('--tilt-x', pitch.toFixed(3) + 'deg');
    tilt.style.setProperty('--tilt-y', yaw.toFixed(3) + 'deg');
    tilt.querySelector('.project-glare').style.transform = 'translate3d(' + (x - 210).toFixed(1) + 'px,' + (y - 210).toFixed(1) + 'px,0)';
    tilt.classList.add('is-tilting');
  }
}
function configurePointerEffects() {
  const enabled = finePointerQuery.matches && !motionQuery.matches && !document.hidden && document.hasFocus() && !galleryDialog.open;
  if (!enabled) {
    pointerController?.abort();
    pointerController = undefined;
    root.classList.remove('pointer-effects-ready');
    resetPointerFeedback();
    return;
  }
  if (pointerController) return;
  pointerController = new AbortController();
  const options = { passive: true, signal: pointerController.signal };
  root.classList.add('pointer-effects-ready');
  document.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse') return resetPointerFeedback();
    pointerState.x = event.clientX;
    pointerState.y = event.clientY;
    pointerState.target = event.target;
    if (!pointerFrame) pointerFrame = requestAnimationFrame(renderPointerFeedback);
  }, options);
  document.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'mouse') resetPointerFeedback();
  }, options);
  document.documentElement.addEventListener('pointerleave', resetPointerFeedback, options);
}
finePointerQuery.addEventListener('change', configurePointerEffects);
motionQuery.addEventListener('change', configurePointerEffects);
document.addEventListener('visibilitychange', configurePointerEffects);
window.addEventListener('focus', configurePointerEffects);
window.addEventListener('blur', () => {
  pointerController?.abort();
  pointerController = undefined;
  root.classList.remove('pointer-effects-ready');
  resetPointerFeedback();
});
window.addEventListener('scroll', resetPointerFeedback, { passive: true });
window.addEventListener('resize', resetPointerFeedback, { passive: true });
document.addEventListener('focusin', resetPointerFeedback);
document.addEventListener('keydown', event => { if (event.key === 'Tab') resetPointerFeedback(); });
configurePointerEffects();
