/**
 * @param {import("./lifecycle").LandingScope} scope
 */
export function mountHeroExperience(scope) {

/* MatterDraft premium hero. Illustrative UI only; no document processing.
   Scoped independently so the existing page and document handlers stay intact. */
(() => {
  'use strict';

  const DOCUMENTS = [
    {title: 'Petition', start: 1, bookmark: '1a · Petition'},
    {title: 'Affidavit', start: 19, bookmark: '1b · Affidavit'},
    {title: 'Agreement', start: 43, bookmark: '2a · Agreement'},
    {title: 'Correspondence', start: 82, bookmark: '2b · Correspondence'},
    {title: 'Evidence', start: 109, bookmark: '3a · Evidence'},
    {title: 'Additional records', start: 161, bookmark: '4a · Additional records'}
  ];

  function initializeHero(root) {
    if (root.dataset.mdhInitialized === 'true') return;
    root.dataset.mdhInitialized = 'true';
    scope.onCleanup(() => { delete root.dataset.mdhInitialized; });
    const all = selector => Array.from(root.querySelectorAll(selector));
    const write = (selector, value) => all(selector).forEach(node => { node.textContent = value; });
    const documentButtons = all('#hero-workspace [data-document]');

    function syncSelectedDocument(button) {
      if (!button) return;
      const title = (button.dataset.docTitle || '').trim();
      const normalized = title.replace(/\.pdf$/i, '').toLowerCase();
      const known = DOCUMENTS.find(item => item.title.toLowerCase() === normalized)
        || DOCUMENTS[documentButtons.indexOf(button)];
      if (!known) return;
      const firstPage = Number.parseInt(button.dataset.docPages || '', 10) || known.start;
      write('[data-mdh-selected-title]', title || known.title);
      write('[data-mdh-selected-page]', String(firstPage));
      write('[data-mdh-selected-bookmark]', known.bookmark);
      root.dataset.mdhDocument = known.title.toLowerCase().replace(/\s+/g, '-');
    }

    documentButtons.forEach(button => scope.on(button, 'click', () => {
      syncSelectedDocument(button);
    }));

    syncSelectedDocument(documentButtons.find(button => button.getAttribute('aria-pressed') === 'true')
      || documentButtons.find(button => button.classList.contains('active')) || documentButtons[0]);
  }

  function initialize() {
    document.querySelectorAll('[data-mdh-root]').forEach(initializeHero);
  }
  if (document.readyState === 'loading') scope.on(document, 'DOMContentLoaded', initialize, {once: true});
  else initialize();
})();


}
