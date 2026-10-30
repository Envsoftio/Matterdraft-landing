<!-- Approved premium hero. Interaction hooks are owned by useLandingExperience(). -->
<template>
  <section
    class="v2-hero mdh-hero"
    aria-labelledby="hero-title"
    data-pen-name="Hero"
    data-mdh-root
    data-stage="validate"
    data-mdh-document="agreement"
  >
    <div class="mdh-atmosphere" aria-hidden="true">
      <div class="mdh-grid"></div>
      <svg class="mdh-fold" viewBox="0 0 1000 1000" fill="none">
        <path d="M1040 65 500 350v400l540-285M500 350 230 205v400l270 145M500 350 770 205v290" />
        <path d="M1080 120 540 405v400l540-285M540 405 270 260v400l270 145" />
      </svg>
      <span class="mdh-horizon"></span>
    </div>
    <div class="container mdh-canvas">
      <div class="mdh-copy">
        <p class="mdh-eyebrow"><span class="mdh-status-light" aria-hidden="true"></span>LOCAL-FIRST<span class="mdh-pill-divider"></span>LEGAL DOCUMENT WORKSPACE</p>
        <h1 id="hero-title">
          <span>Complex legal files.</span>
          <span>Structured in</span>
          <span class="mdh-headline-accent">one workspace.</span>
        </h1>
        <p class="mdh-description">Process, OCR and collate your documents. Automate pagination, indexes and bookmarks. Review and export a structured legal bundle.</p>
        <div class="mdh-actions">
          <a class="button mdh-primary" href="#early-access">Early access<span><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg></span></a>
          <a class="mdh-secondary" href="#workflow">Explore the workflow<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg></a>
        </div>
        <p class="mdh-offer">Early access signups get <strong>six months free after launch.</strong></p>
        <p class="mdh-survey">Advocate? <a href="https://forms.gle/oZ4ziNTZoQ3QWEoh6" target="_blank" rel="noopener noreferrer">Share your feedback in our advocate survey <span aria-hidden="true">↗</span></a></p>
        <div class="mdh-trust">
          <span><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="13" rx="2"/><path d="M8 21h8M12 16v5"/></svg>Windows + macOS</span>
          <i aria-hidden="true"></i>
          <span>Offline-first</span>
          <i aria-hidden="true"></i>
          <span>Local processing</span>
        </div>
      </div>
      <figure
        class="mdh-experience"
        aria-label="One MatterDraft workspace coordinating documents, references and review"
      >
        <div class="mdh-orbit-label"><span class="mdh-orbit-dot"></span>ONE MATTER. EVERY REFERENCE CONNECTED.</div>
        <div class="mdh-stage-light" aria-hidden="true"></div>
        <svg class="mdh-connectors" viewBox="0 0 840 760" fill="none" aria-hidden="true">
          <path class="mdh-connector-index" d="M641 244V280H558V311" />
          <path class="mdh-connector-bookmark" d="M289 533H246V649H215" />
          <path class="mdh-connector-validation" d="M718 527V577H711V618" />
          <circle cx="558" cy="311" r="3" />
          <circle cx="289" cy="533" r="3" />
          <circle cx="718" cy="527" r="3" />
        </svg>
        <div id="hero-workspace" class="mdh-workspace">
          <div
            class="product-shell mdh-app"
            data-document-demo
            data-pen-name="Product window / Coordinated matter workspace"
          >
            <div class="mdh-app-titlebar">
              <span class="mdh-window-dots" aria-hidden="true">
                <i></i>
                <i></i>
                <i></i>
              </span>
              <span>MatterDraft Studio</span>
              <span class="mdh-app-local"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="13" rx="2"/><path d="M8 21h8M12 16v5"/></svg>Local workspace</span>
            </div>
            <div class="mdh-app-matter">
              <span><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/></svg>Aster Works v. Banyan Projects</span>
              <small>MD-DEMO-026</small>
              <span class="mdh-app-tag">Fictional matter</span>
            </div>
            <div class="mdh-app-body">
              <aside class="mdh-app-sidebar" aria-label="Illustrative matter navigation">
                <div class="mdh-app-brand">
                  <BrandLogo class="preview-logo" />
                </div>
                <span class="mdh-ui-eyebrow">THIS MATTER</span>
                <div class="mdh-app-nav">
                  <div class="mdh-app-nav-item " data-mdh-area="matter">
                    <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M3 6a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
                    </svg>
                    <span>Matter</span>
                  </div>
                  <div class="mdh-app-nav-item is-current" data-mdh-area="documents">
                    <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M7 3h9l4 4v11H7zM16 3v5h4M4 7H2v15h13v-2M10 12h7M10 15h5" />
                    </svg>
                    <span>Documents</span>
                    <b>6</b>
                  </div>
                  <div class="mdh-app-nav-item " data-mdh-area="parts">
                    <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="m3 7 9-5 9 5-9 5-9-5Zm0 5 9 5 9-5M3 17l9 5 9-5" />
                    </svg>
                    <span>Parts</span>
                  </div>
                  <div class="mdh-app-nav-item " data-mdh-area="index">
                    <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M9 5h12M9 12h12M9 19h12M3 5h1M3 12h1M3 19h1" />
                    </svg>
                    <span>Index</span>
                  </div>
                  <div class="mdh-app-nav-item " data-mdh-area="bookmarks">
                    <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M6 3h12v18l-6-4-6 4V3Z" />
                    </svg>
                    <span>Bookmarks</span>
                  </div>
                  <div class="mdh-app-nav-item " data-mdh-area="validation">
                    <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                      <circle cx="12" cy="12" r="8.5" />
                      <path d="m8 12 3 3 5-6" />
                    </svg>
                    <span>Validation</span>
                  </div>
                  <div class="mdh-app-nav-item " data-mdh-area="volumes">
                    <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="m3 7 9-5 9 5-9 5-9-5Zm0 5 9 5 9-5M3 17l9 5 9-5" />
                    </svg>
                    <span>Volumes</span>
                  </div>
                  <div class="mdh-app-nav-item " data-mdh-area="export">
                    <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12 3v13m-5-5 5 5 5-5M4 17v4h16v-4" />
                    </svg>
                    <span>Export</span>
                  </div>
                </div>
                <div class="mdh-app-save"><i></i>Saved locally</div>
              </aside>
              <div class="mdh-document-panel" data-mdh-area="documents">
                <div class="mdh-document-head">
                  <strong>Documents <span>06</span></strong>
                  <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M7 3v18m-4-4 4 4 4-4M14 5h7M14 10h5M14 15h3" />
                  </svg>
                </div>
                <p class="mdh-doc-hint">Select a document to explore</p>
                <div class="mdh-doc-list">
                  <button
                    class="mdh-doc "
                    type="button"
                    data-document
                    data-doc-title="Petition"
                    data-doc-pages="1–18"
                    data-doc-index="PETITION"
                    aria-pressed="false"
                  >
                    <span class="mdh-doc-grip" aria-hidden="true">⠿</span>
                    <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Z" />
                      <path d="M14 3v6h6M8 13h8M8 17h5" />
                    </svg>
                    <span class="mdh-doc-copy">
                      <strong>Petition.pdf</strong>
                      <small>18 pages<span class="mdh-doc-category"> · Core documents</span></small>
                    </span>
                    <span class="mdh-doc-included" aria-hidden="true">
                      <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="m5 12 4 4L19 6" />
                      </svg>
                    </span>
                  </button>
                  <button
                    class="mdh-doc "
                    type="button"
                    data-document
                    data-doc-title="Affidavit"
                    data-doc-pages="19–42"
                    data-doc-index="AFFIDAVIT"
                    aria-pressed="false"
                  >
                    <span class="mdh-doc-grip" aria-hidden="true">⠿</span>
                    <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Z" />
                      <path d="M14 3v6h6M8 13h8M8 17h5" />
                    </svg>
                    <span class="mdh-doc-copy">
                      <strong>Affidavit.pdf</strong>
                      <small>24 pages<span class="mdh-doc-category"> · Core documents</span></small>
                    </span>
                    <span class="mdh-doc-included" aria-hidden="true">
                      <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="m5 12 4 4L19 6" />
                      </svg>
                    </span>
                  </button>
                  <button
                    class="mdh-doc active"
                    type="button"
                    data-document
                    data-doc-title="Agreement"
                    data-doc-pages="43–81"
                    data-doc-index="ANNEXURE A"
                    aria-pressed="true"
                  >
                    <span class="mdh-doc-grip" aria-hidden="true">⠿</span>
                    <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Z" />
                      <path d="M14 3v6h6M8 13h8M8 17h5" />
                    </svg>
                    <span class="mdh-doc-copy">
                      <strong>Agreement.pdf</strong>
                      <small>39 pages<span class="mdh-doc-category"> · Supporting documents</span></small>
                    </span>
                    <span class="mdh-doc-included" aria-hidden="true">
                      <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="m5 12 4 4L19 6" />
                      </svg>
                    </span>
                  </button>
                  <button
                    class="mdh-doc "
                    type="button"
                    data-document
                    data-doc-title="Correspondence"
                    data-doc-pages="82–108"
                    data-doc-index="CORRESPONDENCE"
                    aria-pressed="false"
                  >
                    <span class="mdh-doc-grip" aria-hidden="true">⠿</span>
                    <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Z" />
                      <path d="M14 3v6h6M8 13h8M8 17h5" />
                    </svg>
                    <span class="mdh-doc-copy">
                      <strong>Correspondence.pdf</strong>
                      <small>27 pages<span class="mdh-doc-category"> · Supporting documents</span></small>
                    </span>
                    <span class="mdh-doc-included" aria-hidden="true">
                      <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="m5 12 4 4L19 6" />
                      </svg>
                    </span>
                  </button>
                  <button
                    class="mdh-doc "
                    type="button"
                    data-document
                    data-doc-title="Evidence"
                    data-doc-pages="109–160"
                    data-doc-index="EVIDENCE"
                    aria-pressed="false"
                  >
                    <span class="mdh-doc-grip" aria-hidden="true">⠿</span>
                    <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Z" />
                      <path d="M14 3v6h6M8 13h8M8 17h5" />
                    </svg>
                    <span class="mdh-doc-copy">
                      <strong>Evidence.pdf</strong>
                      <small>52 pages<span class="mdh-doc-category"> · Evidence</span></small>
                    </span>
                    <span class="mdh-doc-included" aria-hidden="true">
                      <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="m5 12 4 4L19 6" />
                      </svg>
                    </span>
                  </button>
                  <button
                    class="mdh-doc "
                    type="button"
                    data-document
                    data-doc-title="Additional records"
                    data-doc-pages="161–196"
                    data-doc-index="RECORDS"
                    aria-pressed="false"
                  >
                    <span class="mdh-doc-grip" aria-hidden="true">⠿</span>
                    <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Z" />
                      <path d="M14 3v6h6M8 13h8M8 17h5" />
                    </svg>
                    <span class="mdh-doc-copy">
                      <strong>Additional records.pdf</strong>
                      <small>36 pages<span class="mdh-doc-category"> · Additional material</span></small>
                    </span>
                    <span class="mdh-doc-included" aria-hidden="true">
                      <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="m5 12 4 4L19 6" />
                      </svg>
                    </span>
                  </button>
                </div>
                <div class="mdh-document-total">
                  <span>6 included</span>
                  <strong>196 pages</strong>
                </div>
              </div>
              <div class="mdh-document-preview">
                <div class="mdh-preview-toolbar">
                  <span data-hero-page-count>Page 1 of 39</span>
                  <span>
                    <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M3 10a9 9 0 1 1 2 9M3 4v6h6" />
                    </svg>
                    <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M6 2v15a1 1 0 0 0 1 1h15M2 6h15a1 1 0 0 1 1 1v15" />
                    </svg>
                    <small>100%</small>
                  </span>
                </div>
                <div class="mdh-page-stage">
                  <div class="mdh-thumbnails" aria-label="Illustrative page thumbnails">
                    <span class="is-current">1</span>
                    <span>2</span>
                    <span>3</span>
                  </div>
                  <div class="mdh-paper" data-mdh-area="paper">
                    <div class="mdh-paper-rule"></div>
                    <p class="mdh-paper-kind" data-doc-index>ANNEXURE A</p>
                    <p class="mdh-paper-title" data-doc-title>Agreement</p>
                    <p class="mdh-paper-case">Aster Works v. Banyan Projects</p>
                    <p class="mdh-paper-text">Document record</p>
                    <div class="page-lines" aria-hidden="true">
                      <i></i>
                      <i></i>
                      <i></i>
                    </div>
                    <div class="mdh-paper-highlight"><span class="mdh-text-cursor" aria-hidden="true"></span>Searchable text in the<br>working copy.</div>
                    <div class="page-lines" aria-hidden="true">
                      <i></i>
                      <i></i>
                      <i></i>
                    </div>
                    <div class="mdh-paper-footer">
                      <span>BUNDLE PAGES</span>
                      <strong data-doc-pages>43–81</strong>
                    </div>
                  </div>
                </div>
                <div class="mdh-document-meta">
                  <div>
                    <span>Category</span>
                    <strong data-hero-category>Supporting documents</strong>
                  </div>
                  <div>
                    <span>Part / volume</span>
                    <strong><span data-hero-part>Part 2</span> · Volume 1</strong>
                  </div>
                  <div class="mdh-meta-bookmark">
                    <span>Bookmark</span>
                    <strong data-hero-bookmark>2a · Agreement</strong>
                  </div>
                </div>
              </div>
            </div>
            <div class="mdh-app-status">
              <span>
                <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8 3H3v5M16 3h5v5M21 16v5h-5M8 21H3v-5M6 12h12M8 8h8M8 16h5" />
                </svg>
                <span data-mdh-ocr-state>OCR complete</span>
              </span>
              <span>4 parts<span class="mdh-status-dot">·</span>196 numbered pages<span class="mdh-status-dot">·</span>Originals preserved</span>
            </div>
          </div>
        </div>
        <aside class="mdh-float mdh-index-panel" aria-label="Illustrative matter index">
          <div class="mdh-float-heading">
            <span class="mdh-float-icon">
              <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M9 5h12M9 12h12M9 19h12M3 5h1M3 12h1M3 19h1" />
              </svg>
            </span>
            <div>
              <p>LIVE REFERENCES</p>
              <strong data-mdh-index-state>Index updated</strong>
            </div>
            <span class="mdh-panel-check">
              <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="m5 12 4 4L19 6" />
              </svg>
            </span>
          </div>
          <div class="mdh-index-summary">
            <strong>196</strong>
            <span>pages mapped<br>6 document entries</span>
          </div>
          <div class="mdh-index-rows">
            <div class="mdh-index-row" data-index-document="petition">
              <span>Petition</span>
              <i></i>
              <b>1</b>
            </div>
            <div class="mdh-index-row" data-index-document="affidavit">
              <span>Affidavit</span>
              <i></i>
              <b>19</b>
            </div>
            <div class="mdh-index-row" data-index-document="agreement">
              <span>Agreement</span>
              <i></i>
              <b>43</b>
            </div>
            <div class="mdh-index-row" data-index-document="correspondence">
              <span>Correspondence</span>
              <i></i>
              <b>82</b>
            </div>
            <div class="mdh-index-row" data-index-document="evidence">
              <span>Evidence</span>
              <i></i>
              <b>109</b>
            </div>
            <div class="mdh-index-row" data-index-document="additional-records">
              <span>Additional records</span>
              <i></i>
              <b>161</b>
            </div>
          </div>
        </aside>
        <aside class="mdh-float mdh-bookmark-panel" aria-label="Illustrative bookmark hierarchy">
          <div class="mdh-float-heading">
            <span class="mdh-float-icon">
              <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 3h12v18l-6-4-6 4V3Z" />
              </svg>
            </span>
            <div>
              <p>DOCUMENT HIERARCHY</p>
              <strong data-mdh-bookmark-state>Bookmarks ready</strong>
            </div>
          </div>
          <div class="mdh-bookmark-rows">
            <span><b>1</b>Core documents</span>
            <span class="mdh-bookmark-child"><b>1a</b>Petition</span>
            <span class="mdh-bookmark-child"><b>1b</b>Affidavit</span>
            <span class="mdh-bookmark-selected">
              <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 3h12v18l-6-4-6 4V3Z" />
              </svg>
              <span data-mdh-selected-bookmark>2a · Agreement</span>
            </span>
          </div>
          <p class="mdh-panel-footnote">6 document entries across 4 groups</p>
        </aside>
        <aside class="mdh-float mdh-validation-panel" aria-label="Illustrative bundle checks">
          <div class="mdh-float-heading">
            <span class="mdh-float-icon">
              <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="8.5" />
                <path d="m8 12 3 3 5-6" />
              </svg>
            </span>
            <div>
              <p>BUNDLE CHECKS</p>
              <strong data-mdh-validation-state>3 items to review</strong>
            </div>
          </div>
          <div class="mdh-check-list">
            <span><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>Index generated</span>
            <span><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>Page ranges generated</span>
            <span class="mdh-check-warning"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 10 18H2L12 3ZM12 9v5M12 17v1"/></svg>3 items need review</span>
          </div>
        </aside>
      </figure>
      <div class="mdh-rail-wrap">
        <div class="mdh-rail-heading">
          <span>FROM SOURCE FILES TO STRUCTURED OUTPUT</span>
        </div>
        <ol class="mdh-workflow-rail" aria-label="Legal document workflow">
          <li class="mdh-stage">
            <span class="mdh-stage-node">
              <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 16V3m-5 5 5-5 5 5M4 16v5h16v-5" />
              </svg>
            </span>
            <span>Import</span>
          </li>
          <li class="mdh-stage">
            <span class="mdh-stage-node">
              <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8 3H3v5M16 3h5v5M21 16v5h-5M8 21H3v-5M6 12h12M8 8h8M8 16h5" />
              </svg>
            </span>
            <span>OCR</span>
          </li>
          <li class="mdh-stage">
            <span class="mdh-stage-node">
              <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3 6a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
              </svg>
            </span>
            <span>Organise</span>
          </li>
          <li class="mdh-stage">
            <span class="mdh-stage-node">
              <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="m3 7 9-5 9 5-9 5-9-5Zm0 5 9 5 9-5M3 17l9 5 9-5" />
              </svg>
            </span>
            <span>Collate</span>
          </li>
          <li class="mdh-stage">
            <span class="mdh-stage-node">
              <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M7 3h9l4 4v11H7zM16 3v5h4M4 7H2v15h13v-2M10 12h7M10 15h5" />
              </svg>
            </span>
            <span>Paginate</span>
          </li>
          <li class="mdh-stage">
            <span class="mdh-stage-node">
              <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M9 5h12M9 12h12M9 19h12M3 5h1M3 12h1M3 19h1" />
              </svg>
            </span>
            <span>Index</span>
          </li>
          <li class="mdh-stage">
            <span class="mdh-stage-node">
              <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="8.5" />
                <path d="m8 12 3 3 5-6" />
              </svg>
            </span>
            <span>Validate</span>
          </li>
          <li class="mdh-stage">
            <span class="mdh-stage-node">
              <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 3v13m-5-5 5 5 5-5M4 17v4h16v-4" />
              </svg>
            </span>
            <span>Export</span>
          </li>
        </ol>
      </div>
    </div>
  </section>
</template>
