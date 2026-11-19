#!/bin/bash

#===============================================================================
# WordPress Plugin Installation Script - CMS + E-commerce (CMS Primary)
#===============================================================================
# This script installs and configures plugins for headless WordPress
# with both CMS/blog and WooCommerce features. CMS is the primary focus.
#===============================================================================

set -e

#-------------------------------------------------------------------------------
# Configuration from Environment Variables (with defaults)
#-------------------------------------------------------------------------------
SITE_URL="${SITE_URL:-http://localhost:8080}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"
SITE_NAME="${SITE_NAME:-My Site}"
SITE_TAGLINE="${SITE_TAGLINE:-Your content site}"
ADMIN_USER="${ADMIN_USER:-admin}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@example.com}"
TIMEZONE="${TIMEZONE:-America/New_York}"

#-------------------------------------------------------------------------------
# Utility Functions
#-------------------------------------------------------------------------------

echo "🚀 Setting up headless WordPress environment (CMS + E-commerce, CMS Primary)..."
echo "================================================="
echo "  Site Name: $SITE_NAME"
echo "  Site URL: $SITE_URL"
echo "  Frontend URL: $FRONTEND_URL"
echo "  Admin: $ADMIN_USER"
echo "  Mode: CMS + E-commerce (CMS Primary - Blog Homepage)"
echo "================================================="

# Check if WordPress is accessible

# Install WP-CLI if not present
if ! command -v wp &> /dev/null; then
    echo "📦 Installing WP-CLI..."
    curl -O https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar
    chmod +x wp-cli.phar
    mv wp-cli.phar /usr/local/bin/wp
fi

# Install unzip if not present (needed for GitHub plugins)
if ! command -v unzip &> /dev/null; then
    echo "📦 Installing unzip..."
    apt-get update -qq && apt-get install -y -qq unzip
fi

#-------------------------------------------------------------------------------
# Install WordPress Core
#-------------------------------------------------------------------------------

FAILED_PLUGINS=()

install_wordpress() {
    echo "⏳ Checking WordPress installation..."

    if ! wp core is-installed --allow-root --quiet 2>/dev/null; then
        echo "📦 Installing WordPress..."
        wp core install \
            --url="$SITE_URL" \
            --title="$SITE_NAME" \
            --admin_user="$ADMIN_USER" \
            --admin_password="$ADMIN_PASSWORD" \
            --admin_email="$ADMIN_EMAIL" \
            --allow-root \
            --quiet
        echo "✅ WordPress installed successfully!"
    else
        echo "✅ WordPress is already installed!"
    fi
}

#-------------------------------------------------------------------------------
# Wait for the database (MariaDB can take a while on a first start)
#-------------------------------------------------------------------------------
# The WordPress image has no mysql client, so PHP's mysqli asks the database directly,
# with the same settings WordPress uses (WORDPRESS_DB_* from docker-compose.yml).

db_ready() {
    php -r '
        $host = getenv("WORDPRESS_DB_HOST") ?: "localhost";
        $port = 3306;
        if (strpos($host, ":") !== false) { [$host, $port] = explode(":", $host, 2); }
        mysqli_report(MYSQLI_REPORT_OFF);
        $db = @new mysqli($host, getenv("WORDPRESS_DB_USER") ?: "", getenv("WORDPRESS_DB_PASSWORD") ?: "", getenv("WORDPRESS_DB_NAME") ?: "", (int) $port);
        exit($db->connect_errno ? 1 : 0);
    ' >/dev/null 2>&1
}

DB_WAIT_SECONDS="${DB_WAIT_SECONDS:-180}"
echo "⏳ Waiting for the database (up to ${DB_WAIT_SECONDS}s)..."
waited=0
until db_ready; do
    if [ "$waited" -ge "$DB_WAIT_SECONDS" ]; then
        echo "❌ The database did not answer within ${DB_WAIT_SECONDS}s. Nothing was installed." >&2
        echo "   Check it with: docker compose ps   and   docker compose logs" >&2
        exit 1
    fi
    sleep 3
    waited=$((waited + 3))
done
echo "✅ Database is ready"

install_wordpress

# Permalinks right after install: with "Plain", /wp-json/ and pretty URLs serve the home page.
echo "🔗 Setting permalinks to /%postname%/..."
wp rewrite structure '/%postname%/' --hard --allow-root --quiet

#-------------------------------------------------------------------------------
# Plugin Installation Helper
#-------------------------------------------------------------------------------

install_plugin() {
    local plugin_slug=$1
    local plugin_name=$2
    local version=$3

    echo "📦 Installing $plugin_name..."

    if wp plugin is-installed $plugin_slug --allow-root --quiet 2>/dev/null; then
        if wp plugin is-active $plugin_slug --allow-root --quiet 2>/dev/null; then
            echo "✅ $plugin_name is already installed and active"
        else
            wp plugin activate $plugin_slug --allow-root --quiet
            echo "✅ $plugin_name activated"
        fi
    else
        local install_cmd="wp plugin install $plugin_slug --activate --allow-root --quiet"
        if [ -n "$version" ]; then
            install_cmd="wp plugin install $plugin_slug --version=$version --activate --allow-root --quiet"
        fi

        if $install_cmd; then
            echo "✅ $plugin_name installed and activated"
        else
            echo "❌ Failed to install $plugin_name"
            FAILED_PLUGINS+=("$plugin_name")
        fi
    fi
}

# Install plugin from GitHub release or source archive
install_github_plugin() {
    local repo=$1
    local plugin_slug=$2
    local version=$3
    local plugin_name=$4
    local plugins_dir="${PLUGINS_DIR:-/var/www/html/wp-content/plugins}"

    echo "📦 Installing $plugin_name from GitHub..."

    if wp plugin is-installed $plugin_slug --allow-root --quiet 2>/dev/null; then
        if wp plugin is-active $plugin_slug --allow-root --quiet 2>/dev/null; then
            echo "✅ $plugin_name is already installed and active"
            return 0
        else
            wp plugin activate $plugin_slug --allow-root --quiet
            echo "✅ $plugin_name activated"
            return 0
        fi
    fi

    local work_dir
    work_dir=$(mktemp -d)
    local temp_zip="${work_dir}/${plugin_slug}.zip"
    local download_success=false

    # Try release asset
    local release_url="https://github.com/${repo}/releases/download/${version}/${plugin_slug}.zip"
    if curl -sfL "$release_url" -o "$temp_zip" 2>/dev/null && [ -s "$temp_zip" ] && unzip -tq "$temp_zip" 2>/dev/null; then
        download_success=true
    fi

    # Try source archive
    if [ "$download_success" = false ]; then
        local archive_url="https://github.com/${repo}/archive/refs/tags/${version}.zip"
        if curl -sfL "$archive_url" -o "$temp_zip" 2>/dev/null && [ -s "$temp_zip" ] && unzip -tq "$temp_zip" 2>/dev/null; then
            download_success=true
        fi
    fi

    if [ "$download_success" = false ]; then
        echo "❌ Failed to download $plugin_name from GitHub"
        rm -rf "$work_dir" 2>/dev/null
        FAILED_PLUGINS+=("$plugin_name")
        return 0
    fi

    # Extract into a scratch folder. Some release zips are flat (no top folder), so unzipping
    # straight into plugins/ would spill files there. If the zip holds exactly one directory
    # and nothing else, that directory is the plugin; otherwise the scratch folder is.
    local extract_dir="${work_dir}/extract"
    mkdir -p "$extract_dir"
    unzip -oq "$temp_zip" -d "$extract_dir"

    local entries=("$extract_dir"/* "$extract_dir"/.[!.]*)
    local found=()
    local e
    for e in "${entries[@]}"; do
        [ -e "$e" ] && found+=("$e")
    done

    rm -rf "${plugins_dir:?}/${plugin_slug}" 2>/dev/null
    if [ "${#found[@]}" -eq 1 ] && [ -d "${found[0]}" ]; then
        mv "${found[0]}" "${plugins_dir}/${plugin_slug}"
    else
        mv "$extract_dir" "${plugins_dir}/${plugin_slug}"
    fi
    rm -rf "$work_dir"

    # Install composer dependencies if needed
    if [ -f "${plugins_dir}/${plugin_slug}/composer.json" ]; then
        echo "   📦 Installing composer dependencies..."
        if ! command -v composer &> /dev/null; then
            curl -sS https://getcomposer.org/installer | php
            mv composer.phar /usr/local/bin/composer
            chmod +x /usr/local/bin/composer
        fi
        cd "${plugins_dir}/${plugin_slug}"
        composer install --no-dev --quiet 2>/dev/null || true
    fi

    # Activate
    if wp plugin activate "$plugin_slug" --allow-root --quiet 2>/dev/null; then
        echo "✅ $plugin_name installed and activated"
    else
        echo "⚠️  $plugin_name installed but activation may require dependencies"
    fi
}

#-------------------------------------------------------------------------------
# Install Core Plugins (CMS + E-commerce - All Features)
#-------------------------------------------------------------------------------

echo ""
echo "🔌 Installing essential plugins (CMS + E-commerce)..."
echo "=================================="

# WooCommerce (always enabled for combined variants)
install_plugin "woocommerce" "WooCommerce" "9.3.3"
# Pinned: the image is wordpress:6.6 and the newest releases of this plugin (11.x, WordPress 6.9+)
# are refused by wp-cli ("does not work with your version of WordPress"), so nothing installs.
# 9.9.3 is the newest 9.x release that still supports WordPress 6.6 (verified).
install_plugin "woocommerce-gateway-stripe" "WooCommerce Stripe Gateway" "9.9.3"
install_plugin "woocommerce-paypal-payments" "WooCommerce PayPal Payments"

# Advanced Custom Fields (required by WPGraphQL ACF)
install_plugin "advanced-custom-fields" "Advanced Custom Fields"

# GraphQL plugins
install_plugin "wp-graphql" "WPGraphQL"
install_github_plugin "wp-graphql/wp-graphql-woocommerce" "wp-graphql-woocommerce" "v0.21.2" "WPGraphQL WooCommerce"
install_plugin "wpgraphql-acf" "WPGraphQL ACF"
install_plugin "wpgraphql-smart-cache" "WPGraphQL Smart Cache"

# Authentication
install_plugin "jwt-authentication-for-wp-rest-api" "JWT Authentication"

# SEO - Rank Math with GraphQL support
# Pinned for the same reason: Rank Math 1.0.275+ requires WordPress 6.7, the image has 6.6.
install_plugin "seo-by-rank-math" "Rank Math SEO" "1.0.270"
install_github_plugin "AxeWP/wp-graphql-rank-math" "wp-graphql-rank-math" "0.3.4" "WPGraphQL Rank Math"

# Configure Rank Math
if wp plugin is-active seo-by-rank-math --allow-root --quiet 2>/dev/null; then
    echo "⏳ Configuring Rank Math SEO..."
    wp eval 'update_option("rank_math_setup_completed", true);' --allow-root --quiet 2>/dev/null || true
    # Headless SEO (gpp add seo rank-math): headless support on, posts default to Article schema,
    # Rank Math sitemap off (the Next.js app serves sitemap.xml).
    wp eval '
      $general = get_option( "rank-math-options-general", array() );
      $general["headless_support"] = "on";
      update_option( "rank-math-options-general", $general );
      $titles = get_option( "rank-math-options-titles", array() );
      $titles["pt_post_default_rich_snippet"] = "article";
      $titles["pt_post_default_article_type"] = "Article";
      update_option( "rank-math-options-titles", $titles );
      if ( class_exists( "\\RankMath\\Helper" ) ) {
        \RankMath\Helper::update_modules( array( "rich-snippet" => "on", "sitemap" => "off" ) );
      }
    ' --allow-root --quiet 2>/dev/null || echo "⚠️  Could not apply Rank Math headless settings"
    echo "✅ Rank Math configured"
fi

# REST Meta for Rank Math: Rank Math SEO fields in the REST API (bundled in wp-content/plugins)
if wp plugin is-installed rest-meta-for-rank-math --allow-root --quiet 2>/dev/null; then
    wp plugin activate rest-meta-for-rank-math --allow-root --quiet && echo "✅ REST Meta for Rank Math activated" || true
fi

# Security
install_plugin "wordfence" "Wordfence Security"
install_plugin "akismet" "Akismet Anti-Spam"

# Backup
install_plugin "updraftplus" "UpdraftPlus Backup"

# Email
install_plugin "wp-mail-smtp" "WP Mail SMTP"

# Performance
install_plugin "redis-cache" "Redis Object Cache"

# Marketing
install_plugin "mailchimp-for-woocommerce" "Mailchimp for WooCommerce"

# Social Media Auto-Posting
install_plugin "blog2social" "Blog2Social Social Media Auto Post"

# Cloud Storage
install_plugin "amazon-s3-and-cloudfront" "WP Offload Media Lite"

# WooCommerce extras
install_plugin "woocommerce-pdf-invoices-packing-slips" "PDF Invoices & Packing Slips"
# Pinned: 4.11+ needs WordPress 6.7+, the image has 6.6.
install_plugin "yith-woocommerce-wishlist" "YITH WooCommerce Wishlist" "4.10.0"
# Pinned: 2.6+ needs WordPress 6.8+, the image has 6.6.
install_plugin "woo-variation-swatches" "Variation Swatches for WooCommerce" "2.5.0"
install_plugin "wp-smushit" "Smush Image Optimization"
install_plugin "woocommerce-advanced-free-shipping" "Advanced Free Shipping"
install_plugin "flexible-shipping" "Flexible Shipping"
install_plugin "woo-discount-rules" "Discount Rules for WooCommerce"
install_plugin "customer-reviews-woocommerce" "Customer Reviews for WooCommerce"

# Development helpers
install_plugin "query-monitor" "Query Monitor"
# Pinned: 4.6+ needs WordPress 6.8+, the image has 6.6.
install_plugin "duplicate-post" "Duplicate Post" "4.5"

# Activate custom plugins (All plugins for combined variant)
if [ -d "/var/www/html/wp-content/plugins/headless-config" ]; then
    wp plugin activate headless-config --allow-root --quiet && echo "✅ Headless Config activated" || true
fi

if [ -d "/var/www/html/wp-content/plugins/gpp-wp-featured-items" ]; then
    wp plugin activate gpp-wp-featured-items --allow-root --quiet && echo "✅ GPP WP Featured Items activated" || true
fi

if [ -d "/var/www/html/wp-content/plugins/gpp-wp-most-popular" ]; then
    wp plugin activate gpp-wp-most-popular --allow-root --quiet && echo "✅ GPP WP Most Popular activated" || true
fi

if [ -d "/var/www/html/wp-content/plugins/gp-social-poster" ]; then
    wp plugin activate gp-social-poster --allow-root --quiet && echo "✅ GP Social Poster activated" || true
fi

#-------------------------------------------------------------------------------
# Configure WordPress Settings
#-------------------------------------------------------------------------------

echo ""
echo "⚙️  Configuring WordPress settings..."
echo "===================================="

# Set permalinks
wp rewrite flush --hard --allow-root --quiet
echo "✅ Permalinks configured"

# Configure site settings
wp option update blogname "$SITE_NAME" --allow-root --quiet
wp option update blogdescription "$SITE_TAGLINE" --allow-root --quiet
wp option update admin_email "$ADMIN_EMAIL" --allow-root --quiet
wp option update start_of_week 1 --allow-root --quiet
wp option update timezone_string "$TIMEZONE" --allow-root --quiet
echo "✅ Site settings configured"

#-------------------------------------------------------------------------------
# Configure WooCommerce
#-------------------------------------------------------------------------------

echo ""
echo "🛒 Configuring WooCommerce..."
echo "============================="

# Run WooCommerce setup wizard
wp wc tool run install_pages --user=1 --allow-root --quiet 2>/dev/null || true

# Store address
wp option update woocommerce_store_address "$STORE_ADDRESS" --allow-root --quiet
[ -n "$STORE_ADDRESS_2" ] && wp option update woocommerce_store_address_2 "$STORE_ADDRESS_2" --allow-root --quiet
wp option update woocommerce_store_city "$STORE_CITY" --allow-root --quiet
wp option update woocommerce_default_country "${STORE_COUNTRY}:${STORE_STATE}" --allow-root --quiet
wp option update woocommerce_store_postcode "$STORE_POSTCODE" --allow-root --quiet
wp option update woocommerce_currency "$STORE_CURRENCY" --allow-root --quiet
wp option update woocommerce_product_type "both" --allow-root --quiet
wp option update woocommerce_allow_tracking "no" --allow-root --quiet

# Tax settings
if [ "$ENABLE_TAXES" = "true" ]; then
    wp option update woocommerce_calc_taxes "yes" --allow-root --quiet
else
    wp option update woocommerce_calc_taxes "no" --allow-root --quiet
fi
wp option update woocommerce_prices_include_tax "no" --allow-root --quiet

# Shipping settings
if [ "$ENABLE_SHIPPING" = "true" ]; then
    wp option update woocommerce_ship_to_countries "all" --allow-root --quiet
    wp option update woocommerce_shipping_cost_requires_address "no" --allow-root --quiet
    wp option update woocommerce_ship_to_destination "billing_only" --allow-root --quiet
else
    wp option update woocommerce_ship_to_countries "disabled" --allow-root --quiet
fi

# Enable REST API
wp option update woocommerce_api_enabled "yes" --allow-root --quiet

# Guest checkout
wp option update woocommerce_enable_guest_checkout "yes" --allow-root --quiet

# Complete setup wizard
wp option update woocommerce_onboarding_profile '{"completed":true}' --format=json --allow-root --quiet 2>/dev/null || true
wp option update woocommerce_task_list_complete "yes" --allow-root --quiet

# Create default shipping zone
wp wc shipping_zone create --name="Everywhere" --allow-root --quiet 2>/dev/null || true
wp wc shipping_zone_method create 1 --method_id="flat_rate" --settings='{"title":"Standard Shipping","cost":"10"}' --allow-root --quiet 2>/dev/null || true

echo "✅ WooCommerce configuration completed"

#-------------------------------------------------------------------------------
# Configure WPGraphQL
#-------------------------------------------------------------------------------

echo ""
echo "🔗 Configuring WPGraphQL..."
echo "==========================="

wp option update graphql_general_settings '{
    "public_introspection_enabled": "on",
    "show_in_graphql": "on",
    "restrict_endpoint_to_logged_in_users": "off"
}' --format=json --allow-root --quiet 2>/dev/null || true

echo "✅ WPGraphQL configured"

#-------------------------------------------------------------------------------
# Configure Headless CORS (headless-cors.php plugin)
#-------------------------------------------------------------------------------

echo ""
echo "🔗 Configuring headless CORS..."
echo "==============================="

# Set allowed origins for the headless-cors plugin (comma-separated)
wp option update headless_cors_allowed_origins "\$FRONTEND_URL" --allow-root --quiet 2>/dev/null || true
echo "  Allowed origins: \$FRONTEND_URL"
echo "✅ Headless CORS configured"

#-------------------------------------------------------------------------------
# Configure Media Settings
#-------------------------------------------------------------------------------

echo ""
echo "🖼️  Configuring media settings..."
echo "================================="

wp option update uploads_use_yearmonth_folders 0 --allow-root --quiet 2>/dev/null || true
wp option update image_default_link_type 'none' --allow-root --quiet 2>/dev/null || true
echo "✅ Media settings configured"

#-------------------------------------------------------------------------------
# Create/Verify Admin User
#-------------------------------------------------------------------------------

echo ""
echo "🔑 Verifying admin user..."
echo "=========================="

if ! wp user get "$ADMIN_USER" --allow-root --quiet 2>/dev/null; then
    wp user create "$ADMIN_USER" "$ADMIN_EMAIL" --role=administrator --user_pass="$ADMIN_PASSWORD" --allow-root --quiet
    echo "✅ Admin user created (username: $ADMIN_USER)"
else
    echo "✅ Admin user exists"
fi

#-------------------------------------------------------------------------------
# Configure Redis Cache
#-------------------------------------------------------------------------------

echo ""
echo "💾 Configuring Redis cache..."
echo "============================="

if wp plugin is-active redis-cache --allow-root --quiet 2>/dev/null; then
    # docker-compose.yml defines WP_REDIS_* (WORDPRESS_CONFIG_EXTRA); copies in wp-config.php
    # (written by an earlier setup) made every request warn "already defined".
    for constant in WP_REDIS_HOST WP_REDIS_PORT WP_REDIS_DATABASE; do
        wp config delete "$constant" --type=constant --allow-root --quiet 2>/dev/null || true
    done
    wp redis enable --allow-root --quiet 2>/dev/null || true
    echo "✅ Redis cache configured and enabled"
else
    echo "⚠️  Redis cache plugin not active"
fi

#-------------------------------------------------------------------------------
# Create Sample Content
#-------------------------------------------------------------------------------

echo ""
echo "📝 Creating sample content..."
echo "============================="

# Create About page
if ! wp post list --post_type=page --name=about --field=ID --allow-root --quiet 2>/dev/null | grep -q .; then
    wp post create --post_type=page --post_title="About" --post_name="about" \
        --post_content="<h2>About Our Site</h2><p>Welcome to $SITE_NAME! $SITE_TAGLINE</p>" \
        --post_status=publish --allow-root --quiet
    echo "✅ About page created"
fi

# Create Contact page
if ! wp post list --post_type=page --name=contact --field=ID --allow-root --quiet 2>/dev/null | grep -q .; then
    wp post create --post_type=page --post_title="Contact" --post_name="contact" \
        --post_content="<h2>Get in Touch</h2><p>We'd love to hear from you!</p><p><strong>Email:</strong> $ADMIN_EMAIL</p>" \
        --post_status=publish --allow-root --quiet
    echo "✅ Contact page created"
fi

#-------------------------------------------------------------------------------
# Setup Navigation Menu
#-------------------------------------------------------------------------------

echo ""
echo "🧭 Setting up navigation..."
echo "=========================="

MENU_ID=$(wp menu create "Primary Menu" --porcelain --allow-root --quiet 2>/dev/null || true)

if [ ! -z "$MENU_ID" ]; then
    ABOUT_ID=$(wp post list --post_type=page --name=about --field=ID --allow-root --quiet 2>/dev/null)
    CONTACT_ID=$(wp post list --post_type=page --name=contact --field=ID --allow-root --quiet 2>/dev/null)

    [ -n "$ABOUT_ID" ] && wp menu item add-post $MENU_ID $ABOUT_ID --title="About" --allow-root --quiet 2>/dev/null || true
    [ -n "$CONTACT_ID" ] && wp menu item add-post $MENU_ID $CONTACT_ID --title="Contact" --allow-root --quiet 2>/dev/null || true
    wp menu item add-custom $MENU_ID "Blog" "${FRONTEND_URL}/blog" --allow-root --quiet 2>/dev/null || true
    wp menu item add-custom $MENU_ID "Shop" "${FRONTEND_URL}/products" --allow-root --quiet 2>/dev/null || true

    wp menu location assign $MENU_ID primary --allow-root --quiet 2>/dev/null || true
    echo "✅ Primary navigation menu created"
fi

#-------------------------------------------------------------------------------
# Create WooCommerce API Keys
#-------------------------------------------------------------------------------

echo ""
echo "🔑 Creating WooCommerce API keys..."
echo "==================================="

# wp eval + $wpdb, not "wp db query": the wordpress image has no mysql client, so "wp db query" fails there.
API_KEY_EXISTS=$(wp eval 'global $wpdb; echo (int) $wpdb->get_var( "SELECT COUNT(*) FROM {$wpdb->prefix}woocommerce_api_keys WHERE description = \"Local Development\"" );' --allow-root --quiet 2>/dev/null | tail -n 1)
API_KEY_EXISTS="${API_KEY_EXISTS:-0}"

if [ "$API_KEY_EXISTS" = "0" ]; then
    CONSUMER_KEY="ck_$(openssl rand -hex 20)"
    CONSUMER_SECRET="cs_$(openssl rand -hex 20)"

    GPP_CK="$CONSUMER_KEY" GPP_CS="$CONSUMER_SECRET" wp eval 'global $wpdb; $wpdb->insert( $wpdb->prefix . "woocommerce_api_keys", array( "user_id" => 1, "description" => "Local Development", "permissions" => "read_write", "consumer_key" => getenv( "GPP_CK" ), "consumer_secret" => getenv( "GPP_CS" ), "truncated_key" => substr( getenv( "GPP_CK" ), -7 ) ) );' --allow-root --quiet

    echo "✅ WooCommerce API keys created:"
    echo "   Consumer Key: $CONSUMER_KEY"
    echo "   Consumer Secret: $CONSUMER_SECRET"
    echo ""
    echo "💡 Add these to your frontend/.env.local:"
    echo "   WC_CONSUMER_KEY=$CONSUMER_KEY"
    echo "   WC_CONSUMER_SECRET=$CONSUMER_SECRET"
else
    echo "✅ WooCommerce API keys already exist"
fi

if [ "${#FAILED_PLUGINS[@]}" -gt 0 ]; then
    echo "" >&2
    echo "❌ Setup finished, but these plugins failed to install:" >&2
    for name in "${FAILED_PLUGINS[@]}"; do echo "   - $name" >&2; done
    echo "   Run this script again once the cause is fixed (it skips what is already installed)." >&2
    exit 1
fi

# Mark the site as set up (dev.sh then skips this script on later starts).
touch /var/www/html/.gpp-setup-done

#-------------------------------------------------------------------------------
# Setup Complete
#-------------------------------------------------------------------------------

echo ""
echo "✅ CMS + E-commerce setup completed successfully! (CMS Primary)"
echo "=============================="
echo ""
echo "🌐 Your local environment is ready:"
echo "   📱 WordPress Admin: ${SITE_URL}/wp-admin"
echo "   🔍 GraphQL Explorer: ${SITE_URL}/graphql"
echo "   🗄️  phpMyAdmin: http://localhost:${PHPMYADMIN_PORT:-9090}"
echo "   🖥️  Frontend: ${FRONTEND_URL}"
echo ""
echo "🔐 Login credentials:"
echo "   👤 Username: $ADMIN_USER"
echo "   🔑 Password: $ADMIN_PASSWORD"
echo ""
echo "📋 Next steps:"
echo "   1. Start your Next.js frontend: cd frontend && npm install && npm run dev"
echo "   2. Configure WooCommerce API keys in frontend/.env.local"
echo "   3. Test GraphQL queries at ${SITE_URL}/graphql"
echo ""
echo "🎉 Happy coding!"
