<!-- Approved section: OCR. -->
<template>
  <section class="ocr-section" data-pen-name="OCR">
    <div class="container split">
      <div class="split-copy" data-reveal>
        <p class="section-index">04 / Scans belong in the workflow</p>
        <h2>Turn scanned pages<br>into usable content.</h2>
        <p class="lead">Recognise text, review it and edit the working copy. OCR feeds the same organisation, pagination, indexing and bundling process.</p>
        <div class="ocr-steps" aria-label="OCR workflow">
          <span>Scan</span>
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="m9 5 7 7-7 7" />
          </svg>
          <span>Recognise</span>
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="m9 5 7 7-7 7" />
          </svg>
          <span>Review &amp; edit</span>
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="m9 5 7 7-7 7" />
          </svg>
          <span>Structure &amp; bundle</span>
        </div>
        <p class="local-note">Text recognition supports document preparation. It does not generate legal content.</p>
      </div>
      <figure data-reveal>
        <div id="ocr-visual">
          <div class="product-shell" id="ocr-demo">
            <div class="prep-topbar">
              <span><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H3v5M16 3h5v5M21 16v5h-5M8 21H3v-5M6 12h12M8 8h8M8 16h5"/></svg>Scan &amp; OCR workflow</span>
              <span class="badge badge-grey">Illustrative example</span>
            </div>
            <div class="ocr-stage">
              <div class="ocr-sheet scanned">
                <p class="micro">01 / Scanned page</p>
                <h3>Supporting record</h3>
                <p>Aster Works v. Banyan Projects<br>Document reference: MD-DEMO-026<br>Original record for preparation.</p>
                <div class="page-lines" aria-hidden="true">
                  <i></i>
                  <i></i>
                  <i></i>
                  <i></i>
                </div>
                <span class="ocr-status"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z"/><path d="m8 11 3 3 5-5"/></svg>Original preserved</span>
              </div>
              <div class="ocr-sheet editable">
                <p class="micro">02 / Searchable working copy</p>
                <h3>Recognised text</h3>
                <div
                  class="ocr-text"
                  id="ocr-editable"
                  role="textbox"
                  aria-label="Illustrative recognised text"
                  aria-multiline="true"
                  contenteditable="false"
                  tabindex="0"
                >Aster Works v. Banyan Projects<br>Document reference: MD-DEMO-026<br>Original record for preparation.</div>
                <span class="ocr-status" id="ocr-step-status"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H3v5M16 3h5v5M21 16v5h-5M8 21H3v-5M6 12h12M8 8h8M8 16h5"/></svg>Ready for the OCR example</span>
              </div>
            </div>
            <div class="ocr-progress" aria-hidden="true">
              <i></i>
            </div>
            <div class="ocr-control">
              <p>Run the example, then edit the recognised text.</p>
              <button class="button button-small" id="ocr-run" type="button">
                <span data-toggle-label>Run OCR example</span>
                <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8 3H3v5M16 3h5v5M21 16v5h-5M8 21H3v-5M6 12h12M8 8h8M8 16h5" />
                </svg>
              </button>
            </div>
            <p class="sr-only" id="ocr-live-status" role="status"></p>
          </div>
        </div>
        <figcaption class="figure-meta">
          <span>OCR illustration · Review recognised text before use.</span>
        </figcaption>
      </figure>
    </div>
  </section>
</template>
