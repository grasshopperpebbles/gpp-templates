#!/bin/bash

#===============================================================================
# WordPress Plugin Installation Script - E-commerce + CMS (E-commerce Primary)
#===============================================================================
# This script installs and configures plugins for headless WordPress
# with both CMS/blog and WooCommerce features. E-commerce is the primary focus.
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

echo "🚀 Setting up headless WordPress environment (E-commerce + CMS, E-commerce Primary)..."
echo "================================================="
echo "  Site Name: $SITE_NAME"
echo "  Site URL: $SITE_URL"
echo "  Frontend URL: $FRONTEND_URL"
echo "  Admin: $ADMIN_USER"
echo "  Mode: E-commerce + CMS (E-commerce Primary - Product Homepage)"
echo "================================================="

# Check if WordPress is accessible
echo "⏳ Verifying WordPress accessibility..."
if curl -s -o /dev/null "$SITE_URL"; then
    echo "✅ WordPress is ready!"
else
    echo "⚠️  WordPress may not be fully accessible yet, but continuing..."
fi

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

install_wordpress

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
        fi
    fi
}

# Install plugin from GitHub release or source archive
install_github_plugin() {
    local repo=$1
    local plugin_slug=$2
    local version=$3
    local plugin_name=$4
    local plugins_dir="/var/www/html/wp-content/plugins"

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

    local temp_zip="${plugins_dir}/temp_${plugin_slug}.zip"
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
        rm -f "$temp_zip" 2>/dev/null
        return 1
    fi

    # Extract
    cd "$plugins_dir"
    rm -rf "$plugin_slug" 2>/dev/null
    unzip -oq "$temp_zip"

    # Find and rename extracted directory
    local repo_name="${repo#*/}"
    local version_no_v="${version#v}"
    for dir_pattern in "$plugin_slug" "${repo_name}-${version_no_v}" "${repo_name}-${version}"; do
        if [ -d "$dir_pattern" ] && [ "$dir_pattern" != "$plugin_slug" ]; then
            mv "$dir_pattern" "$plugin_slug"
            break
        fi
    done

    rm -f "$temp_zip"

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
# Install Core Plugins (E-commerce + CMS - All Features)
#-------------------------------------------------------------------------------

echo ""
echo "🔌 Installing essential plugins (E-commerce + CMS)..."
echo "=================================="

# WooCommerce (always enabled for combined variants)
install_plugin "woocommerce" "WooCommerce" "9.3.3"
install_plugin "woocommerce-gateway-stripe" "WooCommerce Stripe Gateway"
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
install_plugin "seo-by-rank-math" "Rank Math SEO"
install_github_plugin "AxeWP/wp-graphql-rank-math" "wp-graphql-rank-math" "v0.3.4" "WPGraphQL Rank Math"

# Configure Rank Math
if wp plugin is-active seo-by-rank-math --allow-root --quiet 2>/dev/null; then
    echo "⏳ Configuring Rank Math SEO..."
    wp eval 'update_option("rank_math_setup_completed", true);' --allow-root --quiet 2>/dev/null || true
    echo "✅ Rank Math configured"
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
install_plugin "yith-woocommerce-wishlist" "YITH WooCommerce Wishlist"
install_plugin "woo-variation-swatches" "Variation Swatches for WooCommerce"
install_plugin "wp-smushit" "Smush Image Optimization"
install_plugin "woocommerce-advanced-free-shipping" "Advanced Free Shipping"
install_plugin "flexible-shipping" "Flexible Shipping"
install_plugin "woo-discount-rules" "Discount Rules for WooCommerce"
install_plugin "customer-reviews-woocommerce" "Customer Reviews for WooCommerce"

# Development helpers
install_plugin "query-monitor" "Query Monitor"
install_plugin "duplicate-post" "Duplicate Post"

# Activate custom plugins (All plugins for combined variant)
if [ -d "/var/www/html/wp-content/plugins/headless-config" ]; then
    wp plugin activate headless-config --allow-root --quiet && echo "✅ Headless Config activated" || true
fi

if [ -d "/var/www/html/wp-content/plugins/gp-featured-items" ]; then
    wp plugin activate gp-featured-items --allow-root --quiet && echo "✅ GP Featured Items activated" || true
fi

if [ -d "/var/www/html/wp-content/plugins/gp-most-popular" ]; then
    wp plugin activate gp-most-popular --allow-root --quiet && echo "✅ GP Most Popular activated" || true
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
wp rewrite structure '/%postname%/' --allow-root --quiet 2>/dev/null || true
wp rewrite flush --allow-root --quiet 2>/dev/null || true
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
# Configure GraphQL CORS
#-------------------------------------------------------------------------------

echo ""
echo "🔗 Configuring GraphQL CORS..."
echo "=============================="

wp option update graphql_general_settings '{
    "public_introspection_enabled": "on",
    "show_in_graphql": "on",
    "restrict_endpoint_to_logged_in_users": "off"
}' --format=json --allow-root --quiet 2>/dev/null || true

echo "✅ GraphQL CORS configured"

#-------------------------------------------------------------------------------
# Configure REST API CORS
#-------------------------------------------------------------------------------

echo ""
echo "🔗 Configuring REST API CORS..."
echo "==============================="

wp option update rest_cors_allowed_origins '["*"]' --format=json --allow-root --quiet 2>/dev/null || true
echo "✅ REST API CORS configured"

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
    wp config set WP_REDIS_HOST redis --type=constant --allow-root --quiet 2>/dev/null || true
    wp config set WP_REDIS_PORT 6379 --type=constant --allow-root --quiet 2>/dev/null || true
    wp config set WP_REDIS_DATABASE 0 --type=constant --allow-root --quiet 2>/dev/null || true
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
    wp menu item add-custom $MENU_ID "Shop" "${FRONTEND_URL}/products" --allow-root --quiet 2>/dev/null || true
    wp menu item add-custom $MENU_ID "Blog" "${FRONTEND_URL}/blog" --allow-root --quiet 2>/dev/null || true

    wp menu location assign $MENU_ID primary --allow-root --quiet 2>/dev/null || true
    echo "✅ Primary navigation menu created"
fi

#-------------------------------------------------------------------------------
# Create WooCommerce API Keys
#-------------------------------------------------------------------------------

echo ""
echo "🔑 Creating WooCommerce API keys..."
echo "==================================="

API_KEY_EXISTS=$(wp db query "SELECT COUNT(*) FROM wp_woocommerce_api_keys WHERE description = 'Local Development'" --skip-column-names --allow-root --quiet 2>/dev/null || echo "0")

if [ "$API_KEY_EXISTS" = "0" ]; then
    CONSUMER_KEY="ck_$(openssl rand -hex 20)"
    CONSUMER_SECRET="cs_$(openssl rand -hex 20)"

    wp db query "INSERT INTO wp_woocommerce_api_keys (user_id, description, permissions, consumer_key, consumer_secret, truncated_key) VALUES (1, 'Local Development', 'read_write', '$CONSUMER_KEY', '$CONSUMER_SECRET', '$(echo $CONSUMER_KEY | rev | cut -c1-7 | rev)')" --allow-root --quiet

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

#-------------------------------------------------------------------------------
# Setup Complete
#-------------------------------------------------------------------------------

echo ""
echo "✅ E-commerce + CMS setup completed successfully! (E-commerce Primary)"
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
