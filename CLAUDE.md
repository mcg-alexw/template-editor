# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
yarn dev          # Start Vite dev server at http://localhost:5173/template-editor/
yarn build        # Build for production (auto-increments patch version, outputs to dist/)
yarn deploy       # Deploy to GitHub Pages
yarn lint         # ESLint on src/**/*.{ts,tsx}
yarn format       # Prettier on all files
yarn typecheck    # TypeScript type check (no emit)
yarn preview      # Preview production build locally
```

No test runner is configured. Pre-commit hooks run Prettier via lint-staged (Husky).

## Architecture

This is a **fully client-side** React email template editor with no backend.

### Core flow

1. `src/template.html` is imported as a raw string via Vite's `?raw` loader.
2. `src/utils/fences.ts` parses the HTML for `<!-- editable:start ... --> ... <!-- editable:end -->` comment fences, returning typed blocks.
3. `src/App.tsx` renders editor UI for each block — `FieldText` for `type="text"` blocks, `ParagraphEditor` (TipTap) for `type="rich"` blocks.
4. On export, each edited block is written back via `replaceBlock()`, sanitized through `src/utils/sanitizers.ts`, then made available to download.

### Editable block fence format

```html
<!-- editable:start name="GREETING" label="Greeting" type="text" max="120" -->
Dear <strong>${Leads.First Name}</strong>,
<!-- editable:end -->
```

Attributes: `name` (unique key), `label` (UI label), `type` (`text` | `rich`), `max` (character limit for text fields).

### Key files

- **`src/App.tsx`** — All editor state, TipTap integration (`ParagraphEditor` component), `FieldText`, `MergeInput`, mail-merge tag groups (`MERGE_GROUPS` constant), brand injection, section management, and HTML export. Very large file (~2800 lines).
- **`src/utils/fences.ts`** — `getBlocks(html)` parses fences; `replaceBlock(html, name, body)` writes edits back.
- **`src/utils/sanitizers.ts`** — `sanitizeInlineHtml()` strips to inline-only tags; `sanitizeParaHtml()` allows paragraph structure. Both target email-client compatibility. `<mark>` tags are converted to `<span style="background-color:...">` for email clients.
- **`src/types.ts`** — `Section`, `Brand`, `BrandColors`, `MergeGroup` interfaces.
- **`src/brands.json`** — Brand definitions with `HEADER`/`FOOTER` HTML strings and color palettes. Two brands: `brand1` (My Club), `brand2` (Decathlon Club).
- **`src/template.html`** — Source template with all fenced editable blocks.

### Rich text editing (TipTap)

`ParagraphEditor` in `App.tsx` uses TipTap with these extensions: `StarterKit` (headings disabled), `TextStyle`, `Color`, `Highlight`. The editor has two modes:

- **Full toolbar** — used for the `SECTIONS` block (bold, italic, underline, lists, text color, background color, links)
- **Mini toolbar** — used for `GREETING` and `SIGNOFF` (bold, italic, underline, clear formatting only)

Mail-merge autocomplete triggers on `#` prefix — a floating menu appears listing filtered merge tags. Selecting one inserts `${Module.Field Name}` at the cursor.

### Brand blocks

`HEADER` and `FOOTER` blocks are special: their content is replaced entirely with brand-specific HTML from `brands.json` when a brand is selected, not edited in-place.

### Section management

The `SECTIONS` block is rendered from a `sections` state array (`Section[]`). Each section has a `type`: `paragraph`, `cta`, `imgtext`, `separator`, `fullwidthheader`, or `fullwidthfooter`. The `sectionHTML` object in `App.tsx` contains HTML generators for each type that produce email-safe markup.

### Mail-merge tags

Tags follow `${Module.Field Name}` syntax. Groups are defined in the `MERGE_GROUPS` constant in `App.tsx`. Tags can be inserted via the `#` autocomplete in TipTap editors or via `MergeInput` in plain text fields.

### Build info

`vite.config.mjs` includes a custom `buildInfoPlugin` that embeds version, git commit SHA, and build timestamp as `__BUILD_INFO__` at build time, and emits `build-info.json` and `BUILD.txt` to `dist/`. The `yarn build` command auto-increments the patch version via `yarn version patch`.

## Important conventions

- When adding a new editable field: update **both** `src/template.html` (add the fence) and `src/App.tsx` (handle the new block name if it needs special behavior).
- When adding a mail-merge tag: update `MERGE_GROUPS` in `src/App.tsx`.
- Preserve the exact comment fence format — `fences.ts` uses regex to parse it.
- TypeScript `strict` is `false` — migration is ongoing. Use `@ts-expect-error` for untyped third-party imports.
- Base path is `/template-editor/` (set in `vite.config.mjs`) for GitHub Pages deployment.
- Do not bump the version manually before building; `yarn build` increments it automatically.
