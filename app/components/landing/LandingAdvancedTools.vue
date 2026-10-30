<!-- Approved section: Advanced Tools. -->
<template>
  <section class="advanced-section" data-pen-name="Advanced Tools">
    <div class="container advanced-layout">
      <div data-reveal>
        <p class="section-index">05 / Production tools, together</p>
        <h2>The finishing details<br>are part of the job.</h2>
        <p class="lead">Apply protection, presentation and review tools within the same document workspace.</p>
      </div>
      <div class="advanced-toolbar" data-reveal>
        <div class="advanced-tools" role="tablist" aria-label="Advanced document tools">
          <button
            class="advanced-tool"
            type="button"
            role="tab"
            data-advanced-tool="0"
            id="advanced-tab-0"
            aria-controls="advanced-details"
            aria-selected="true"
            tabindex="0"
          ><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/></svg>Password</button>
          <button
            class="advanced-tool"
            type="button"
            role="tab"
            data-advanced-tool="1"
            id="advanced-tab-1"
            aria-controls="advanced-details"
            aria-selected="false"
            tabindex="-1"
          ><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="5" rx="1" fill="currentColor"/><path d="M3 14h18M3 19h13"/></svg>Redaction</button>
          <button
            class="advanced-tool"
            type="button"
            role="tab"
            data-advanced-tool="2"
            id="advanced-tab-2"
            aria-controls="advanced-details"
            aria-selected="false"
            tabindex="-1"
          ><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m14 4 6 6M3 21l5-1L21 7a2 2 0 0 0 0-3l-1-1a2 2 0 0 0-3 0L4 16l-1 5ZM10 21h12"/></svg>E-signature</button>
          <button
            class="advanced-tool"
            type="button"
            role="tab"
            data-advanced-tool="3"
            id="advanced-tab-3"
            aria-controls="advanced-details"
            aria-selected="false"
            tabindex="-1"
          ><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Z"/><path d="M14 3v6h6M8 13h8M8 17h5"/></svg>Watermark</button>
          <button
            class="advanced-tool"
            type="button"
            role="tab"
            data-advanced-tool="4"
            id="advanced-tab-4"
            aria-controls="advanced-details"
            aria-selected="false"
            tabindex="-1"
          ><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v6l4 2"/></svg>Timestamp</button>
          <button
            class="advanced-tool"
            type="button"
            role="tab"
            data-advanced-tool="5"
            id="advanced-tab-5"
            aria-controls="advanced-details"
            aria-selected="false"
            tabindex="-1"
          ><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5h12M9 12h12M9 19h12M3 5h1M3 12h1M3 19h1"/></svg>Pagination</button>
          <button
            class="advanced-tool"
            type="button"
            role="tab"
            data-advanced-tool="6"
            id="advanced-tab-6"
            aria-controls="advanced-details"
            aria-selected="false"
            tabindex="-1"
          ><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H3v5M16 3h5v5M21 16v5h-5M8 21H3v-5M6 12h12M8 8h8M8 16h5"/></svg>Scan / OCR</button>
          <button
            class="advanced-tool"
            type="button"
            role="tab"
            data-advanced-tool="7"
            id="advanced-tab-7"
            aria-controls="advanced-details"
            aria-selected="false"
            tabindex="-1"
          ><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16v12H9l-5 5V4Z"/><path d="M8 8h8M8 12h5"/></svg>Annotations</button>
        </div>
        <div
          class="advanced-tool-details"
          id="advanced-details"
          role="tabpanel"
          aria-labelledby="advanced-tab-0"
          tabindex="0"
        >
          <div class="advanced-icon-preview" id="advanced-icon">
            <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
              <rect x="5" y="10" width="14" height="11" rx="2" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" />
            </svg>
          </div>
          <div>
            <strong id="advanced-title">Password protection</strong>
            <p id="advanced-description">Apply document password protection as part of preparing the final output.</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
