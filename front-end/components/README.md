# Component Structure

Components are grouped by ownership instead of keeping every file in one flat folder.

- `layout/`: application shell components used across pages, such as `SiteHeader`, `SiteFooter`, `AppProviders`, and `AppBackground`.
- `common/`: reusable presentational helpers shared by multiple features, such as `SectionHeader` and `MaterialSymbolIcon`.
- `ui/`: low-level UI primitives with minimal business meaning.
- `home/`: landing-page sections, such as `HomeHero`, `HomeFeatureTabs`, `AssessmentInterfacePreview`, and `ResultsReviewPreview`.
- `auth/`: login and signup experience, such as `AuthPanel` and `CredentialForms`.
- `practice/`: practice listing, test setup, and exam session flow.
- `progress/`: progress overview feature.
- `vocabulary/`: vocabulary notebook feature.

Prefer adding a new component to the folder that owns its behavior. Use `common/` only when the component is genuinely shared by more than one feature.
