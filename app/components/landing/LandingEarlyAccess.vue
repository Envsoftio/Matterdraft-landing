<template>
  <section id="early-access" class="early-access" aria-labelledby="early-access-title">
    <div class="container early-access-layout">
      <div class="early-access-copy">
        <p class="eyebrow">EARLY ACCESS</p>
        <h2 id="early-access-title">Be among the first to use MatterDraft.</h2>
        <p>When registration opens, join the early access list for launch updates and an invitation when access becomes available.</p>
        <p class="early-access-offer"><strong>Six months free after launch</strong> for people who sign up for early access.</p>
      </div>

      <div class="early-access-panel">
        <div class="early-access-panel-head">
          <h3>Early access registration</h3>
          <p>Signups are opening soon. This form shows the details we’ll ask for.</p>
        </div>
        <form class="early-access-form" @submit.prevent>
          <fieldset disabled>
            <legend class="sr-only">Early access signup fields</legend>
          <div class="early-access-fields">
            <label for="early-access-name"><span class="early-access-field-label">Full name <span class="required-mark" aria-hidden="true">*</span></span>
              <input id="early-access-name" name="name" type="text" autocomplete="name" required maxlength="120" placeholder="Your name">
            </label>
            <label for="early-access-email"><span class="early-access-field-label">Work email <span class="required-mark" aria-hidden="true">*</span></span>
              <input id="early-access-email" name="email" type="email" autocomplete="email" required maxlength="254" placeholder="you@practice.com">
            </label>
            <label for="early-access-role">Your role
              <select id="early-access-role" name="role">
                <option value="">Select a role (optional)</option>
                <option>Advocate</option>
                <option>Barrister or solicitor</option>
                <option>Law firm or chambers team</option>
                <option>Paralegal or legal operations</option>
                <option>Other</option>
              </select>
            </label>
            <label for="early-access-platform">Preferred platform
              <select id="early-access-platform" name="platform">
                <option value="">Select a platform (optional)</option>
                <option>Windows</option>
                <option>macOS</option>
                <option>Both</option>
              </select>
            </label>
          </div>
          <label class="early-access-consent" for="early-access-consent">
            <input id="early-access-consent" name="contact_consent" type="checkbox" value="yes" required>
            <span>I agree to be contacted about MatterDraft early access and launch. <NuxtLink to="/privacy" :prefetch="false">Privacy details</NuxtLink>.</span>
          </label>
          <button class="button early-access-submit" type="submit">Join early access <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg></button>
          </fieldset>
          <p class="early-access-unavailable" role="status">Registration isn’t open yet. No details are being collected.</p>
          <p class="early-access-note">No payment details needed. Please don’t include client or case information.</p>
        </form>
      </div>
    </div>
  </section>
</template>
