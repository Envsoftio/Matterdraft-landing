<!-- Demo requests default to local copy mode. Product dialog retains the original hooks. -->
<template>
  <dialog
    id="demo-dialog"
    class="demo-dialog"
    aria-labelledby="demo-title"
    aria-describedby="demo-intro"
    data-pen-name="Dialog / Request a demo"
  >
    <div class="dialog-inner">
      <div class="dialog-heading">
        <div>
          <p class="eyebrow">MatterDraft Studio</p>
          <h2 id="demo-title">Request a demo</h2>
        </div>
        <button type="button" class="close-dialog" data-close-dialog aria-label="Close demo request">
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>
      </div>
      <p class="dialog-intro" id="demo-intro">Tell us about your team and the legal document workflows you want to explore.</p>
      <p class="form-preview-notice" id="form-preview-notice">
        <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v6M12 7v1" />
        </svg>
        <span>This page is not connected to demo bookings. You can prepare and copy a request here; your details will not be sent.</span>
      </p>
      <form class="demo-form" id="demo-form">
        <div class="form-field">
          <label for="demo-name">Name</label>
          <input
            id="demo-name"
            name="name"
            autocomplete="name"
            maxlength="120"
            required
            placeholder="Your name"
          >
        </div>
        <div class="form-field">
          <label for="demo-email">Email</label>
          <input
            id="demo-email"
            name="email"
            type="email"
            autocomplete="email"
            maxlength="254"
            required
            placeholder="you@yourpractice.com"
          >
        </div>
        <div class="form-field">
          <label for="demo-organisation">Practice or team <span class="optional">(optional)</span></label>
          <input
            id="demo-organisation"
            name="organisation"
            autocomplete="organization"
            maxlength="160"
            placeholder="Practice or team name"
          >
        </div>
        <div class="form-field">
          <label for="demo-workflow">What do you usually prepare? <span class="optional">(optional)</span></label>
          <textarea
            id="demo-workflow"
            name="workflow"
            maxlength="1500"
            placeholder="Tell us about your document bundles."
          ></textarea>
        </div>
        <button class="button" type="submit" id="demo-submit">Copy demo request</button>
        <p class="form-status" id="form-status" role="status" aria-live="polite"></p>
        <label class="sr-only" for="request-copy">Prepared demo request — copy this text</label>
        <textarea class="request-copy" id="request-copy" readonly hidden></textarea>
      </form>
    </div>
  </dialog>
  <dialog id="screen-dialog" class="screen-dialog" aria-labelledby="screen-title">
    <div class="screen-dialog-head">
      <h2 id="screen-title">Product workspace</h2>
      <button type="button" class="close-dialog" data-close-dialog aria-label="Close product view">
        <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="m6 6 12 12M18 6 6 18" />
        </svg>
      </button>
    </div>
    <div id="screen-stage" class="screen-stage"></div>
    <p class="screen-help">Illustrative product interface. On a small screen, scroll within the view to inspect the details.</p>
  </dialog>
  <noscript>
    <p class="noscript-note">This page is a product preview. Enable JavaScript to explore the interactive examples, product views and demo-request form. The product information remains available on this page.</p>
  </noscript>
</template>
