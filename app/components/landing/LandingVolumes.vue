<!-- Approved section: Volume Splitting. -->
<template>
  <section class="volumes-section" id="volumes" data-pen-name="Volume Splitting">
    <div class="container">
      <div class="section-top" data-reveal>
        <div>
          <p class="section-index">08 / Document-aware volume splitting</p>
          <h2>A page target.<br>A sensible place to split.</h2>
        </div>
        <p class="lead">Aim for around 300 pages per volume while keeping each document intact. A document approaching the boundary moves into the next volume as a whole.</p>
      </div>
      <figure data-reveal>
        <div id="volume-visual">
          <div class="product-shell" id="volume-demo">
            <div class="volume-toolbar">
              <div>
                <div class="volume-input-icon">
                  <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M7 3h9l4 4v11H7zM16 3v5h4M4 7H2v15h13v-2M10 12h7M10 15h5" />
                  </svg>
                </div>
                <div>
                  <strong>864 document pages</strong>
                  <small>8 source documents → <span data-volume-count>3</span> structured volumes</small>
                </div>
              </div>
              <label class="volume-target-field" for="volume-target">Target per volume<select id="volume-target"><option value="150">150 pages</option><option value="200">200 pages</option><option value="300" selected>~300 pages</option><option value="450">450 pages</option></select></label>
            </div>
            <div class="volume-results" id="volume-results">
              <button type="button" class="volume-card" data-volume-select="1" aria-pressed="true">
                <strong class="volume-card-title">Volume 1</strong>
                <span class="volume-card-range">Pages 1–296</span>
                <span class="volume-card-count">296 pages · 4 documents</span>
                <span class="volume-doc-bar" aria-hidden="true">
                  <span style="flex:1"></span>
                  <span style="flex:2"></span>
                  <span style="flex:1"></span>
                </span>
                <span class="volume-index-label">Individual index generated</span>
              </button>
              <button type="button" class="volume-card" data-volume-select="2" aria-pressed="false">
                <strong class="volume-card-title">Volume 2</strong>
                <span class="volume-card-range">Pages 297–591</span>
                <span class="volume-card-count">295 pages · 2 documents</span>
                <span class="volume-doc-bar" aria-hidden="true">
                  <span style="flex:1"></span>
                  <span style="flex:2"></span>
                  <span style="flex:1"></span>
                </span>
                <span class="volume-index-label">Individual index generated</span>
              </button>
              <button type="button" class="volume-card" data-volume-select="3" aria-pressed="false">
                <strong class="volume-card-title">Volume 3</strong>
                <span class="volume-card-range">Pages 592–864</span>
                <span class="volume-card-count">273 pages · 2 documents</span>
                <span class="volume-doc-bar" aria-hidden="true">
                  <span style="flex:1"></span>
                  <span style="flex:2"></span>
                  <span style="flex:1"></span>
                </span>
                <span class="volume-index-label">Individual index generated</span>
              </button>
            </div>
            <div class="boundary-note">
              <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z" />
                <path d="m8 11 3 3 5-5" />
              </svg>
              <span data-volume-boundary-note>Volume 1 leaves 4 pages below the target. The 125-page Correspondence document starts intact in Volume 2.</span>
            </div>
            <div class="volume-index">
              <div>
                <span class="badge badge-blue">Per-volume index</span>
                <h3>Volume <span data-volume-selected>1</span></h3>
                <p>Each volume receives its own index. Global bundle numbering remains visible alongside the page position within that volume.</p>
              </div>
              <div class="table-wrap">
                <table class="data-table ">
                  <thead>
                    <tr>
                      <th scope="col">No.</th>
                      <th scope="col">Document</th>
                      <th scope="col">Bundle pages</th>
                      <th scope="col">Volume pages</th>
                    </tr>
                  </thead>
                  <tbody id="volume-index-body">
                    <tr>
                      <td>1</td>
                      <td>Petition</td>
                      <td>1–18</td>
                      <td>1–18</td>
                    </tr>
                    <tr>
                      <td>2</td>
                      <td>Affidavit</td>
                      <td>19–42</td>
                      <td>19–42</td>
                    </tr>
                    <tr>
                      <td>3</td>
                      <td>Procedural applications</td>
                      <td>43–102</td>
                      <td>43–102</td>
                    </tr>
                    <tr>
                      <td>4</td>
                      <td>Medical records</td>
                      <td>103–296</td>
                      <td>103–296</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        <figcaption class="figure-meta">
          <span>Separate fictional large-matter example · Select a target or volume to inspect the result.</span>
          <button
            type="button"
            class="zoom-button"
            aria-label="Enlarge product view"
            data-enlarge="volume-visual"
            data-title="Document-aware volumes and per-volume indexes"
          ><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3H3v6M15 3h6v6M21 15v6h-6M9 21H3v-6M3 3l6 6M21 3l-6 6M21 21l-6-6M3 21l6-6"/></svg></button>
        </figcaption>
      </figure>
      <div class="volume-notes" data-reveal>
        <p>These are numbered document-page ranges. Covers and per-volume indexes can add physical PDF pages. In this example, a document larger than the target remains intact and is flagged for review.</p>
        <p class="volume-status" id="volume-status" role="status">Three volumes. All eight documents preserved.</p>
      </div>
    </div>
  </section>
</template>
