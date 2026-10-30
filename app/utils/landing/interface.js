/**
 * @param {import("./lifecycle").LandingScope} scope
 */
export function mountInterfaceTools(scope) {
/* Website-only product illustrations. These controls do not process user files. */
(() => {
  'use strict';
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function wireTabs(tabs, activate) {
    tabs.forEach((tab, index) => {
      scope.on(tab, 'click', () => activate(index));
      scope.on(tab, 'keydown', event => {
        let next;
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % tabs.length;
        else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + tabs.length) % tabs.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = tabs.length - 1;
        else return;
        event.preventDefault();
        activate(next);
        tabs[next].focus({preventScroll: true});
      });
    });
  }

  const matterTabs = $$('[data-matter-tab]');
  function showMatterTab(index) {
    matterTabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
    });
    $$('[data-matter-panel]').forEach(panel => { panel.hidden = Number(panel.dataset.matterPanel) !== index; });
  }
  wireTabs(matterTabs, showMatterTab);

  const paper = $('#pdf-paper');
  const pdfStatus = $('#pdf-tool-status');
  let rotation = 0;
  if (paper) {
    scope.on($('#pdf-rotate'), 'click', event => {
      rotation = (rotation + 90) % 360;
      paper.style.transform = 'rotate(' + rotation + 'deg) scale(' + (rotation % 180 ? '.73' : '1') + ')';
      event.currentTarget.setAttribute('aria-pressed', String(rotation !== 0));
      pdfStatus.textContent = 'Illustrative page rotated ' + rotation + '°. The original is unchanged in this example.';
    });
    const toggles = [
      ['pdf-crop', 'crop-active', 'Crop boundary shown. Adjust page bounds in the desktop workflow.', 'Crop boundary hidden.'],
      ['pdf-highlight', 'highlight-active', 'Highlight added to the example text.', 'Highlight removed from the example.'],
      ['pdf-redact', 'redacted', 'Redaction appearance shown. This illustration does not remove underlying file content.', 'Redaction appearance cleared.']
    ];
    toggles.forEach(([id, cls, on, off]) => scope.on($('#'+id), 'click', event => {
      const active = paper.classList.toggle(cls);
      event.currentTarget.setAttribute('aria-pressed', String(active));
      pdfStatus.textContent = active ? on : off;
    }));
    scope.on($('#pdf-comment'), 'click', event => {
      const marker = $('#pdf-comment-marker');
      marker.hidden = !marker.hidden;
      event.currentTarget.setAttribute('aria-pressed', String(!marker.hidden));
      pdfStatus.textContent = marker.hidden ? 'Comment hidden.' : 'Review comment added to the example page.';
    });
    scope.on($('#pdf-reset'), 'click', () => {
      rotation = 0;
      paper.style.transform = '';
      paper.classList.remove('crop-active', 'highlight-active', 'redacted');
      $('#pdf-comment-marker').hidden = true;
      $$('.engine-tool[aria-pressed]').forEach(button => button.setAttribute('aria-pressed', 'false'));
      pdfStatus.textContent = 'Example reset. Choose a tool to explore this fictional page.';
    });
  }

  const ocrRun = $('#ocr-run');
  const ocrDemo = $('#ocr-demo');
  const ocrText = $('#ocr-editable');
  let ocrRunning = false;
  let ocrFinished = false;
  scope.on(ocrRun, 'click', () => {
    if (ocrRunning) return;
    if (ocrFinished) {
      ocrFinished = false;
      ocrDemo.classList.remove('ocr-processed');
      ocrText.contentEditable = 'false';
      ocrText.textContent = 'Aster Works v. Banyan Projects\nDocument reference: MD-DEMO-026\nOriginal record for preparation.';
      $('#ocr-step-status').textContent = 'Ready for the OCR example';
      $('#ocr-live-status').textContent = 'OCR example reset.';
      $('[data-toggle-label]', ocrRun).textContent = 'Run OCR example';
      return;
    }
    ocrRunning = true;
    ocrRun.disabled = true;
    ocrDemo.setAttribute('aria-busy', 'true');
    ocrDemo.classList.add('ocr-processing');
    $('#ocr-step-status').textContent = 'Processing example…';
    $('#ocr-live-status').textContent = 'Processing the fictional scan example.';
    scope.timeout(() => {
      $('#ocr-step-status').textContent = 'Text detected · Reviewing layer';
      ocrDemo.classList.add('ocr-processed');
      scope.timeout(() => {
        ocrRunning = false;
        ocrFinished = true;
        ocrRun.disabled = false;
        ocrDemo.setAttribute('aria-busy', 'false');
        ocrDemo.classList.remove('ocr-processing');
        ocrText.contentEditable = 'true';
        $('#ocr-step-status').textContent = 'Complete · Searchable · Editable';
        $('#ocr-live-status').textContent = 'Example complete. The recognised text can now be edited.';
        $('[data-toggle-label]', ocrRun).textContent = 'Reset OCR example';
        if (document.activeElement === ocrRun) ocrText.focus({preventScroll: true});
      }, reducedMotion.matches ? 0 : 450);
    }, reducedMotion.matches ? 0 : 450);
  });

  const advancedCopy = [
    ['Password protection', 'Apply document password protection as part of preparing the final output.'],
    ['Redaction', 'Remove sensitive material from a working document, then review the resulting file before distribution.'],
    ['Electronic signatures', 'Place an electronic signature within the document preparation workflow. Check the requirements of the intended recipient.'],
    ['Watermarks', 'Add a visible label to identify a draft, working copy or document set.'],
    ['Timestamps', 'Add a date or time mark to support the document production and review process.'],
    ['Pagination', 'Coordinate the numbered page ranges with the current document sequence and bundle structure.'],
    ['Scan & OCR', 'Recognise text from scanned pages, review it and prepare a searchable, editable working copy.'],
    ['Annotations', 'Add comments, highlights, links and review marks to the working document.']
  ];
  const advancedTabs = $$('[data-advanced-tool]');
  wireTabs(advancedTabs, index => {
    advancedTabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
    });
    $('#advanced-details').setAttribute('aria-labelledby', advancedTabs[index].id);
    $('#advanced-title').textContent = advancedCopy[index][0];
    $('#advanced-description').textContent = advancedCopy[index][1];
    const icon = $('svg', advancedTabs[index]);
    if (icon) $('#advanced-icon').replaceChildren(icon.cloneNode(true));
  });

  const paginationButton = $('#pagination-amend');
  const collationButton = $('#collation-extra-pages');
  const syncPaginationButton = () => {
    if (!paginationButton || !collationButton) return;
    const changed = collationButton.getAttribute('aria-pressed') === 'true';
    paginationButton.setAttribute('aria-pressed', String(changed));
    $('[data-toggle-label]', paginationButton).textContent = changed ? 'Remove the two added pages' : 'Add 2 pages to Affidavit';
  };
  scope.on(paginationButton, 'click', () => { collationButton?.click(); syncPaginationButton(); });
  scope.on(collationButton, 'click', syncPaginationButton);
  scope.on($('#collation-reset'), 'click', syncPaginationButton);

  const heroMetadata = [
    ['Core documents', '1a · Petition', 'Part 1', 18],
    ['Core documents', '1b · Affidavit', 'Part 1', 24],
    ['Supporting documents', '2a · Agreement', 'Part 2', 39],
    ['Supporting documents', '2b · Correspondence', 'Part 2', 27],
    ['Evidence', '3a · Evidence', 'Part 3', 52],
    ['Additional material', '4a · Additional records', 'Part 4', 36]
  ];
  $$('#hero-workspace [data-document]').forEach((button, index) => scope.on(button, 'click', () => {
    const metadata = heroMetadata[index];
    $('[data-hero-category]').textContent = metadata[0];
    $('[data-hero-bookmark]').textContent = metadata[1];
    $('[data-hero-part]').textContent = metadata[2];
    $('[data-hero-page-count]').textContent = 'Page 1 of ' + metadata[3];
  }));

})();

}
