<script setup lang="ts">
import {
  ArrowRight,
  Bookmark,
  ChevronDown,
  CircleCheck,
  Download,
  FileText,
  Folder,
  GripVertical,
  ListOrdered,
  PanelsTopLeft,
  Upload,
} from '@lucide/vue'
</script>

<template>
  <figure
    class="workflow"
    aria-label="Example workflow: import four legal documents, organize them in a matter, and export a PDF with automatic index, page numbers, and bookmarks."
  >
    <div class="workflow-header">
      <span>From files to a finished bundle</span>
      <span class="sample-tag">
        <PanelsTopLeft class="icon" aria-hidden="true" />Illustrative workspace</span
      >
    </div>
    <div class="stage-strip" aria-hidden="true">
      <div class="stage-name">
        <span class="stage-num">01</span>Import<ArrowRight class="icon" aria-hidden="true" />
      </div>
      <div class="stage-name">
        <span class="stage-num">02</span>Organize<ArrowRight class="icon" aria-hidden="true" />
      </div>
      <div class="stage-name"><span class="stage-num">03</span>Court-ready bundle</div>
    </div>
    <div class="visual" aria-hidden="true">
      <div class="mini-window import-card" data-stage="01 Import">
        <div class="window-title">
          <Upload class="icon" aria-hidden="true" />Source documents<span class="dots">
            <span></span>
            <span></span>
            <span></span>
          </span>
        </div>
        <div class="import-inner">
          <div class="mini-label">4 files imported</div>
          <div class="file-row">
            <span class="file-icon">
              <FileText class="icon" aria-hidden="true" />
            </span>
            <span>Witness Statement.pdf</span>
          </div>
          <div class="file-row">
            <span class="file-icon">
              <FileText class="icon" aria-hidden="true" />
            </span>
            <span>Contract.pdf</span>
          </div>
          <div class="file-row">
            <span class="file-icon">
              <FileText class="icon" aria-hidden="true" />
            </span>
            <span>Evidence.pdf</span>
          </div>
          <div class="file-row">
            <span class="file-icon">
              <FileText class="icon" aria-hidden="true" />
            </span>
            <span>Correspondence.pdf</span>
          </div>
        </div>
        <div class="import-footer">
          <CircleCheck class="icon" aria-hidden="true" />Ready to organize
        </div>
      </div>
      <div class="mini-window matter-card" data-stage="02 Organize">
        <div class="window-title">
          <PanelsTopLeft class="icon" aria-hidden="true" />Matter workspace<span class="dots">
            <span></span>
            <span></span>
            <span></span>
          </span>
        </div>
        <div class="matter-body">
          <div class="matter-heading">
            <span class="matter-folder">
              <Folder class="icon" aria-hidden="true" />
            </span>
            <div>
              <strong>Commercial dispute</strong>
              <small>MD-2026-014 &middot; 4 documents</small>
            </div>
          </div>
          <div class="bundle-structure">
            <span>Bundle structure</span>
            <span>Pages</span>
          </div>
          <div class="doc-row doc-section">
            <ChevronDown class="icon" aria-hidden="true" />
            <Folder class="icon" aria-hidden="true" />
            <span class="doc-title">A. Core documents</span>
          </div>
          <div class="doc-row nested selected">
            <GripVertical class="icon" aria-hidden="true" />
            <FileText class="icon" aria-hidden="true" />
            <span class="doc-title">Contract</span>
            <span class="pages">3&ndash;12</span>
          </div>
          <div class="doc-row nested">
            <GripVertical class="icon" aria-hidden="true" />
            <FileText class="icon" aria-hidden="true" />
            <span class="doc-title">Witness statement</span>
            <span class="pages">13&ndash;20</span>
          </div>
          <div class="doc-row doc-section">
            <ChevronDown class="icon" aria-hidden="true" />
            <Folder class="icon" aria-hidden="true" />
            <span class="doc-title">B. Supporting evidence</span>
          </div>
          <div class="doc-row nested">
            <GripVertical class="icon" aria-hidden="true" />
            <FileText class="icon" aria-hidden="true" />
            <span class="doc-title">Evidence</span>
            <span class="pages">21&ndash;42</span>
          </div>
          <div class="doc-row nested">
            <GripVertical class="icon" aria-hidden="true" />
            <FileText class="icon" aria-hidden="true" />
            <span class="doc-title">Correspondence</span>
            <span class="pages">43&ndash;48</span>
          </div>
        </div>
        <div class="matter-footer">
          <span>48 pages incl. index</span>
          <span class="index-chip">
            <ListOrdered class="icon" aria-hidden="true" />Build index</span
          >
        </div>
      </div>
      <div class="mini-window bundle-card" data-stage="03 Court-ready bundle">
        <div class="window-title">
          <FileText class="icon" aria-hidden="true" />
          <span>Bundle preview</span>
          <CircleCheck class="icon end" aria-hidden="true" />
        </div>
        <div class="paper-zone">
          <div class="paper-stack">
            <div class="paper">
              <span class="bookmark-tab"></span>
              <div class="paper-top">
                <span>MatterDraft</span>
                <span>MD-014</span>
              </div>
              <strong class="paper-title">Court bundle</strong>
              <p class="paper-sub">Commercial dispute &middot; Example</p>
              <div class="paper-rule"></div>
              <div class="paper-index-label">Index of documents</div>
              <div class="index-row">
                <span class="n">01</span>
                <span>Contract</span>
                <span>3&ndash;12</span>
              </div>
              <div class="index-row">
                <span class="n">02</span>
                <span>Witness statement</span>
                <span>13&ndash;20</span>
              </div>
              <div class="index-row">
                <span class="n">03</span>
                <span>Evidence</span>
                <span>21&ndash;42</span>
              </div>
              <div class="index-row">
                <span class="n">04</span>
                <span>Correspondence</span>
                <span>43&ndash;48</span>
              </div>
              <div class="paper-bottom">
                <span>TABLE OF CONTENTS</span>
                <span>1 / 48</span>
              </div>
            </div>
          </div>
        </div>
        <div class="bundle-status">
          <span class="ready"> <CircleCheck class="icon" aria-hidden="true" />Export ready</span>
          <span class="export-chip"> <Download class="icon" aria-hidden="true" />PDF</span>
        </div>
      </div>
    </div>
    <figcaption class="workflow-caption">
      <Bookmark class="icon" aria-hidden="true" />One structured PDF &middot; Numbered pages
      &middot; Navigable bookmarks
    </figcaption>
  </figure>
</template>

<style scoped>
.workflow {
  margin: 0;
  position: relative;
  min-width: 0;
}
.workflow-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 0 0 13px;
}
.workflow-header > span {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.11em;
  color: var(--left-muted);
  text-transform: uppercase;
}
.workflow-header .sample-tag {
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--left-muted);
  font-size: 10px;
  font-weight: 550;
  text-transform: none;
  letter-spacing: 0;
}
.sample-tag .icon {
  width: 12px;
  height: 12px;
}
.stage-strip {
  display: grid;
  grid-template-columns: 28% 39% 33%;
  align-items: center;
  margin-bottom: 10px;
  gap: 0;
}
.stage-name {
  display: flex;
  align-items: center;
  gap: 7px;
  white-space: nowrap;
  color: var(--left-text);
  font-size: 11px;
  font-weight: 650;
  min-width: 0;
}
.stage-num {
  display: grid;
  place-items: center;
  width: 21px;
  height: 21px;
  border-radius: 7px;
  background: var(--left-soft);
  border: 1px solid var(--left-line);
  font-size: 9px;
  letter-spacing: 0.03em;
  color: var(--left-accent);
  font-weight: 750;
  flex-shrink: 0;
}
.stage-name > .icon {
  margin-left: auto;
  margin-right: 11px;
  width: 13px;
  height: 13px;
  color: var(--left-muted);
  opacity: 0.7;
}
.visual {
  display: grid;
  grid-template-columns: 28% 41% 31%;
  align-items: start;
  gap: 0;
  position: relative;
  isolation: isolate;
  min-height: 248px;
  padding: 2px 0 0;
}
.mini-window {
  background: var(--panel);
  border: 1px solid var(--panel-line);
  box-shadow: var(--shadow);
  border-radius: 11px;
  overflow: hidden;
  min-width: 0;
  position: relative;
  color: var(--panel-text);
}
.window-title {
  padding: 10px 10px;
  min-height: 36px;
  display: flex;
  gap: 6px;
  align-items: center;
  border-bottom: 1px solid var(--panel-line);
  background: var(--panel-head);
  font-size: 10px;
  line-height: 1.2;
  font-weight: 650;
  white-space: nowrap;
}
.window-title .icon {
  width: 13px;
  height: 13px;
  color: var(--panel-muted);
}
.window-title .end {
  margin-left: auto;
}
.window-title .dots {
  display: flex;
  align-items: center;
  gap: 3px;
  margin-left: auto;
}
.dots span {
  width: 3px;
  height: 3px;
  background: var(--panel-muted);
  border-radius: 50%;
  display: block;
}
.import-card {
  margin-top: 17px;
  z-index: 2;
  margin-right: -6px;
}
.import-inner {
  padding: 9px 8px;
}
.mini-label {
  font-size: 9px;
  color: var(--panel-muted);
  line-height: 1.2;
  font-weight: 600;
}
.import-inner .mini-label {
  margin: 1px 0 7px;
}
.file-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 3px;
  border-bottom: 1px solid var(--panel-line);
  min-width: 0;
  font-size: 9px;
  line-height: 1.2;
  white-space: nowrap;
}
.file-row:last-of-type {
  border-bottom: 0;
}
.file-row > span:last-child {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}
.file-icon {
  width: 20px;
  height: 23px;
  border-radius: 4px;
  border: 1px solid var(--panel-line);
  background: var(--panel-head);
  display: grid;
  place-items: center;
  color: var(--panel-active);
  flex-shrink: 0;
  position: relative;
}
.file-icon .icon {
  width: 12px;
  height: 12px;
}
.import-footer {
  font-size: 9px;
  line-height: 1.3;
  padding: 8px;
  border-top: 1px solid var(--panel-line);
  display: flex;
  gap: 5px;
  align-items: center;
  color: var(--panel-muted);
}
.import-footer .icon {
  width: 11px;
  height: 11px;
  color: var(--good);
}
.matter-card {
  z-index: 3;
}
.matter-card .window-title {
  padding-left: 11px;
}
.matter-body {
  padding: 11px 14px 10px 10px;
}
.matter-heading {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 12px;
}
.matter-folder {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  background: var(--panel-selection);
  color: var(--panel-active);
  display: grid;
  place-items: center;
  flex-shrink: 0;
}
.matter-folder .icon {
  width: 15px;
  height: 15px;
}
.matter-heading strong {
  font-size: 11px;
  display: block;
  line-height: 1.2;
  letter-spacing: -0.02em;
}
.matter-heading small {
  display: block;
  font-size: 8px;
  color: var(--panel-muted);
  margin-top: 3px;
  line-height: 1.25;
}
.bundle-structure {
  font-size: 9px;
  color: var(--panel-muted);
  display: flex;
  justify-content: space-between;
  padding: 0 2px 6px;
  border-bottom: 1px solid var(--panel-line);
  font-weight: 650;
}
.doc-row {
  display: flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;
  padding: 7px 3px;
  font-size: 9px;
  line-height: 1.15;
  min-width: 0;
}
.doc-row .icon {
  width: 11px;
  height: 11px;
  color: var(--panel-muted);
}
.doc-row .doc-title {
  overflow: hidden;
  text-overflow: ellipsis;
}
.doc-row .pages {
  margin-left: auto;
  color: var(--panel-muted);
  font-variant-numeric: tabular-nums;
  font-size: 8px;
}
.doc-row.doc-section {
  font-weight: 650;
  padding: 8px 2px 4px;
}
.doc-row.nested {
  padding-left: 15px;
}
.doc-row.selected {
  border-radius: 5px;
  background: var(--panel-selection);
  color: var(--panel-text);
}
.doc-row.selected .icon {
  color: var(--panel-active);
}
.matter-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  border-top: 1px solid var(--panel-line);
  padding: 9px 10px;
  color: var(--panel-muted);
  font-size: 9px;
}
.index-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  background: var(--panel-selection);
  color: var(--panel-active);
  padding: 4px 6px;
  border-radius: 4px;
  font-weight: 700;
  white-space: nowrap;
}
.index-chip .icon {
  width: 10px;
  height: 10px;
}
.bundle-card {
  z-index: 4;
  margin-top: 24px;
  margin-left: -7px;
}
.bundle-card .window-title {
  justify-content: space-between;
}
.bundle-card .window-title > span:first-of-type {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
}
.bundle-card .window-title .end {
  color: var(--good);
}
.paper-zone {
  padding: 13px 12px 10px;
  position: relative;
  background: var(--panel-head);
  min-height: 172px;
}
.paper-stack {
  position: relative;
  margin: 0 auto;
  max-width: 180px;
  filter: drop-shadow(0 4px 4px #030b1e20);
}
.paper-stack::after,
.paper-stack::before {
  position: absolute;
  content: '';
  background: var(--paper);
  border: 1px solid var(--paper-line);
  border-radius: 3px;
  inset: 3px -4px -4px 4px;
  z-index: -1;
  transform: rotate(2deg);
}
.paper-stack::before {
  inset: 5px -7px -7px 7px;
  transform: rotate(4deg);
  opacity: 0.8;
}
.paper {
  background: var(--paper);
  color: var(--paper-text);
  border: 1px solid var(--paper-line);
  border-radius: 3px;
  padding: 12px 10px 8px;
  position: relative;
  min-height: 143px;
  font-size: 7px;
}
.paper-top {
  display: flex;
  justify-content: space-between;
  color: var(--paper-muted);
  font-size: 5.5px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 8px;
}
.paper-title {
  font-family: Georgia, serif;
  margin: 0 0 2px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.1;
}
.paper-sub {
  color: var(--paper-muted);
  font-size: 6px;
  margin-bottom: 8px;
}
.paper-rule {
  height: 1px;
  background: #a9b4c6;
  margin: 5px 0;
}
.index-row {
  display: grid;
  grid-template-columns: 10px minmax(0, 1fr) auto;
  align-items: center;
  gap: 3px;
  padding: 4px 0;
  border-bottom: 1px solid var(--paper-line);
  font-size: 6.5px;
  line-height: 1.2;
}
.index-row .n {
  color: var(--paper-muted);
  font-variant-numeric: tabular-nums;
}
.index-row span:nth-child(2) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.index-row span:last-child {
  font-variant-numeric: tabular-nums;
}
.paper-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 9px;
  font-size: 6px;
  color: var(--paper-muted);
}
.bookmark-tab {
  position: absolute;
  right: -1px;
  top: 16px;
  width: 7px;
  height: 16px;
  background: #3464d7;
  clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 78%, 0 100%);
}
.bundle-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 3px;
  padding: 8px 8px 9px;
  font-size: 8px;
  font-weight: 650;
}
.ready {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--good);
  white-space: nowrap;
}
.ready .icon {
  width: 11px;
  height: 11px;
}
.export-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  border-radius: 4px;
  color: var(--panel-active);
  background: var(--panel-selection);
  padding: 4px 5px;
  white-space: nowrap;
}
.export-chip .icon {
  width: 10px;
  height: 10px;
}
.workflow-caption {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  color: var(--left-muted);
  font-size: 10px;
  text-align: center;
  margin-top: 14px;
}
.workflow-caption .icon {
  width: 12px;
  height: 12px;
  color: var(--left-accent);
}
.icon {
  display: block;
  flex: none;
}
.paper-title {
  display: block;
}
.paper-index-label {
  margin-bottom: 2px;
  font-size: 7px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

@media (min-width: 901px) and (max-width: 1200px) {
  .stage-name {
    font-size: 10px;
    gap: 4px;
  }
  .stage-name > .icon {
    margin-right: 5px;
  }
  .window-title {
    padding-inline: 7px;
    font-size: 9px;
  }
  .window-title .icon {
    width: 11px;
    height: 11px;
  }
  .import-inner {
    padding-inline: 5px;
  }
  .file-row {
    gap: 4px;
  }
  .matter-body {
    padding-inline: 7px 12px;
  }
  .doc-row.nested {
    padding-left: 10px;
  }
  .paper-zone {
    padding-inline: 8px;
  }
  .paper {
    padding-inline: 7px;
  }
}

@media (min-width: 901px) and (max-height: 820px) {
  .workflow-header,
  .stage-strip {
    margin-bottom: 8px;
  }
  .visual {
    min-height: 218px;
  }
  .window-title {
    padding-block: 8px;
    min-height: 31px;
  }
  .file-row,
  .import-footer,
  .matter-footer,
  .bundle-status {
    padding-block: 6px;
  }
  .matter-body {
    padding-block: 9px 7px;
  }
  .matter-heading {
    margin-bottom: 8px;
  }
  .doc-row {
    padding-block: 5px;
  }
  .doc-row.doc-section {
    padding-block: 5px 3px;
  }
  .paper-zone {
    padding-block: 10px 8px;
    min-height: 151px;
  }
  .paper {
    padding-block: 9px 6px;
    min-height: 128px;
  }
  .index-row {
    padding-block: 3px;
  }
  .import-card {
    margin-top: 12px;
  }
  .bundle-card {
    margin-top: 19px;
  }
  .workflow-caption {
    margin-top: 8px;
  }
}

@media (max-width: 530px) {
  .stage-strip {
    display: none;
  }
  .visual {
    grid-template-columns: 1fr;
    gap: 12px;
    padding: 0;
    max-width: 360px;
    margin-inline: auto;
  }
  .import-card,
  .bundle-card {
    margin: 0;
  }
  .mini-window::before {
    display: block;
    padding: 8px 10px 0;
    background: var(--panel-head);
    color: var(--panel-active);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    content: attr(data-stage);
  }
  .window-title,
  .file-row,
  .doc-row {
    font-size: 11px;
  }
  .paper-zone {
    padding: 16px;
  }
  .paper-stack {
    max-width: 190px;
  }
  .paper {
    padding: 15px;
  }
  .paper-title {
    font-size: 15px;
  }
  .index-row {
    font-size: 8px;
  }
  .bundle-status {
    font-size: 10px;
    padding: 10px;
  }
}
</style>
