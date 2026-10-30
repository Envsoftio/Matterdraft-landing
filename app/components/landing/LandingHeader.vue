<!-- Approved navigation, skip link, mobile menu and brand placement. -->
<template>
  <a class="skip-link" href="#main">Skip to content</a>
  <div id="top"></div>
  <header class="site-header" data-pen-name="Navigation">
    <nav class="container nav-shell" aria-label="Main navigation">
      <a class="brand" href="#top" aria-label="MatterDraft Studio home">
        <BrandLogo />
      </a>
      <div class="nav-links">
        <a href="#product">Product</a>
        <a href="#pdf-engine">PDF Engine</a>
        <a href="#workflow">Workflow</a>
        <a href="#automation">Automation</a>
        <a href="#local-processing">Local Processing</a>
      </div>
      <ThemeToggle />
      <button
        class="menu-button"
        id="menu-button"
        type="button"
        aria-controls="mobile-nav"
        aria-expanded="false"
        aria-label="Open navigation"
      >
        <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </nav>
    <nav class="mobile-nav" id="mobile-nav" aria-label="Mobile navigation" hidden>
      <a href="#product">Product</a>
      <a href="#pdf-engine">PDF Engine</a>
      <a href="#workflow">Workflow</a>
      <a href="#automation">Automation</a>
      <a href="#local-processing">Local Processing</a>
    </nav>
  </header>
</template>
