/**
 * @param {import("./lifecycle").LandingScope} scope
 */
export function mountWorkflowExamples(scope) {
/* MatterDraft — illustrative legal-workflow demonstrations.
   All examples run in this page. They do not open, process, upload or export
   the visitor's documents. Actual demo-request handling lives separately. */
(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const PARTS = [
    {id: 'core', label: 'Core documents', short: 'Part 1'},
    {id: 'supporting', label: 'Supporting documents', short: 'Part 2'},
    {id: 'evidence', label: 'Evidence', short: 'Part 3'},
    {id: 'additional', label: 'Additional material', short: 'Part 4'}
  ];
  const SOURCE_DOCUMENTS = [
    {id: 'petition', name: 'Petition', part: 'core', pages: 18, date: '12 Mar', type: 'PDF'},
    {id: 'affidavit', name: 'Affidavit', part: 'core', pages: 24, date: '13 Mar', type: 'PDF'},
    {id: 'agreement', name: 'Agreement', part: 'supporting', pages: 39, date: '14 Mar', type: 'PDF'},
    {id: 'correspondence', name: 'Correspondence', part: 'supporting', pages: 27, date: '15 Mar', type: 'PDF'},
    {id: 'evidence', name: 'Evidence', part: 'evidence', pages: 52, date: '16 Mar', type: 'PDF'},
    {id: 'additional', name: 'Additional records', part: 'additional', pages: 36, date: '17 Mar', type: 'PDF'}
  ];
  const VOLUME_DOCUMENTS = [
    {id: 'petition', name: 'Petition', pages: 18},
    {id: 'affidavit', name: 'Affidavit', pages: 24},
    {id: 'applications', name: 'Procedural applications', pages: 60},
    {id: 'medical', name: 'Medical records', pages: 194},
    {id: 'correspondence', name: 'Correspondence', pages: 125},
    {id: 'evidence', name: 'Evidence schedule', pages: 170},
    {id: 'financial', name: 'Financial records', pages: 148},
    {id: 'annexures', name: 'Annexures', pages: 125}
  ];
  let bundleTotal = SOURCE_DOCUMENTS.reduce((sum, doc) => sum + doc.pages, 0);
  let onBundleTotalChanged = () => {};

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function icon(name) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('class', 'icon');
    svg.setAttribute('aria-hidden', 'true');
    const paths = {
      up: 'M12 20V4m-6 6 6-6 6 6',
      down: 'M12 4v16m-6-6 6 6 6-6',
      check: 'm5 12 4 4L19 6',
      warning: 'm12 3 10 18H2L12 3ZM12 9v5M12 17v1',
      bookmark: 'M6 3h12v18l-6-4-6 4V3Z',
      grip: 'M8 4h.01M16 4h.01M8 12h.01M16 12h.01M8 20h.01M16 20h.01',
      close: 'm6 6 12 12M18 6 6 18',
      edit: 'm16 3 5 5M3 21l5-1L20 8a3.5 3.5 0 0 0-5-5L3 15v6Z',
      file: 'M14 3H6v18h14V9l-6-6ZM14 3v6h6M8 13h8M8 17h5'
    };
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', paths[name] || paths.file);
    if (name === 'grip') path.setAttribute('stroke-width', '3');
    svg.append(path);
    return svg;
  }
  const rangeLabel = (start, end) => start === end ? String(start) : start + '–' + end;
  function setText(selector, value) {
    $$(selector).forEach(node => { node.textContent = String(value); });
  }
  function setButtonLabel(button, value) {
    if (!button) return;
    const label = $('[data-toggle-label]', button);
    if (label) label.textContent = value;
    else button.textContent = value;
  }

  // The same numbered structure drives the collation cards, index and bookmarks.
  function computeRanges(documents, extraAffidavitPages = false) {
    let cursor = 1;
    return PARTS.flatMap(part => documents.filter(doc => doc.part === part.id))
      .map(doc => {
        const pages = doc.pages + (extraAffidavitPages && doc.id === 'affidavit' ? 2 : 0);
        const result = {...doc, pages, start: cursor, end: cursor + pages - 1};
        cursor += pages;
        return result;
      });
  }

  const collation = $('#collation-demo');
  if (collation) {
    let documents = SOURCE_DOCUMENTS.map(doc => ({...doc}));
    let extraPages = false;
    let previousRanges = new Map();
    let draggedId = null;
    const extraButton = $('#collation-extra-pages');
    const resetButton = $('#collation-reset');
    const output = $('#collation-status');

    function renderCollation(message, focusTarget) {
      const rows = computeRanges(documents, extraPages);
      const total = rows.reduce((sum, doc) => sum + doc.pages, 0);
      const revised = new Set(rows.filter(doc => {
        const before = previousRanges.get(doc.id);
        return before && (before.start !== doc.start || before.end !== doc.end || before.part !== doc.part);
      }).map(doc => doc.id));

      PARTS.forEach(part => {
        const partRows = rows.filter(doc => doc.part === part.id);
        const bucket = $('[data-part-list="' + part.id + '"]', collation);
        if (bucket) {
          const fragment = document.createDocumentFragment();
          partRows.forEach((doc, localIndex) => {
            const card = element('article', 'collation-doc' + (revised.has(doc.id) ? ' is-updated' : ''));
            card.dataset.docId = doc.id;
            card.draggable = true;
            card.setAttribute('aria-label', doc.name + ', ' + doc.pages + ' pages, bundle pages ' + rangeLabel(doc.start, doc.end));
            const main = element('div', 'collation-doc-main');
            const grip = element('span', 'drag-grip');
            grip.setAttribute('aria-hidden', 'true');
            grip.append(icon('grip'));
            const copy = element('div', 'collation-doc-copy');
            copy.append(element('strong', 'collation-doc-title', doc.name));
            copy.append(element('span', 'collation-doc-meta', doc.type + ' · ' + doc.pages + ' pages'));
            main.append(grip, copy, element('span', 'collation-doc-range', rangeLabel(doc.start, doc.end)));
            const controls = element('div', 'collation-doc-controls');
            ['up', 'down'].forEach(direction => {
              const button = element('button', 'doc-move');
              button.type = 'button';
              button.dataset.docAction = direction;
              button.dataset.docId = doc.id;
              button.setAttribute('aria-label', 'Move ' + doc.name + ' ' + direction + ' in ' + part.label);
              button.title = 'Move ' + direction;
              button.disabled = direction === 'up' ? localIndex === 0 : localIndex === partRows.length - 1;
              button.append(icon(direction));
              controls.append(button);
            });
            const destination = element('select', 'doc-part-select');
            destination.dataset.docId = doc.id;
            destination.setAttribute('aria-label', 'Move ' + doc.name + ' to a part');
            PARTS.forEach(target => {
              const option = element('option', '', target.short);
              option.value = target.id;
              option.selected = doc.part === target.id;
              destination.append(option);
            });
            controls.append(destination);
            card.append(main, controls);
            fragment.append(card);
          });
          if (!partRows.length) {
            const empty = element('p', 'collation-empty', 'Move a document into this part.');
            fragment.append(empty);
          }
          bucket.replaceChildren(fragment);
        }
        setText('[data-part-pages="' + part.id + '"]', partRows.reduce((sum, doc) => sum + doc.pages, 0));
        setText('[data-part-count="' + part.id + '"]', partRows.length);
        setText('[data-part-count-label="' + part.id + '"]', partRows.length === 1 ? 'document' : 'documents');
      });

      const indexBody = $('#collation-index-body');
      if (indexBody) {
        const fragment = document.createDocumentFragment();
        rows.forEach((doc, index) => {
          const row = element('tr', revised.has(doc.id) ? 'is-updated' : '');
          row.append(element('td', 'index-no', String(index + 1)), element('td', 'index-name', doc.name), element('td', 'index-date', doc.date), element('td', 'auto-page', String(doc.start)));
          fragment.append(row);
        });
        indexBody.replaceChildren(fragment);
      }
      const paginationBody = $('#pagination-table-body');
      if (paginationBody) {
        const fragment = document.createDocumentFragment();
        rows.forEach(doc => {
          const row = element('tr', revised.has(doc.id) ? 'is-updated' : '');
          row.append(element('td', '', doc.name), element('td', '', String(doc.pages)), element('td', 'auto-page', rangeLabel(doc.start, doc.end)));
          fragment.append(row);
        });
        paginationBody.replaceChildren(fragment);
      }
      const bookmarks = $('#collation-bookmarks');
      if (bookmarks) {
        const fragment = document.createDocumentFragment();
        PARTS.forEach((part, partIndex) => {
          const partRows = rows.filter(doc => doc.part === part.id);
          if (!partRows.length) return;
          const group = element('li', 'bookmark-group');
          const heading = element('div', 'bookmark-group-label');
          heading.append(icon('bookmark'), element('span', '', (partIndex + 1) + '  ' + part.label), element('span', 'bookmark-page', String(partRows[0].start)));
          const children = element('ol', 'bookmark-children');
          partRows.forEach((doc, index) => {
            const leaf = element('li', 'bookmark-leaf' + (revised.has(doc.id) ? ' is-updated' : ''));
            leaf.append(element('span', '', (partIndex + 1) + String.fromCharCode(97 + index) + '  ' + doc.name), element('span', 'bookmark-page', String(doc.start)));
            children.append(leaf);
          });
          group.append(heading, children);
          fragment.append(group);
        });
        bookmarks.replaceChildren(fragment);
      }
      setText('[data-collation-total]', total);
      setText('[data-collation-documents]', rows.length);
      if (bundleTotal !== total) {
        bundleTotal = total;
        onBundleTotalChanged();
      }
      if (extraButton) {
        extraButton.setAttribute('aria-pressed', String(extraPages));
        setButtonLabel(extraButton, extraPages ? (extraButton.dataset.labelAfter || 'Remove the two added pages') : (extraButton.dataset.labelBefore || 'Add 2 pages to Affidavit'));
      }
      if (output && message) output.textContent = message + ' Example rebuilt: ' + total + ' numbered pages. Index entries and bookmarks now follow the updated document order.';
      previousRanges = new Map(rows.map(doc => [doc.id, {...doc}]));
      if (focusTarget) {
        const selector = focusTarget.action
          ? '[data-doc-action="' + focusTarget.action + '"][data-doc-id="' + focusTarget.id + '"]'
          : '.doc-part-select[data-doc-id="' + focusTarget.id + '"]';
        const target = $(selector, collation);
        if (target && !target.disabled) target.focus({preventScroll: true});
        else $('.doc-part-select[data-doc-id="' + focusTarget.id + '"]', collation)?.focus({preventScroll: true});
      }
    }

    function moveToPart(id, partId, beforeId) {
      const current = documents.find(doc => doc.id === id);
      if (!current || !PARTS.some(part => part.id === partId) || id === beforeId) return false;
      documents = documents.filter(doc => doc.id !== id);
      current.part = partId;
      if (beforeId) {
        const targetIndex = documents.findIndex(doc => doc.id === beforeId);
        documents.splice(targetIndex < 0 ? documents.length : targetIndex, 0, current);
      } else {
        let last = -1;
        documents.forEach((doc, index) => { if (doc.part === partId) last = index; });
        documents.splice(last < 0 ? documents.length : last + 1, 0, current);
      }
      return true;
    }

    scope.on(collation, 'click', event => {
      const button = event.target.closest('[data-doc-action]');
      if (!button || !collation.contains(button) || button.disabled) return;
      const doc = documents.find(item => item.id === button.dataset.docId);
      if (!doc) return;
      const siblings = documents.filter(item => item.part === doc.part);
      const index = siblings.findIndex(item => item.id === doc.id);
      const destination = index + (button.dataset.docAction === 'up' ? -1 : 1);
      if (destination < 0 || destination >= siblings.length) return;
      const a = documents.findIndex(item => item.id === doc.id);
      const b = documents.findIndex(item => item.id === siblings[destination].id);
      [documents[a], documents[b]] = [documents[b], documents[a]];
      renderCollation(doc.name + ' moved ' + button.dataset.docAction + '.', {id: doc.id, action: button.dataset.docAction});
    });
    scope.on(collation, 'change', event => {
      const select = event.target.closest('.doc-part-select');
      if (!select || !collation.contains(select)) return;
      const doc = documents.find(item => item.id === select.dataset.docId);
      const target = PARTS.find(part => part.id === select.value);
      if (!doc || !target || !moveToPart(doc.id, target.id)) return;
      renderCollation(doc.name + ' moved to ' + target.short + '.', {id: doc.id});
    });
    scope.on(collation, 'dragstart', event => {
      const card = event.target.closest('.collation-doc');
      if (!card || event.target.closest('button, select, option')) { event.preventDefault(); return; }
      draggedId = card.dataset.docId;
      card.classList.add('is-dragging');
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', draggedId);
      }
    });
    scope.on(collation, 'dragover', event => {
      const bucket = event.target.closest('[data-part-list]');
      if (!draggedId || !bucket || !collation.contains(bucket)) return;
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
      $$('[data-part-list]', collation).forEach(node => node.classList.toggle('is-drop-target', node === bucket));
    });
    scope.on(collation, 'drop', event => {
      const bucket = event.target.closest('[data-part-list]');
      if (!draggedId || !bucket || !collation.contains(bucket)) return;
      event.preventDefault();
      const targetCard = event.target.closest('.collation-doc');
      const doc = documents.find(item => item.id === draggedId);
      const id = draggedId;
      draggedId = null;
      $$('[data-part-list]', collation).forEach(node => node.classList.remove('is-drop-target'));
      if (doc && moveToPart(id, bucket.dataset.partList, targetCard?.dataset.docId)) {
        renderCollation(doc.name + ' repositioned.', {id});
      }
    });
    scope.on(collation, 'dragend', () => {
      draggedId = null;
      $$('.is-dragging, .is-drop-target', collation).forEach(node => node.classList.remove('is-dragging', 'is-drop-target'));
    });
    if (extraButton) scope.on(extraButton, 'click', () => {
      extraPages = !extraPages;
      renderCollation(extraPages ? 'Two pages added to Affidavit.' : 'Affidavit restored to 24 pages.');
    });
    if (resetButton) scope.on(resetButton, 'click', () => {
      documents = SOURCE_DOCUMENTS.map(doc => ({...doc}));
      extraPages = false;
      renderCollation('Original four-part example restored.');
    });
    scope.on($('#bookmark-regenerate'), 'click', () => {
      renderCollation();
      const bookmarkStatus = $('#bookmark-status');
      if (bookmarkStatus) bookmarkStatus.textContent = 'The example bookmark hierarchy has been regenerated from the current index and document groups. Manual bookmarks are retained separately.';
    });
    renderCollation();
  }

  // Manual bookmarks supplement the automatically generated hierarchy.
  const manualTitle = $('#bookmark-manual-title');
  const manualList = $('#manual-bookmarks');
  const manualAdd = $('#bookmark-add');
  if (manualTitle && manualList && manualAdd) {
    const manualPage = $('#bookmark-manual-page');
    const bookmarkStatus = $('#bookmark-status');
    let manualBookmarks = [];
    let nextManualId = 1;
    let editingId = null;
    let editTitle = '';
    let editPage = '';
    let draggedManualId = null;

    function announceManual(message) {
      if (bookmarkStatus) bookmarkStatus.textContent = message;
    }
    function renderManualBookmarks(focusId, focusAction) {
      const fragment = document.createDocumentFragment();
      manualBookmarks.forEach((bookmark, index) => {
        const isEditing = editingId === bookmark.id;
        const invalidPage = bookmark.page > bundleTotal;
        const row = element('li', 'bookmark-leaf manual-bookmark' + (invalidPage ? ' is-warning' : '') + (isEditing ? ' is-editing' : ''));
        row.dataset.manualId = bookmark.id;
        row.draggable = !isEditing;
        row.setAttribute('aria-label', bookmark.title + ', page ' + bookmark.page + (invalidPage ? ', outside the current bundle; edit to review' : ''));
        const grip = element('span', 'drag-grip');
        grip.setAttribute('aria-hidden', 'true');
        grip.append(icon('grip'));
        row.append(grip);
        if (isEditing) {
          const titleInput = element('input', 'manual-bookmark-edit-title');
          titleInput.type = 'text';
          titleInput.value = editTitle;
          titleInput.maxLength = 120;
          titleInput.setAttribute('aria-label', 'Edit manual bookmark title');
          const pageInput = element('input', 'manual-bookmark-edit-page');
          pageInput.type = 'number';
          pageInput.min = '1';
          pageInput.max = String(bundleTotal);
          pageInput.step = '1';
          pageInput.value = editPage;
          pageInput.setAttribute('aria-label', 'Edit manual bookmark page, from 1 to ' + bundleTotal);
          row.append(titleInput, pageInput);
        } else {
          const label = element('span', 'manual-bookmark-title', bookmark.title);
          const page = element('span', 'bookmark-page', String(bookmark.page) + (invalidPage ? ' · review page' : ''));
          if (invalidPage) page.title = 'This page is outside the current ' + bundleTotal + '-page bundle. Edit the bookmark to choose a valid page.';
          row.append(label, page);
        }
        const controls = element('span', 'manual-bookmark-controls');
        (isEditing ? ['save', 'cancel'] : ['up', 'down', 'edit', 'remove']).forEach(action => {
          const button = element('button', 'doc-move' + (isEditing ? ' manual-edit-control' : ''));
          button.type = 'button';
          button.dataset.manualId = bookmark.id;
          button.dataset.manualAction = action;
          const actionLabel = {remove: 'Remove', edit: 'Edit', save: 'Save changes to', cancel: 'Cancel changes to'}[action];
          button.setAttribute('aria-label', actionLabel ? actionLabel + ' manual bookmark ' + bookmark.title : 'Move manual bookmark ' + bookmark.title + ' ' + action);
          button.disabled = (action === 'up' && index === 0) || (action === 'down' && index === manualBookmarks.length - 1);
          if (isEditing) button.textContent = action === 'save' ? 'Save' : 'Cancel';
          else button.append(icon(action === 'remove' ? 'close' : action));
          controls.append(button);
        });
        row.append(controls);
        fragment.append(row);
      });
      manualList.replaceChildren(fragment);
      if (focusId) {
        if (focusAction === 'edit-title') {
          const titleInput = $('.manual-bookmark[data-manual-id="' + focusId + '"] .manual-bookmark-edit-title', manualList);
          titleInput?.focus({preventScroll: true});
          titleInput?.select();
          return;
        }
        const preferred = $('[data-manual-id="' + focusId + '"][data-manual-action="' + (focusAction || 'remove') + '"]', manualList);
        const fallback = $('[data-manual-id="' + focusId + '"][data-manual-action="remove"]', manualList);
        (preferred && !preferred.disabled ? preferred : fallback)?.focus({preventScroll: true});
      }
    }
    function validManualPage(control) {
      const page = control ? Number(control.value) : 1;
      if (Number.isInteger(page) && page >= 1 && page <= bundleTotal) return page;
      if (control) {
        control.setCustomValidity('Choose a numbered page between 1 and ' + bundleTotal + '.');
        control.reportValidity();
        control.focus();
      }
      return null;
    }
    function addManualBookmark() {
      const title = manualTitle.value.trim().slice(0, 120);
      if (!title) {
        manualTitle.setCustomValidity('Enter a bookmark title.');
        manualTitle.reportValidity();
        manualTitle.focus();
        return;
      }
      const entered = validManualPage(manualPage);
      if (entered === null) return;
      manualBookmarks.push({id: 'manual-' + nextManualId++, title, page: entered});
      renderManualBookmarks();
      manualTitle.value = '';
      manualTitle.focus({preventScroll: true});
      announceManual('Manual example bookmark “' + title + '” added at numbered page ' + entered + '. Drag or use the move controls to reorder; Edit changes the title or page.');
    }
    function saveManualBookmark(bookmark) {
      const row = $('.manual-bookmark[data-manual-id="' + bookmark.id + '"]', manualList);
      const titleInput = $('.manual-bookmark-edit-title', row);
      const pageInput = $('.manual-bookmark-edit-page', row);
      const title = titleInput.value.trim();
      if (!title) {
        titleInput.setCustomValidity('Enter a bookmark title.');
        titleInput.reportValidity();
        titleInput.focus();
        return;
      }
      const page = validManualPage(pageInput);
      if (page === null) return;
      bookmark.title = title;
      bookmark.page = page;
      editingId = null;
      renderManualBookmarks(bookmark.id, 'edit');
      announceManual('Manual example bookmark updated to “' + title + '”, numbered page ' + page + '.');
    }
    scope.on(manualTitle, 'input', () => manualTitle.setCustomValidity(''));
    scope.on(manualPage, 'input', () => manualPage.setCustomValidity(''));
    scope.on(manualAdd, 'click', addManualBookmark);
    scope.on(manualTitle, 'keydown', event => {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      addManualBookmark();
    });
    scope.on(manualList, 'click', event => {
      const button = event.target.closest('[data-manual-action]');
      if (!button || !manualList.contains(button) || button.disabled) return;
      const index = manualBookmarks.findIndex(item => item.id === button.dataset.manualId);
      if (index < 0) return;
      const bookmark = manualBookmarks[index];
      const action = button.dataset.manualAction;
      if (action === 'edit') {
        editingId = bookmark.id;
        editTitle = bookmark.title;
        editPage = String(bookmark.page);
        renderManualBookmarks(bookmark.id, 'edit-title');
        return;
      }
      if (action === 'save') { saveManualBookmark(bookmark); return; }
      if (action === 'cancel') {
        editingId = null;
        renderManualBookmarks(bookmark.id, 'edit');
        announceManual('Manual bookmark changes cancelled.');
        return;
      }
      if (action === 'remove') {
        manualBookmarks.splice(index, 1);
        renderManualBookmarks();
        manualAdd.focus({preventScroll: true});
        announceManual('Manual example bookmark “' + bookmark.title + '” removed.');
        return;
      }
      if (!['up', 'down'].includes(action)) return;
      const target = index + (action === 'up' ? -1 : 1);
      if (target < 0 || target >= manualBookmarks.length) return;
      [manualBookmarks[index], manualBookmarks[target]] = [manualBookmarks[target], manualBookmarks[index]];
      renderManualBookmarks(bookmark.id, action);
      announceManual('Manual example bookmark “' + bookmark.title + '” moved ' + action + '.');
    });
    scope.on(manualList, 'input', event => {
      if (event.target.matches('.manual-bookmark-edit-title')) editTitle = event.target.value;
      else if (event.target.matches('.manual-bookmark-edit-page')) editPage = event.target.value;
      else return;
      event.target.setCustomValidity('');
    });
    scope.on(manualList, 'keydown', event => {
      if (!event.target.matches('.manual-bookmark-edit-title, .manual-bookmark-edit-page')) return;
      if (event.key === 'Enter') {
        event.preventDefault();
        const bookmark = manualBookmarks.find(item => item.id === editingId);
        if (bookmark) saveManualBookmark(bookmark);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        const id = editingId;
        editingId = null;
        renderManualBookmarks(id, 'edit');
        announceManual('Manual bookmark changes cancelled.');
      }
    });
    scope.on(manualList, 'dragstart', event => {
      const row = event.target.closest('.manual-bookmark');
      if (!row || event.target.closest('button, input') || editingId) { event.preventDefault(); return; }
      draggedManualId = row.dataset.manualId;
      row.classList.add('is-dragging');
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', draggedManualId);
      }
    });
    scope.on(manualList, 'dragover', event => {
      if (!draggedManualId) return;
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
      const target = event.target.closest('.manual-bookmark');
      $$('.manual-bookmark', manualList).forEach(row => row.classList.toggle('is-drop-target', row === target && row.dataset.manualId !== draggedManualId));
    });
    scope.on(manualList, 'drop', event => {
      if (!draggedManualId) return;
      event.preventDefault();
      const id = draggedManualId;
      const target = event.target.closest('.manual-bookmark');
      draggedManualId = null;
      if (target?.dataset.manualId === id) { renderManualBookmarks(id, 'edit'); return; }
      const bookmark = manualBookmarks.find(item => item.id === id);
      if (!bookmark) return;
      manualBookmarks = manualBookmarks.filter(item => item.id !== id);
      let targetIndex = target ? manualBookmarks.findIndex(item => item.id === target.dataset.manualId) : manualBookmarks.length;
      if (target && targetIndex >= 0) {
        const bounds = target.getBoundingClientRect();
        if (event.clientY >= bounds.top + bounds.height / 2) targetIndex += 1;
      }
      manualBookmarks.splice(targetIndex < 0 ? manualBookmarks.length : targetIndex, 0, bookmark);
      renderManualBookmarks(id, 'edit');
      announceManual('Manual example bookmark “' + bookmark.title + '” repositioned. Automatic group hierarchy is unchanged.');
    });
    scope.on(manualList, 'dragend', () => {
      draggedManualId = null;
      $$('.is-dragging, .is-drop-target', manualList).forEach(row => row.classList.remove('is-dragging', 'is-drop-target'));
    });
    onBundleTotalChanged = () => {
      if (manualPage) {
        manualPage.max = String(bundleTotal);
        manualPage.setCustomValidity('');
      }
      renderManualBookmarks();
      const invalid = manualBookmarks.filter(bookmark => bookmark.page > bundleTotal).length;
      if (invalid) announceManual('The bundle now has ' + bundleTotal + ' pages. ' + invalid + ' manual bookmark ' + (invalid === 1 ? 'targets a page' : 'targets pages') + ' outside that range; use Edit to review ' + (invalid === 1 ? 'it.' : 'them.'));
    };
    onBundleTotalChanged();
  }

  // Greedy, document-aware allocation: an entire document goes in one volume.
  // A single oversized document is preserved intact and explicitly flagged.
  function splitVolumes(documents, targetPages) {
    const volumes = [];
    let cursor = 1;
    let current = null;
    documents.forEach(doc => {
      if (!current || (current.pages && current.pages + doc.pages > targetPages)) {
        current = {number: volumes.length + 1, pages: 0, start: cursor, end: cursor - 1, documents: [], oversized: false};
        volumes.push(current);
      }
      const volumeStart = current.pages + 1;
      const included = {...doc, start: cursor, end: cursor + doc.pages - 1, volumeStart, volumeEnd: volumeStart + doc.pages - 1};
      current.documents.push(included);
      current.pages += doc.pages;
      current.end = included.end;
      current.oversized = current.pages > targetPages;
      cursor += doc.pages;
    });
    return volumes;
  }
  const volumeDemo = $('#volume-demo');
  if (volumeDemo) {
    const targetControl = $('#volume-target');
    const results = $('#volume-results');
    const indexBody = $('#volume-index-body');
    const output = $('#volume-status');
    let selectedVolume = 1;
    let target = 300;
    let volumes = [];

    function renderVolumeIndex() {
      const volume = volumes.find(item => item.number === selectedVolume) || volumes[0];
      if (!volume) return;
      selectedVolume = volume.number;
      if (indexBody) {
        const fragment = document.createDocumentFragment();
        volume.documents.forEach((doc, index) => {
          const row = element('tr');
          row.append(element('td', '', String(index + 1)), element('td', '', doc.name), element('td', 'auto-page', rangeLabel(doc.start, doc.end)), element('td', '', rangeLabel(doc.volumeStart, doc.volumeEnd)));
          fragment.append(row);
        });
        indexBody.replaceChildren(fragment);
      }
      setText('[data-volume-selected]', selectedVolume);
      setText('[data-volume-range]', rangeLabel(volume.start, volume.end));
      $$('[data-volume-select]', volumeDemo).forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.volumeSelect) === selectedVolume)));
    }
    function renderVolumes(announce = true) {
      const entered = Number(targetControl?.value || 300);
      target = Number.isFinite(entered) ? Math.min(500, Math.max(150, Math.round(entered))) : 300;
      if (targetControl && targetControl.tagName === 'INPUT') targetControl.value = String(target);
      volumes = splitVolumes(VOLUME_DOCUMENTS, target);
      selectedVolume = Math.min(selectedVolume, volumes.length);
      if (results) {
        const fragment = document.createDocumentFragment();
        volumes.forEach(volume => {
          const button = element('button', 'volume-card' + (volume.oversized ? ' has-warning' : ''));
          button.type = 'button';
          button.dataset.volumeSelect = String(volume.number);
          button.setAttribute('aria-pressed', String(volume.number === selectedVolume));
          button.setAttribute('aria-controls', 'volume-index-body');
          button.setAttribute('aria-label', 'View Volume ' + volume.number + ' index, bundle pages ' + rangeLabel(volume.start, volume.end) + (volume.oversized ? ', document exceeds the page target' : ''));
          button.append(element('strong', 'volume-card-title', 'Volume ' + volume.number));
          button.append(element('span', 'volume-card-range', 'Pages ' + rangeLabel(volume.start, volume.end)));
          button.append(element('span', 'volume-card-count', volume.pages + ' pages · ' + volume.documents.length + (volume.documents.length === 1 ? ' document' : ' documents')));
          const bar = element('span', 'volume-doc-bar');
          bar.setAttribute('aria-hidden', 'true');
          volume.documents.forEach((doc, index) => {
            const segment = element('span', 'volume-doc-segment segment-' + (index % 4));
            segment.style.flexGrow = String(doc.pages);
            segment.title = doc.name + ' · ' + doc.pages + ' pages';
            bar.append(segment);
          });
          button.append(bar);
          button.append(element('span', 'volume-index-label', 'Individual index generated'));
          if (volume.oversized) button.append(element('span', 'volume-warning', 'Oversized document kept intact'));
          fragment.append(button);
        });
        results.replaceChildren(fragment);
      }
      const oversized = volumes.filter(volume => volume.oversized);
      const first = volumes[0];
      const nextDocument = volumes[1]?.documents[0];
      let boundary = 'Every document stays intact. Each volume receives its own index.';
      if (oversized.length) {
        const doc = oversized[0].documents[0];
        boundary = doc.name + ' has ' + doc.pages + ' pages, above the ' + target + '-page target. It remains intact in its own volume and is flagged for review.';
      } else if (first && nextDocument) {
        boundary = 'Volume 1 leaves ' + (target - first.pages) + ' pages below the target. The ' + nextDocument.pages + '-page ' + nextDocument.name + ' document starts intact in Volume 2.';
      }
      setText('[data-volume-boundary-note]', boundary);
      setText('[data-volume-count]', volumes.length);
      setText('[data-volume-target]', target);
      setText('[data-volume-total]', VOLUME_DOCUMENTS.reduce((sum, doc) => sum + doc.pages, 0));
      renderVolumeIndex();
      if (output && announce) {
        output.textContent = 'Illustrative bundle rebuilt into ' + volumes.length + ' volumes at a ' + target + '-page target. No document is split.' + (oversized.length ? ' ' + oversized.length + ' oversized document' + (oversized.length === 1 ? ' requires' : 's require') + ' review.' : ' Per-volume indexes are updated.');
      }
    }
    scope.on(targetControl, 'change', () => renderVolumes());
    scope.on(results, 'click', event => {
      const button = event.target.closest('[data-volume-select]');
      if (!button || !results.contains(button)) return;
      selectedVolume = Number(button.dataset.volumeSelect);
      renderVolumeIndex();
      if (output) output.textContent = 'Showing the generated index for Volume ' + selectedVolume + '. Bundle page numbering is retained.';
    });
    renderVolumes(false);
  }

  // Populate a specified template from form fields. No generated legal prose.
  const generationForm = $('#generation-form');
  if (generationForm) {
    const category = $('#generation-category');
    const subcategory = $('#generation-subcategory');
    const status = $('#generation-status');
    const preview = $('#generation-preview');
    const selectedCategory = () => category?.selectedOptions[0]?.textContent.trim() || 'Application';
    function markPreviewStale(message) {
      if (preview) {
        preview.dataset.generated = 'false';
        preview.classList.remove('is-generated');
      }
      if (status) status.textContent = message || 'Fields changed. Generate the preview again to apply them to the template.';
    }
    function syncDocumentType() {
      const documentType = $('[name="documentType"]', generationForm);
      if (documentType && subcategory) {
        documentType.value = subcategory.selectedOptions[0]?.textContent.trim() || subcategory.value;
        documentType.setCustomValidity('');
      }
    }
    function syncCategoryFields() {
      const activeCategory = selectedCategory();
      $$('[data-generation-field]', generationForm).forEach(wrapper => {
        const active = wrapper.dataset.generationField === activeCategory;
        wrapper.hidden = !active;
        $$('input, select, textarea', wrapper).forEach(field => {
          field.disabled = !active;
          field.setCustomValidity('');
        });
      });
    }
    function formatDate(value) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
      const date = new Date(value + 'T00:00:00Z');
      return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en-GB', {day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC'}).format(date);
    }
    scope.on(generationForm, 'input', event => {
      if (typeof event.target.setCustomValidity === 'function') event.target.setCustomValidity('');
      if (preview?.dataset.generated === 'true') markPreviewStale();
    });
    scope.on(category, 'change', () => {
      const selected = category.selectedOptions[0];
      const options = selected?.dataset.subcategories?.split('|').map(item => item.trim()).filter(Boolean);
      if (subcategory && options?.length) {
        const fragment = document.createDocumentFragment();
        options.forEach(value => {
          const option = element('option', '', value);
          option.value = value;
          fragment.append(option);
        });
        subcategory.replaceChildren(fragment);
      }
      syncCategoryFields();
      syncDocumentType();
      markPreviewStale('Category selected. Review the fields and generate the template preview.');
    });
    scope.on(subcategory, 'change', () => {
      syncDocumentType();
      markPreviewStale('Subcategory selected. The document type is updated; generate the preview to apply the changes.');
    });
    scope.on(generationForm, 'submit', event => {
      event.preventDefault();
      if (!generationForm.reportValidity()) return;
      for (const field of $$('input[required], textarea[required]', generationForm)) {
        if (field.disabled) continue;
        if (!field.value.trim()) {
          field.setCustomValidity('Please enter a value.');
          field.reportValidity();
          return;
        }
      }
      const values = new FormData(generationForm);
      const data = {};
      ['applicant', 'respondent', 'court', 'matterNumber', 'date', 'documentType'].forEach(key => { data[key] = String(values.get(key) || '').trim(); });
      data.category = category?.selectedOptions[0]?.textContent.trim() || String(values.get('category') || 'Application');
      data.subcategory = subcategory?.selectedOptions[0]?.textContent.trim() || String(values.get('subcategory') || 'Procedural Application');
      data.documentType = data.documentType || data.subcategory;
      data.date = formatDate(data.date);
      Object.entries(data).forEach(([key, value]) => setText('[data-generated="' + key + '"]', value));
      $$('[data-generation-output]').forEach(wrapper => {
        const active = wrapper.dataset.generationOutput === data.category;
        wrapper.hidden = !active;
        if (!active) return;
        ['deponent', 'documentReference'].forEach(key => {
          $$('[data-generated="' + key + '"]', wrapper).forEach(node => {
            node.textContent = String(values.get(key) || '').trim();
          });
        });
      });
      const basename = (data.documentType.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'generated-document') + '.docx';
      setText('[data-generation-file]', basename);
      if (preview) {
        preview.dataset.generated = 'true';
        preview.classList.add('is-generated');
      }
      if (status) status.textContent = 'Template preview populated from these fields. Review the formatted document and supporting files before export. This example has not created or downloaded a file.';
    });
    syncCategoryFields();
  }

  // Explicit rule-based example findings. Resolving them does not certify a filing.
  const validationDemo = $('#validation-demo');
  if (validationDemo) {
    const list = $('#validation-list');
    const status = $('#validation-status');
    const reset = $('#validation-reset');
    const state = {date: false, category: false, pagination: false};
    const controls = {
      date: $('#validation-date-fix'),
      category: $('#validation-category-fix'),
      pagination: $('#validation-pagination-fix')
    };
    const originalLabels = Object.fromEntries(Object.entries(controls).map(([key, button]) => [key, button ? ($('[data-toggle-label]', button)?.textContent || button.textContent) : '']));
    const resolvedLabels = {date: 'Date added', category: 'Category assigned', pagination: 'Numbering reviewed'};
    function renderValidation(message) {
      const checks = [
        {pass: true, title: 'Index generated', detail: 'Page references are present.'},
        {pass: true, title: 'Bookmarks generated', detail: 'The document hierarchy is available.'},
        {pass: true, title: 'Required category groups present', detail: 'The four-part structure is in place.'},
        {pass: true, title: 'Volume boundaries checked', detail: 'Documents remain intact.'},
        {pass: state.date, title: state.date ? 'Affidavit date provided' : 'Missing date: Affidavit', detail: state.date ? 'Illustrative date entered: 13 Mar 2026.' : 'Add the document date before completing this check.'},
        {pass: state.category, title: state.category ? 'Document category assigned' : 'Document category not assigned', detail: state.category ? 'Supporting evidence assigned to the Evidence category.' : 'Assign a category to the supporting evidence.'},
        {pass: state.pagination, title: state.pagination ? 'Page numbering reviewed' : 'Page numbering requires review', detail: state.pagination ? 'The rebuilt page ranges have been reviewed in this example.' : 'Review numbering after the latest document change.'}
      ];
      if (list) {
        const fragment = document.createDocumentFragment();
        checks.forEach(check => {
          const row = element('li', 'validation-row ' + (check.pass ? 'is-pass' : 'is-warning'));
          row.append(icon(check.pass ? 'check' : 'warning'));
          const copy = element('span', 'validation-copy');
          copy.append(element('strong', '', check.title), element('small', '', check.detail));
          row.append(copy);
          fragment.append(row);
        });
        list.replaceChildren(fragment);
      }
      const remaining = Object.values(state).filter(value => !value).length;
      setText('[data-validation-count]', remaining);
      setText('[data-validation-passed]', checks.length - remaining);
      setText('[data-validation-summary]', remaining ? remaining + ' items to review' : 'Example checks complete');
      validationDemo.classList.toggle('is-complete', remaining === 0);
      Object.entries(controls).forEach(([key, button]) => {
        if (!button) return;
        button.disabled = state[key];
        button.setAttribute('aria-pressed', String(state[key]));
        setButtonLabel(button, state[key] ? resolvedLabels[key] : originalLabels[key]);
      });
      if (status && message) status.textContent = message + ' ' + (remaining ? remaining + ' example finding' + (remaining === 1 ? ' remains.' : 's remain.') : 'All example checks are complete. The bundle still requires professional review.');
    }
    Object.entries(controls).forEach(([key, button]) => scope.on(button, 'click', () => {
      state[key] = true;
      renderValidation(resolvedLabels[key] + '.');
      const next = Object.entries(controls).find(([name, control]) => control && !state[name]);
      (next?.[1] || reset)?.focus({preventScroll: true});
    }));
    scope.on(reset, 'click', () => {
      Object.keys(state).forEach(key => { state[key] = false; });
      renderValidation('Original example findings restored.');
    });
    renderValidation();
  }
})();


}
