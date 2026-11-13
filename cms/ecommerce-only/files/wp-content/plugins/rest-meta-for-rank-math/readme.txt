=== REST Meta for Rank Math ===
Contributors: gpp
Tags: rest api, seo, headless, meta, rank math
Requires at least: 6.0
Tested up to: 6.9
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Read and write Rank Math's per-post SEO fields through the core WordPress REST API.

== Description ==

Rank Math SEO stores its per-post fields as post meta but does not expose them in the WordPress REST API. This plugin registers them, so an app that publishes posts over REST (with an application password) can set the SEO fields in the same request and read them back later.

Fields, on posts and pages:

* `rank_math_title`: the SEO title.
* `rank_math_description`: the meta description.
* `rank_math_focus_keyword`: comma-separated keywords. The first is the focus keyword.
* `rank_math_primary_category`: term ID of the primary category (posts only).

The fields are only visible with `context=edit`, and only users who can edit the post can read or write them. The plugin does nothing unless Rank Math is active. It has no settings, stores nothing, and makes no external requests.

Use the `rmrm_post_types` filter to change which post types get the fields. A post type needs REST and custom-fields support.

= Example =

`POST /wp-json/wp/v2/posts/123`

`{ "meta": { "rank_math_title": "My SEO title", "rank_math_description": "A short summary.", "rank_math_focus_keyword": "main keyword,second keyword" } }`

Read them back with `GET /wp-json/wp/v2/posts/123?context=edit`.

== Frequently Asked Questions ==

= Is this an official Rank Math plugin? =

No. It is an independent plugin that works with Rank Math SEO.

= Why is there no field for the schema type? =

Rank Math applies a default schema for each post type (Rank Math > Titles & Meta). A per-post legacy schema field would switch that default off, so this plugin leaves schema to Rank Math's settings.

== Changelog ==

= 1.0.0 =
* First release.
