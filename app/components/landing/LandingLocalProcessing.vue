<!-- Approved section: Local Processing. -->
<template>
  <section class="local-v2" id="local-processing" data-pen-name="Local Processing">
    <div class="container split">
      <div class="split-copy" data-reveal>
        <p class="section-index">10 / Local-first by design</p>
        <h2>Serious document work.<br>On your own computer.</h2>
        <p class="lead">MatterDraft is designed as an offline-first desktop workspace for Windows and macOS. Its architecture keeps core processing local and separates the interface from the processing engine.</p>
        <div class="source-flow">
          <span><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z"/><path d="m8 11 3 3 5-5"/></svg>Originals preserved</span>
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 12h15M13 6l6 6-6 6" />
          </svg>
          <span>Working copies</span>
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 12h15M13 6l6 6-6 6" />
          </svg>
          <span>Generated outputs</span>
        </div>
        <p class="local-qualifier">Connected features, such as sharing links, sit outside the offline document workflow. Offline-first does not mean every feature works without a connection.</p>
        <details class="technical-details">
          <summary>Under the desktop workspace</summary>
          <p>Tauri with Vue and TypeScript provides the desktop interface. A Python FastAPI sidecar supports local processing with PyMuPDF and Tesseract OCR, connected through a secure IPC bridge.</p>
        </details>
      </div>
      <div class="architecture-board" data-reveal>
        <div class="architecture-heading">
          <span>Local processing architecture</span>
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3" y="3" width="18" height="13" rx="2" />
            <path d="M8 21h8M12 16v5" />
          </svg>
        </div>
        <div class="arch-layer">
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3" y="3" width="18" height="13" rx="2" />
            <path d="M8 21h8M12 16v5" />
          </svg>
          <div>
            <strong>MatterDraft desktop UI</strong>
            <span>Your matter, documents and workspace</span>
          </div>
          <span class="micro">DESKTOP</span>
        </div>
        <div class="arch-layer">
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="m10 13 4-4M8 16l-2 2a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0M13 8l2-2a4 4 0 0 1 6 6l-5 5a4 4 0 0 1-6 0"
              transform="translate(1 -1)"
            />
          </svg>
          <div>
            <strong>Secure IPC bridge</strong>
            <span>A defined path between interface and processing</span>
          </div>
          <span class="micro">IPC</span>
        </div>
        <div class="arch-layer">
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 5h16M4 12h16M4 19h16M8 2v6M16 9v6M10 16v6" />
          </svg>
          <div>
            <strong>Local processing engine</strong>
            <span>PDF operations, OCR and structured workflows</span>
          </div>
          <span class="micro">LOCAL ENGINE</span>
        </div>
        <div class="arch-layer">
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 6a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
          </svg>
          <div>
            <strong>Local files</strong>
            <span>Originals, working copies and generated outputs</span>
          </div>
          <span class="micro">FILES</span>
        </div>
        <p>Core document work is designed to run on the desktop, from imported source files to structured final outputs.</p>
      </div>
    </div>
  </section>
</template>
