<!-- Approved section: PDF Engine. -->
<template>
  <section class="engine-section" id="pdf-engine" data-pen-name="PDF Engine">
    <div class="container">
      <div class="section-top" data-reveal>
        <div>
          <p class="section-index">03 / A complete PDF processing engine</p>
          <h2>Work on the pages.<br>Keep the matter in view.</h2>
        </div>
        <p class="lead">Merge, split, extract, reorder, replace, insert and delete. Refine the source material before it becomes part of the final legal bundle.</p>
      </div>
      <figure data-reveal>
        <div id="engine-visual">
          <div class="product-shell">
            <div class="window-top">
              <span class="window-controls" aria-hidden="true">
                <i></i>
                <i></i>
                <i></i>
              </span>
              <span class="window-name">Document workspace / Working copy</span>
              <span class="micro">Illustrative workspace</span>
            </div>
            <div class="engine-commands">
              <strong>DOCUMENT</strong>
              <span>Merge</span>
              <span>Split</span>
              <span>Extract</span>
              <span>Reorder</span>
              <span>Replace</span>
              <span>Insert</span>
              <span>Delete</span>
              <i class="command-sep"></i>
              <strong>PAGE</strong>
              <span>Insert before / after</span>
              <span>Replace page</span>
              <span>Delete page</span>
            </div>
            <div class="engine-tabs" aria-label="Illustrative PDF tools">
              <button class="engine-tool" type="button" id="pdf-rotate" aria-pressed="false"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10a9 9 0 1 1 2 9M3 4v6h6"/></svg>Rotate</button>
              <button class="engine-tool" type="button" id="pdf-crop" aria-pressed="false"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 2v15a1 1 0 0 0 1 1h15M2 6h15a1 1 0 0 1 1 1v15"/></svg>Crop</button>
              <button class="engine-tool" type="button" id="pdf-highlight" aria-pressed="false"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m14 4 6 6M3 21l5-1L21 7a2 2 0 0 0 0-3l-1-1a2 2 0 0 0-3 0L4 16l-1 5Z"/></svg>Highlight</button>
              <button class="engine-tool" type="button" id="pdf-comment" aria-pressed="false"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16v12H9l-5 5V4Z"/><path d="M8 8h8M8 12h5"/></svg>Comment</button>
              <button class="engine-tool" type="button" id="pdf-redact" aria-pressed="false"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="5" rx="1" fill="currentColor"/><path d="M3 14h18M3 19h13"/></svg>Redact</button>
              <button class="engine-tool reset" type="button" id="pdf-reset"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 7a9 9 0 0 0-15-2L2 8m0-5v5h5M4 17a9 9 0 0 0 15 2l3-3m0 5v-5h-5"/></svg>Reset example</button>
            </div>
            <div class="engine-body">
              <aside class="engine-thumbs" aria-label="Illustrative PDF page navigation">
                <div class="engine-thumb active">
                  <div class="page-lines" aria-hidden="true">
                    <i></i>
                    <i></i>
                    <i></i>
                    <i></i>
                    <i></i>
                  </div>
                  <span>1</span>
                </div>
                <div class="engine-thumb ">
                  <div class="page-lines" aria-hidden="true">
                    <i></i>
                    <i></i>
                    <i></i>
                    <i></i>
                    <i></i>
                  </div>
                  <span>2</span>
                </div>
                <div class="engine-thumb ">
                  <div class="page-lines" aria-hidden="true">
                    <i></i>
                    <i></i>
                    <i></i>
                    <i></i>
                    <i></i>
                  </div>
                  <span>3</span>
                </div>
              </aside>
              <div class="engine-canvas">
                <div class="engine-paper" id="pdf-paper">
                  <p class="paper-category">ANNEXURE A / WORKING COPY</p>
                  <p class="ui-heading">Agreement</p>
                  <p class="paper-subtitle">Aster Works v. Banyan Projects<br>Fictional document · Source page 1</p>
                  <p class="engine-paragraph">The records in this section relate to the <span class="engine-highlight">agreement between the parties</span>. Review the document before adding it to the final bundle.</p>
                  <p class="engine-paragraph">Reference: <span class="redaction">MD-DEMO-026</span><br>Document category: Supporting documents</p>
                  <div class="page-lines" aria-hidden="true">
                    <i></i>
                    <i></i>
                    <i></i>
                    <i></i>
                  </div>
                  <div class="engine-comment" id="pdf-comment-marker" hidden>Review this clause</div>
                  <div class="paper-footer">
                    <span>IMPORTED ORIGINAL PRESERVED</span>
                    <span>43</span>
                  </div>
                </div>
              </div>
              <aside class="engine-inspector">
                <h3><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16M4 12h16M4 19h16M8 2v6M16 9v6M10 16v6"/></svg>Editing layer</h3>
                <div class="inspector-group">
                  <p class="micro">Page content</p>
                  <div class="tool-list">
                    <span><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16M12 4v17M8 21h8"/></svg>OCR-based editable text</span>
                    <span><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16M12 4v17M8 21h8"/></svg>Text insertion</span>
                    <span><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8" r="2"/><path d="m3 17 6-6 4 4 3-3 5 5"/></svg>Images</span>
                    <span><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m14 4 6 6M3 21l5-1L21 7a2 2 0 0 0 0-3l-1-1a2 2 0 0 0-3 0L4 16l-1 5Z"/></svg>Highlights & annotations</span>
                    <span><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16v12H9l-5 5V4Z"/><path d="M8 8h8M8 12h5"/></svg>Comments</span>
                    <span><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m10 13 4-4M8 16l-2 2a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0M13 8l2-2a4 4 0 0 1 6 6l-5 5a4 4 0 0 1-6 0" transform="translate(1 -1)"/></svg>Links</span>
                  </div>
                </div>
                <div class="inspector-group">
                  <p class="micro">Document operations</p>
                  <div class="tool-list">
                    <span><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3v18m-4-4 4 4 4-4M14 5h7M14 10h5M14 15h3"/></svg>Page navigation &amp; reordering</span>
                    <span><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h9l4 4v11H7zM16 3v5h4M4 7H2v15h13v-2M10 12h7M10 15h5"/></svg>Merge, split and extract</span>
                    <span><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8" r="2"/><path d="m3 17 6-6 4 4 3-3 5 5"/></svg>Insert or replace pages</span>
                  </div>
                </div>
                <span class="badge badge-blue">Working-copy edits</span>
              </aside>
            </div>
            <div class="engine-bottom">
              <span id="pdf-tool-status" role="status">Choose a tool to explore this fictional page.</span>
              <span>Page 1 of 39 · Zoom 100%</span>
            </div>
          </div>
        </div>
        <!-- <figcaption class="figure-meta">
          <span>Interactive illustration · This page does not process or redact your own files.</span>
        </figcaption> -->
      </figure>
      <div class="engine-support">
        <p><strong>Bring different source formats together.</strong>Work with PDFs, Word documents and images. Convert images and documents to PDF within the preparation workflow.</p>
        <p><strong>Prepare the output you need.</strong>Compress PDFs and use PDF conversion where supported. Review conversion results before including them in the bundle.</p>
      </div>
    </div>
  </section>
</template>
