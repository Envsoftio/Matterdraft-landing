/** @param {import("./lifecycle").LandingScope} scope */
export function mountCoreExperience(scope) {

/* MatterDraft Studio — navigation and product interactions. */
(() => {
  'use strict';

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const menuButton = $('#menu-button');
  const mobileNav = $('#mobile-nav');

  const alreadyEnhanced = document.documentElement.classList.contains('js');
  document.documentElement.classList.add('js');
  scope.onCleanup(() => {
    if (!alreadyEnhanced) document.documentElement.classList.remove('js');
  });

  function listenToMedia(query, listener) {
    if (query.addEventListener) scope.on(query, 'change', listener);
    else if (query.addListener) scope.onMedia(query, listener);
  }

  function closeMenu(restoreFocus = false) {
    if (!menuButton || !mobileNav) return;
    mobileNav.hidden = true;
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open navigation');
    if (restoreFocus) menuButton.focus();
  }

  if (menuButton && mobileNav) {
    scope.on(menuButton, 'click', () => {
      const opening = menuButton.getAttribute('aria-expanded') !== 'true';
      mobileNav.hidden = !opening;
      menuButton.setAttribute('aria-expanded', String(opening));
      menuButton.setAttribute('aria-label', opening ? 'Close navigation' : 'Open navigation');
    });
    $$('a', mobileNav).forEach(link => scope.on(link, 'click', () => closeMenu()));
    scope.on(document, 'keydown', event => {
      if (event.key === 'Escape' && !mobileNav.hidden) {
        closeMenu(true);
        event.preventDefault();
      }
    });
    scope.on(document, 'click', event => {
      if (!mobileNav.hidden && !mobileNav.contains(event.target) && !menuButton.contains(event.target)) {
        closeMenu();
      }
    });
    listenToMedia(window.matchMedia('(min-width: 1021px)'), event => {
      if (event.matches) closeMenu();
    });
  }

  // The page switches between explicitly fictional document examples.
  $$('[data-document]').forEach(button => scope.on(button, 'click', () => {
    const scope = button.closest('[data-document-demo]') || button.closest('.product-shell') || document;
    $$('[data-document]', scope).forEach(item => {
      const active = item === button;
      item.setAttribute('aria-pressed', String(active));
      item.classList.toggle('is-active', active);
      item.classList.toggle('active', active);
    });
    const fields = [
      ['[data-doc-title]:not([data-document])', button.dataset.docTitle],
      ['[data-doc-pages]:not([data-document])', button.dataset.docPages],
      ['[data-doc-index]:not([data-document])', button.dataset.docIndex]
    ];
    fields.forEach(([selector, value]) => {
      if (value !== undefined) $$(selector, scope).forEach(node => { node.textContent = value; });
    });
  }));

  // A restrained header state; native scrolling remains unchanged.
  const header = $('.site-header');
  if (header) {
    let scheduled = false;
    const updateHeader = () => {
      header.classList.toggle('is-scrolled', window.scrollY > 12);
      scheduled = false;
    };
    updateHeader();
    scope.on(window, 'scroll', () => {
      if (!scheduled) {
        scheduled = true;
        scope.frame(updateHeader);
      }
    }, {passive: true});
  }

  // Base HTML remains visible without JavaScript or IntersectionObserver.
  // Observe individual product surfaces and workflow items rather than one
  // enclosing section. Base server-rendered markup is never hidden by this code.
  const revealTargets = $$('[data-reveal], .reveal, .pillar, .journey-step, .engine-support > div');
  scope.onCleanup(() => {
    revealTargets.forEach(target => target.classList.remove('reveal-ready', 'is-visible'));
  });
  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    const observer = scope.intersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, {threshold: 0.08, rootMargin: '0px 0px -24px 0px'});
    revealTargets.forEach(target => {
      const bounds = target.getBoundingClientRect();
      if (bounds.top < window.innerHeight && bounds.bottom > 0) {
        target.classList.add('is-visible');
      } else {
        target.classList.add('reveal-ready');
        observer.observe(target);
      }
    });
    listenToMedia(reducedMotion, event => {
      if (!event.matches) return;
      revealTargets.forEach(target => target.classList.add('is-visible'));
      observer.disconnect();
    });
  } else {
    revealTargets.forEach(target => target.classList.add('is-visible'));
  }
})();


}
