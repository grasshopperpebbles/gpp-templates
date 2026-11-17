# CLAUDE.md

## Our WordPress plugins: gpp-cli is the source of truth

`~/projects/gpp-cli` is the source of truth for the WordPress plugins we write. That includes the `gp-*` plugins and `rest-meta-for-rank-math` under `cms/*/files/wp-content/plugins/` here, and gpp-cli's `templates/cms/headless-site-options.php`.

- Make every change in gpp-cli first. Then copy it here, and into each site's `wp-content/plugins/` (GrasshopperPebbles, Broadkast).
- Never edit only this repo's copy or a site's copy. It drifts from gpp-cli.
- gpp-cli's `npm run check:packs` checks that the packs in both repos match.
