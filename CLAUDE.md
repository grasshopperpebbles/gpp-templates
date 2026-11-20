# CLAUDE.md

## This repo is the source of truth for the packs gpp-cli bundles

gpp-cli (`~/projects/gpp-cli`) bundles some of these packs, `recipes/`, and our WordPress plugin files (the `gp-*` plugins, `cms/headless-site-options.php`, and `rest-meta-for-rank-math` in `add-ons/seo`). Its `templates-bundle.json` lists them and pins the commit of this repo they came from.

- Make every change to them here. Commit and push, then run `npm run templates:sync` in gpp-cli and commit there.
- Never edit gpp-cli's copies: its tests and CI reject them.
- The `gp-*` plugins live in each WordPress pack's `files/wp-content/plugins/` (`cms-ecommerce`, `cms-only`, `ecommerce-cms`, `ecommerce-only`). Keep the four copies identical; gpp-cli's `gpp cms` uses the `cms-ecommerce` copy. Sites get plugin copies by hand from here (GrasshopperPebbles, Broadkast); never edit only a site's copy.
- gpp-cli's own files (its `gpp/` AI-instruction files, BaaS Docker files, CI and log tooling) live in gpp-cli only. Don't copy them here: gpp-cli's CI fails when a folder exists in both repos without being listed in its `templates-bundle.json`.

## Adding a template

Add `<platform>/<variant>/` with a `variant.json` and a `files/` folder, check it with `gpp template validate`, and open a pull request. gpp-cli doesn't need to change: users get it with `gpp template install` / `gpp template update`, or when a recipe needs it.
