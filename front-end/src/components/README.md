# Component Structure

Components are grouped by ownership instead of keeping every file in one flat folder.

- `layout/`: application shell components used across pages, such as `SiteHeader`, `SiteFooter`, `AppProviders`, and `AppBackground`.
- `common/`: reusable presentational helpers shared by multiple features, such as `MaterialSymbolIcon` and `UserAvatar`.

Feature-specific components (home, auth, practice, explore, progress, vocabulary, profile) live in `src/features/<feature>/components/`.

Prefer adding a new component to the feature that owns its behavior. Use `common/` only when the component is genuinely shared by more than one feature.
