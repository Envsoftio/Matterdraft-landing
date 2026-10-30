<!-- Approved section: Document Generation. -->
<template>
  <section class="generation-section" data-pen-name="Document Generation">
    <div class="container">
      <div class="section-top" data-reveal>
        <div>
          <p class="section-index">06 / Legal documents from structured templates</p>
          <h2>The matter supplies the fields.<br>The template gives them form.</h2>
        </div>
        <p class="lead">Select a category and subcategory, complete the relevant fields and generate a formatted document from the chosen template.</p>
      </div>
      <figure data-reveal>
        <div id="generation-visual">
          <div class="product-shell">
            <div class="window-top">
              <span class="window-controls" aria-hidden="true">
                <i></i>
                <i></i>
                <i></i>
              </span>
              <span class="window-name">Generated documents / Template-driven workflow</span>
              <span class="micro">Illustrative workspace</span>
            </div>
            <div class="generation-shell">
              <form id="generation-form" class="generation-form">
                <div class="generation-form-head">
                  <span>Document details</span>
                  <span class="badge badge-blue">Fictional matter</span>
                </div>
                <div class="generation-grid">
                  <div class="generation-field">
                    <label for="generation-category">Category</label>
                    <select id="generation-category" name="category">
                      <option data-subcategories="Procedural Application|Supporting Application">Application</option>
                      <option data-subcategories="Supporting Affidavit|Supplementary Affidavit">Affidavit</option>
                      <option data-subcategories="Document Schedule|Record Summary">Supporting record</option>
                    </select>
                  </div>
                  <div class="generation-field">
                    <label for="generation-subcategory">Subcategory</label>
                    <select id="generation-subcategory" name="subcategory">
                      <option>Procedural Application</option>
                      <option>Supporting Application</option>
                    </select>
                  </div>
                  <div class="generation-field">
                    <label for="gen-applicant">Applicant</label>
                    <input
                      id="gen-applicant"
                      name="applicant"
                      type="text"
                      value="Aster Works"
                      required
                      maxlength="120"
                      autocomplete="off"
                    >
                  </div>
                  <div class="generation-field">
                    <label for="gen-respondent">Respondent</label>
                    <input
                      id="gen-respondent"
                      name="respondent"
                      type="text"
                      value="Banyan Projects"
                      required
                      maxlength="120"
                      autocomplete="off"
                    >
                  </div>
                  <div class="generation-field">
                    <label for="gen-court">Court</label>
                    <input
                      id="gen-court"
                      name="court"
                      type="text"
                      value="Example District Court"
                      required
                      maxlength="120"
                      autocomplete="off"
                    >
                  </div>
                  <div class="generation-field">
                    <label for="gen-matterNumber">Matter number</label>
                    <input
                      id="gen-matterNumber"
                      name="matterNumber"
                      type="text"
                      value="DEMO / 026 / 2026"
                      required
                      maxlength="120"
                      autocomplete="off"
                    >
                  </div>
                  <div class="generation-field">
                    <label for="gen-date">Date</label>
                    <input
                      id="gen-date"
                      name="date"
                      type="date"
                      value="2026-03-18"
                      required
                      maxlength="120"
                      autocomplete="off"
                    >
                  </div>
                  <div class="generation-field">
                    <label for="gen-documentType">Document type</label>
                    <input
                      id="gen-documentType"
                      name="documentType"
                      type="text"
                      value="Procedural Application"
                      required
                      maxlength="120"
                      autocomplete="off"
                    >
                  </div>
                  <div class="generation-field full" data-generation-field="Affidavit" hidden>
                    <label for="gen-deponent">Deponent</label>
                    <input
                      id="gen-deponent"
                      name="deponent"
                      value="Example representative"
                      maxlength="120"
                      required
                      disabled
                      autocomplete="off"
                    >
                  </div>
                  <div class="generation-field full" data-generation-field="Supporting record" hidden>
                    <label for="gen-documentReference">Document reference</label>
                    <input
                      id="gen-documentReference"
                      name="documentReference"
                      value="MD-DEMO-026 / SR-01"
                      maxlength="120"
                      required
                      disabled
                      autocomplete="off"
                    >
                  </div>
                </div>
                <button type="submit" class="button">Generate template preview<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg></button>
                <p class="generation-form-note">This demonstration fills a template from the fields shown. It does not generate legal arguments or create a downloadable document.</p>
                <p id="generation-status" class="generation-status" role="status">Edit a field and generate the preview.</p>
              </form>
              <div class="generation-preview" id="generation-preview" data-generated="true">
                <div class="generated-paper">
                  <p class="paper-category">
                    <span data-generated="court">Example District Court</span>
                  </p>
                  <h3 data-generated="documentType">Procedural Application</h3>
                  <p class="paper-subtitle"><span data-generated="category">Application</span> / <span data-generated="subcategory">Procedural Application</span></p>
                  <div class="generated-meta">
                    <div>
                      <span>Applicant</span>
                      <strong data-generated="applicant">Aster Works</strong>
                    </div>
                    <div>
                      <span>Respondent</span>
                      <strong data-generated="respondent">Banyan Projects</strong>
                    </div>
                    <div>
                      <span>Matter number</span>
                      <strong data-generated="matterNumber">DEMO / 026 / 2026</strong>
                    </div>
                    <div>
                      <span>Date</span>
                      <strong data-generated="date">18 Mar 2026</strong>
                    </div>
                    <div data-generation-output="Affidavit" hidden>
                      <span>Deponent</span>
                      <strong data-generated="deponent">Example representative</strong>
                    </div>
                    <div data-generation-output="Supporting record" hidden>
                      <span>Document reference</span>
                      <strong data-generated="documentReference">MD-DEMO-026 / SR-01</strong>
                    </div>
                  </div>
                  <p class="template-content">The selected matter details have been placed into this illustrative document layout. Review the template and complete the required document content before use.</p>
                  <div class="page-lines" aria-hidden="true">
                    <i></i>
                    <i></i>
                    <i></i>
                  </div>
                  <div class="paper-footer">
                    <span>TEMPLATE-DRIVEN DOCUMENT PREVIEW</span>
                    <span>01</span>
                  </div>
                </div>
                <div class="generation-output-tags">
                  <span>Formatted document</span>
                  <span>Supporting files</span>
                  <span>Structured ZIP</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <figcaption class="figure-meta">
          <span>Fictional form and template · No generative legal drafting.</span>
        </figcaption>
      </figure>
      <div class="flow-strip">
        <span>Matter</span>
        <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="m9 5 7 7-7 7" />
        </svg>
        <span>Category</span>
        <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="m9 5 7 7-7 7" />
        </svg>
        <span>Subcategory</span>
        <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="m9 5 7 7-7 7" />
        </svg>
        <span>Dynamic form</span>
        <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="m9 5 7 7-7 7" />
        </svg>
        <span>Template</span>
        <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="m9 5 7 7-7 7" />
        </svg>
        <span>Generated document</span>
      </div>
    </div>
  </section>
</template>
