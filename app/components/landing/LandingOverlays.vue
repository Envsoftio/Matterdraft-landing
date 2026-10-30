<!-- Product preview dialog. -->
<template>
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
    <p class="noscript-note">This page is a product preview. Enable JavaScript to explore the interactive examples and product views. The product information remains available on this page.</p>
  </noscript>
</template>
