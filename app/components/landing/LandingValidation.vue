<!-- Approved section: Validation. -->
<template>
  <section class="validation-section" data-pen-name="Validation">
    <div class="container split">
      <div class="split-copy" data-reveal>
        <p class="section-index">09 / Rule-based pre-export checks</p>
        <h2>Find what needs<br>a second look.</h2>
        <p class="lead">Check the structure across document categories. Bring missing dates, unassigned categories and numbering issues into view before export.</p>
        <p class="validation-note"><strong>Production checks, with a human review.</strong><br>Validation helps inspect fields and document structure. It does not certify legal correctness or court compliance.</p>
      </div>
      <figure data-reveal>
        <div id="validation-visual">
          <div class="product-shell" id="validation-demo">
            <div class="validation-summary">
              <h3><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="m8 12 3 3 5-6"/></svg>Bundle validation</h3>
              <span class="badge badge-amber"><span data-validation-count>3</span> items to inspect</span>
            </div>
            <ul class="validation-list" id="validation-list">
              <li class="validation-row is-pass">
                <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="8.5" />
                  <path d="m8 12 3 3 5-6" />
                </svg>
                <span class="validation-copy">
                  <strong>Index generated</strong>
                  <small>Page references are present.</small>
                </span>
              </li>
              <li class="validation-row is-pass">
                <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="8.5" />
                  <path d="m8 12 3 3 5-6" />
                </svg>
                <span class="validation-copy">
                  <strong>Bookmarks generated</strong>
                  <small>Document hierarchy is available.</small>
                </span>
              </li>
              <li class="validation-row is-pass">
                <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="8.5" />
                  <path d="m8 12 3 3 5-6" />
                </svg>
                <span class="validation-copy">
                  <strong>Required category groups present</strong>
                  <small>The four-part structure is in place.</small>
                </span>
              </li>
              <li class="validation-row is-pass">
                <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="8.5" />
                  <path d="m8 12 3 3 5-6" />
                </svg>
                <span class="validation-copy">
                  <strong>Volume boundaries checked</strong>
                  <small>Documents remain intact.</small>
                </span>
              </li>
              <li class="validation-row is-warning">
                <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="m12 3 10 18H2L12 3ZM12 9v5M12 17v1" />
                </svg>
                <span class="validation-copy">
                  <strong>Missing date: Affidavit</strong>
                  <small>Provide the document date.</small>
                </span>
              </li>
              <li class="validation-row is-warning">
                <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="m12 3 10 18H2L12 3ZM12 9v5M12 17v1" />
                </svg>
                <span class="validation-copy">
                  <strong>Document category not assigned</strong>
                  <small>Assign the supporting evidence.</small>
                </span>
              </li>
              <li class="validation-row is-warning">
                <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="m12 3 10 18H2L12 3ZM12 9v5M12 17v1" />
                </svg>
                <span class="validation-copy">
                  <strong>Page numbering requires review</strong>
                  <small>Review ranges after a document change.</small>
                </span>
              </li>
            </ul>
            <div class="validation-actions">
              <button type="button" id="validation-date-fix">Add missing date</button>
              <button type="button" id="validation-category-fix">Assign category</button>
              <button type="button" id="validation-pagination-fix">Review numbering</button>
              <button type="button" id="validation-reset">Reset</button>
            </div>
            <p class="validation-status" id="validation-status" role="status">Resolve the three findings to see this illustrative review update.</p>
          </div>
        </div>
        <figcaption class="figure-meta">
          <span>Interactive rule-based check illustration.</span>
          <button
            type="button"
            class="zoom-button"
            data-enlarge="validation-visual"
            data-title="Rule-based bundle validation"
          ><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3H3v6M15 3h6v6M21 15v6h-6M9 21H3v-6M3 3l6 6M21 3l-6 6M21 21l-6-6M3 21l6-6"/></svg>Enlarge view</button>
        </figcaption>
      </figure>
    </div>
  </section>
</template>
