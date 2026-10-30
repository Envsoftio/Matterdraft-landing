# Landing-page components

These components preserve the approved MatterDraft premium landing-page design.
They render semantic HTML on the server; the client controller enhances the
existing controls after hydration.

## Page composition

```vue
<LandingHeader />
<main id="main">
  <LandingHero />
  <LandingEarlyAccess />
  <LandingFeatures />
</main>
<LandingFooter />
```

Import the page components explicitly from `~/components/landing/` in the page.
`LandingFeatures.vue` explicitly imports and orders the fifteen feature and
closing sections. It introduces no wrapper that would change their layout.

## Interaction contract

- `LandingHeader` contains the skip link, `#top`, the desktop navigation and the
  mobile-menu controls.
- `LandingHero` retains `[data-mdh-root]`, the complete illustrative workspace,
  all document controls, the floating reference panels and the workflow rail.
- Feature sections retain their original element IDs and `data-*` attributes.
  These are stable hooks for `useLandingExperience()`.
- Policy links are Nuxt routes: `/privacy`, `/terms` and `/refund-policy`.
  Automatic prefetch is disabled for these links. The old policy placeholder
  dialog and its `data-notice` controls are omitted.

The components contain no copied inline browser scripts. The page mounts the
interaction composable and owns its lifecycle. Do not attach a second copy of
the original HTML scripts.

Server-rendered content starts visible. Scroll reveals are added after mount,
and hero entrance animations require the controller's existing
`data-mdh-initialized="true"` marker. Reduced-motion users keep the static view.

## Styling and assets

`app/assets/css/landing.css` preserves the approved responsive and illustration
styles. It uses Tailwind `@apply` for shared layout primitives and should be
imported by `main.css` after the Tailwind import. The Inter `@font-face` rule and
font preload belong to the application asset setup; no base64 webfont is stored
in the components or this stylesheet.

The landing container explicitly clears Tailwind's generated `container`
maximum widths.

All approved brand artwork remains inline SVG with its original gradients and
distinct definition IDs. No screenshot image replaces the product UI.

## Content boundaries

The interface examples use fictional matters and documents. Early access
registration remains unavailable until a signup destination is connected.
