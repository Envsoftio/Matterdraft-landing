/**
 * @param {import("./lifecycle").LandingScope} scope
 */
export function mountHeroExperience(scope) {

/* MatterDraft premium hero. Illustrative UI only; no document processing.
   Scoped independently so the existing page and document handlers stay intact. */
(() => {
  'use strict';

  const STAGES = {
    import: {
      title: 'One matter. Six documents.',
      copy: 'A 196-page example matter brings the petition, affidavit and supporting records into one workspace.'
    },
    ocr: {
      title: 'From scanned pages to editable text.',
      copy: 'OCR is one step in the document workflow. Review recognised text against its source before continuing.'
    },
    organise: {
      title: 'Give the matter its structure.',
      copy: 'Six example documents are organised into four parts, with their metadata and source pages kept together.'
    },
    collate: {
      title: 'A considered document order.',
      copy: 'Core documents, supporting records, evidence and additional material form one coordinated bundle.'
    },
    paginate: {
      title: 'One continuous page range.',
      copy: 'The example runs from page 1 to page 196. Each document has a clear start and end in the bundle.'
    },
    index: {
      title: 'Page references stay connected.',
      copy: 'Six index entries and grouped bookmarks point to the same document structure and numbered pages.'
    },
    validate: {
      title: 'Ready for review.',
      copy: 'Illustrative bundle checks bring outstanding findings into view. The prepared material still needs professional review.'
    },
    export: {
      title: 'Structured output, together.',
      copy: 'Numbered pages, an index and bookmarks come together in the export workflow. This preview does not create a file.'
    }
  };
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
    scope.onCleanup(() => {
      delete root.dataset.mdhInitialized;
      root.dataset.mdhSequence = 'settled';
    });
    const all = selector => Array.from(root.querySelectorAll(selector));
    const write = (selector, value) => all(selector).forEach(node => { node.textContent = value; });
    const stageButtons = all('[data-mdh-stage]').filter(button => STAGES[button.dataset.mdhStage]);
    const documentButtons = all('#hero-workspace [data-document]');
    const replayButtons = all('[data-mdh-replay]');
    const reducedMotion = typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    let timers = [];
    let running = false;

    function activateStage(stage, title, copy) {
      const content = STAGES[stage];
      if (!content) return;
      root.dataset.stage = stage;
      stageButtons.forEach(button => {
        const active = button.dataset.mdhStage === stage;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', String(active));
        if (active) button.setAttribute('aria-current', 'step');
        else button.removeAttribute('aria-current');
      });
      write('[data-mdh-status-title]', title || content.title);
      write('[data-mdh-status-copy]', copy || content.copy);
    }

    function clearSequence() {
      timers.forEach(timer => scope.clearTimeout(timer));
      timers = [];
      running = false;
    }

    function settleSequence(sequenceState = 'settled') {
      clearSequence();
      root.dataset.mdhSequence = sequenceState;
      write('[data-mdh-ocr-state]', 'OCR complete');
      write('[data-mdh-index-state]', 'Index updated');
      write('[data-mdh-bookmark-state]', 'Bookmarks ready');
      write('[data-mdh-validation-state]', 'Ready for review');
      activateStage('validate');
    }

    function interruptSequence() {
      if (running) settleSequence('interrupted');
    }

    function chooseStage(stage) {
      interruptSequence();
      activateStage(stage);
    }

    function schedule(delay, callback) {
      timers.push(scope.timeout(() => {
        if (running && root.isConnected) callback();
      }, delay));
    }

    function playSequence() {
      clearSequence();
      if (reducedMotion?.matches || document.hidden) {
        settleSequence();
        return;
      }
      running = true;
      root.dataset.mdhSequence = 'playing';
      write('[data-mdh-ocr-state]', 'Source ready');
      write('[data-mdh-index-state]', 'Awaiting page references');
      write('[data-mdh-bookmark-state]', 'Document groups ready');
      write('[data-mdh-validation-state]', 'Checks queued');
      activateStage('import');

      schedule(450, () => {
        write('[data-mdh-ocr-state]', 'Processing example');
        activateStage('ocr', 'An editable layer takes shape.', 'Illustrative OCR activity within the matter workspace. No uploaded files are being processed.');
      });
      schedule(1450, () => {
        write('[data-mdh-ocr-state]', 'OCR complete');
        activateStage('organise');
      });
      schedule(2300, () => {
        write('[data-mdh-index-state]', 'Index updated');
        activateStage('index');
      });
      schedule(3100, () => {
        write('[data-mdh-bookmark-state]', 'Bookmarks ready');
        activateStage('index', 'A hierarchy you can navigate.', 'Document groups, bookmarks and page references follow the same 196-page example bundle.');
      });
      schedule(3900, () => settleSequence());
    }

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

    // User control takes precedence over the short automatic introduction.
    scope.on(root, 'pointerdown', interruptSequence, {passive: true});
    scope.on(root, 'keydown', interruptSequence);
    scope.on(root, 'focusin', interruptSequence);
    scope.on(root, 'wheel', interruptSequence, {passive: true});
    stageButtons.forEach(button => {
      const select = () => chooseStage(button.dataset.mdhStage);
      scope.on(button, 'pointerenter', event => {
        if (event.pointerType !== 'touch') select();
      });
      scope.on(button, 'focus', select);
      scope.on(button, 'click', select);
      scope.on(button, 'keydown', event => {
        const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
        if (!keys.includes(event.key)) return;
        event.preventDefault();
        const available = stageButtons.filter(item => !item.disabled);
        const current = available.indexOf(button);
        if (current < 0 || !available.length) return;
        const direction = event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1;
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? available.length - 1
          : (current + direction + available.length) % available.length;
        chooseStage(available[next].dataset.mdhStage);
        available[next].focus();
      });
    });
    documentButtons.forEach(button => scope.on(button, 'click', () => {
      interruptSequence();
      syncSelectedDocument(button);
    }));
    replayButtons.forEach(button => scope.on(button, 'click', playSequence));
    scope.on(document, 'visibilitychange', () => {
      if (document.hidden && running) settleSequence();
    });
    const onMotionPreferenceChange = event => {
      if (event.matches) settleSequence();
    };
    if (reducedMotion?.addEventListener) scope.on(reducedMotion, 'change', onMotionPreferenceChange);
    else if (reducedMotion?.addListener) scope.onMedia(reducedMotion, onMotionPreferenceChange);

    syncSelectedDocument(documentButtons.find(button => button.getAttribute('aria-pressed') === 'true')
      || documentButtons.find(button => button.classList.contains('active')) || documentButtons[0]);
    playSequence();
  }

  function initialize() {
    document.querySelectorAll('[data-mdh-root]').forEach(initializeHero);
  }
  if (document.readyState === 'loading') scope.on(document, 'DOMContentLoaded', initialize, {once: true});
  else initialize();
})();


}
