# MatterDraft naming and product copy

- Name application-owned tables, columns, API fields, functions, and variables for the business record or action they represent: customer accounts, account memberships, organisation invitations, ownership transfers, staff access, and audit events. Avoid names borrowed from PRD sections, delivery phases, or UI containers such as `portal_*` for persisted records.
- Use names imposed by Better Auth, OAuth, Nuxt, and other integrated libraries only at their integration boundaries. Do not rename a vendor-owned schema or protocol field to satisfy an internal naming preference.
- Write customer-facing copy about the action the person can take or the state they need to understand. Keep implementation status, architecture, release phases, PRD terminology, and speculative features out of screens and labels.
- When a feature is unavailable, omit its control or give a short, truthful message in the relevant place. Do not fill a page with roadmap cards or technical promises.
- Evolve applied database schemas with a new migration. Do not rewrite migrations already applied to any environment.
