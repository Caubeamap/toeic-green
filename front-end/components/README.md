# Component Structure

Components are grouped by ownership instead of keeping every file in one flat folder.

- `layout/`: application shell components used across pages, such as header, footer, providers, and background.
- `common/`: reusable presentational helpers shared by multiple features.
- `ui/`: low-level UI primitives with minimal business meaning.
- `home/`: landing-page and marketing/demo sections.
- `auth/`: login and signup experience.
- `practice/`: practice listing, test detail, and test-taking flow.
- `progress/`: progress dashboard feature.
- `vocabulary/`: vocabulary notes feature.

Prefer adding a new component to the folder that owns its behavior. Use `common/` only when the component is genuinely shared by more than one feature.
