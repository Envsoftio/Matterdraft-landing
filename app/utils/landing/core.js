/** @param {import("./lifecycle").LandingScope} scope */
export function mountCoreExperience(scope) {

/* MatterDraft Studio — navigation and enlarged product views. */
(() => {
  'use strict';

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const menuButton = $('#menu-button');
  const mobileNav = $('#mobile-nav');
  const screenDialog = $('#screen-dialog');
  const dialogFocus = new WeakMap();
  let enlargedViewCount = 0;

  const alreadyEnhanced = document.documentElement.classList.contains('js');
  document.documentElement.classList.add('js');
  scope.onCleanup(() => {
    if (screenDialog?.open) screenDialog.close();
    document.body.classList.remove('modal-open');
    $('#screen-stage')?.replaceChildren();
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

  function openDialog(dialog, restoreTarget = document.activeElement) {
    if (!dialog || dialog.open) return;
    dialogFocus.set(dialog, restoreTarget);
    dialog.showModal();
    document.body.classList.add('modal-open');
  }

  [screenDialog].filter(Boolean).forEach(dialog => {
    // Native modal dialogs provide containment and Escape behavior. Keep an
    // explicit Tab boundary as well for keyboard users across browser versions.
    scope.on(dialog, 'keydown', event => {
      if (event.key !== 'Tab') return;
      const focusable = $$('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])', dialog)
        .filter(node => !node.closest('[hidden]') && node.getClientRects().length > 0);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first) {
        event.preventDefault();
        dialog.focus();
      } else if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    });
    $$('[data-close-dialog]', dialog).forEach(button => {
      scope.on(button, 'click', () => dialog.close());
    });
    let pointerBeganOutside = false;
    const isOutside = event => {
      const bounds = dialog.getBoundingClientRect();
      return event.clientX < bounds.left || event.clientX > bounds.right ||
        event.clientY < bounds.top || event.clientY > bounds.bottom;
    };
    scope.on(dialog, 'pointerdown', event => {
      pointerBeganOutside = event.target === dialog && isOutside(event);
    });
    scope.on(dialog, 'click', event => {
      if (pointerBeganOutside && event.target === dialog && isOutside(event)) dialog.close();
      pointerBeganOutside = false;
    });
    scope.on(dialog, 'close', () => {
      if (!$$('dialog[open]').length) document.body.classList.remove('modal-open');
      const restoreTarget = dialogFocus.get(dialog);
      if (restoreTarget?.isConnected && !restoreTarget.closest('[hidden]')) {
        restoreTarget.focus({preventScroll: true});
      }
      dialogFocus.delete(dialog);
    });
  });

  // Enlarge the same editable product illustration used on the page.
  function staticProductClone(source) {
    const visual = source.matches('.product-shell') ? source
      : $('.product-shell', source) || source.firstElementChild || source;
    const clone = visual.cloneNode(true);
    const prefix = 'enlarged-' + (++enlargedViewCount) + '-';
    const nodes = [clone, ...$$('*', clone)];
    const idMap = new Map();
    nodes.forEach(node => {
      if (!node.id) return;
      const oldId = node.id;
      const newId = prefix + oldId;
      idMap.set(oldId, newId);
      node.id = newId;
    });
    const idRefAttributes = new Set([
      'aria-labelledby', 'aria-describedby', 'aria-controls', 'aria-owns',
      'aria-activedescendant', 'aria-details', 'for', 'form', 'headers'
    ]);
    nodes.forEach(node => {
      Array.from(node.attributes).forEach(attribute => {
        let value = attribute.value;
        if (idRefAttributes.has(attribute.name)) {
          value = value.split(/\s+/).map(id => idMap.get(id) || id).join(' ');
        }
        if ((attribute.name === 'href' || attribute.name === 'xlink:href') && value.startsWith('#')) {
          value = '#' + (idMap.get(value.slice(1)) || value.slice(1));
        }
        value = value.replace(/url\(\s*(['"]?)#([^)'"\s]+)\1\s*\)/g,
          (match, quote, id) => idMap.has(id) ? 'url(#' + idMap.get(id) + ')' : match);
        if (value !== attribute.value) node.setAttribute(attribute.name, value);
        if (attribute.name.startsWith('on')) node.removeAttribute(attribute.name);
      });
    });
    $$('script', clone).forEach(node => node.remove());
    $$('button, input, select, textarea, a, summary, [tabindex], [contenteditable]', clone).forEach(node => {
      node.setAttribute('tabindex', '-1');
      if ('disabled' in node) node.disabled = true;
      if (node.hasAttribute('contenteditable')) node.setAttribute('contenteditable', 'false');
      if (node.tagName === 'A') node.removeAttribute('href');
      node.setAttribute('aria-disabled', 'true');
      node.style.pointerEvents = 'none';
    });
    clone.classList.add('is-enlarged');
    clone.classList.remove('reveal-ready');
    clone.classList.add('is-visible');
    return clone;
  }

  $$('[data-enlarge]').forEach(button => scope.on(button, 'click', () => {
    const source = document.getElementById(button.dataset.enlarge);
    const stage = $('#screen-stage');
    if (!source || !stage || !screenDialog) return;
    const title = $('#screen-title');
    if (title) title.textContent = button.dataset.title || 'Product workspace';
    stage.replaceChildren(staticProductClone(source));
    stage.scrollTop = 0;
    stage.scrollLeft = 0;
    openDialog(screenDialog, button);
  }));

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
