#!/usr/bin/env bash
# gpp add seo rank-math: WordPress side. Runs inside the WordPress container, safe to re-run.
#   docker compose exec -T <wordpress-service> bash -c "$(cat seo-rank-math-setup.sh)"
# Installs and activates WPGraphQL, Rank Math, WPGraphQL for Rank Math and REST Meta for Rank Math,
# makes Article the default schema for posts, turns on Rank Math's headless support and breadcrumbs,
# skips the registration wizard (rank_math_registration_skip), and turns off Rank Math's sitemap
# (the Next.js app serves sitemap.xml). Exits 1 if a plugin could not be set up.
set -u

WPGRAPHQL_RANK_MATH_ZIP="https://github.com/AxeWP/wp-graphql-rank-math/releases/download/0.3.4/wp-graphql-rank-math.zip"

if ! command -v wp >/dev/null 2>&1; then
  echo "[gpp] Installing WP-CLI..."
  curl -sO https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar
  chmod +x wp-cli.phar
  mv wp-cli.phar /usr/local/bin/wp
fi

wpc() { wp --allow-root "$@" </dev/null; }

if ! wpc core is-installed >/dev/null 2>&1; then
  echo "[gpp] WordPress is not installed yet. Finish the install, then run gpp add seo again."
  exit 1
fi

failed=()

# ensure_plugin <slug> [source]: install (from the source, default the slug) and activate.
ensure_plugin() {
  local slug="$1" src="${2:-$1}"
  if wpc plugin is-installed "$slug" >/dev/null 2>&1; then
    if wpc plugin is-active "$slug" >/dev/null 2>&1; then
      echo " - $slug already active"
    elif wpc plugin activate "$slug"; then
      :
    else
      failed+=("$slug")
    fi
  elif wpc plugin install "$src" --activate; then
    :
  else
    failed+=("$slug")
  fi
}

ensure_plugin wp-graphql
ensure_plugin seo-by-rank-math
ensure_plugin wp-graphql-rank-math "$WPGRAPHQL_RANK_MATH_ZIP"

if wpc plugin is-installed rest-meta-for-rank-math >/dev/null 2>&1; then
  ensure_plugin rest-meta-for-rank-math
else
  echo " ! rest-meta-for-rank-math is not in wp-content/plugins"
  failed+=("rest-meta-for-rank-math")
fi

if wpc plugin is-active seo-by-rank-math >/dev/null 2>&1; then
  echo "[gpp] Configuring Rank Math..."
  wpc eval '
    update_option( "rank_math_setup_completed", true );
    update_option( "rank_math_registration_skip", "1" );
    $general = get_option( "rank-math-options-general", array() );
    $general["headless_support"] = "on";
    $general["breadcrumbs"] = "on";
    update_option( "rank-math-options-general", $general );
    $titles = get_option( "rank-math-options-titles", array() );
    $titles["pt_post_default_rich_snippet"] = "article";
    $titles["pt_post_default_article_type"] = "Article";
    update_option( "rank-math-options-titles", $titles );
    if ( class_exists( "\\RankMath\\Helper" ) ) {
      \RankMath\Helper::update_modules( array( "rich-snippet" => "on", "sitemap" => "off" ) );
    }
    echo "Rank Math: headless support on, breadcrumbs on, registration skipped, posts default to Article schema, sitemap off.\n";
  ' || failed+=("rank-math-settings")
fi

if [ "${#failed[@]}" -gt 0 ]; then
  echo "[gpp] Failed: ${failed[*]}"
  exit 1
fi
echo "[gpp] Rank Math SEO is set up."
