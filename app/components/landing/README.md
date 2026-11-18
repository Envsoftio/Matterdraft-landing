# Landing page

The light and dark landing frames in `updated-matterdraft.fig` are the desktop references at 1280 px. `pages/index.vue` composes the header, hero, registration, feature sections and footer. `LandingFeatures.vue` defines the feature order and the sections retain the public navigation anchors.

`assets/css/studio-theme.css` provides shared colors, surfaces and type for the landing page and portal. `studio-landing.css` contains the landing layouts and their responsive variations. The header and portal use the wordmarks exported from the respective OpenPencil frames. Plus Jakarta Sans and JetBrains Mono are self-hosted.

The workspace, collation, volume and template examples run locally with fictional documents. Reka UI provides keyboard navigation, selection and dialog behavior. Vue owns the example state. `useLandingExperience` adds entrance motion to the rendered sections when reduced motion is off.

Registration uses the existing early-access handler and displays its availability from the runtime configuration.
