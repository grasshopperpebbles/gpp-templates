<?php
/**
 * Plugin Name: GP Most Popular
 * Plugin URI: https://github.com/lesgreen/headless-wordpress-starter
 * Description: Manage most popular content section on homepage with smart fallback to best-sellers (generic, works for any content type)
 * Version: 1.1.0
 * Author: Generic Headless WordPress Starter
 * Requires at least: 6.0
 * Requires PHP: 7.4
 * Text Domain: gp-most-popular
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Configuration Constants (with filter support for customization)
 */
if (!defined('GP_MOST_POPULAR_DEFAULT_TITLE')) {
    define('GP_MOST_POPULAR_DEFAULT_TITLE', apply_filters('gp_most_popular_default_title', 'Most Popular'));
}

if (!defined('GP_MOST_POPULAR_DEFAULT_DESCRIPTION')) {
    define('GP_MOST_POPULAR_DEFAULT_DESCRIPTION', apply_filters('gp_most_popular_default_description', 'Customer favorites and trending content'));
}

if (!defined('GP_MOST_POPULAR_MAX_ITEMS')) {
    define('GP_MOST_POPULAR_MAX_ITEMS', apply_filters('gp_most_popular_max_items', 4));
}

if (!defined('GP_MOST_POPULAR_MENU_LABEL')) {
    define('GP_MOST_POPULAR_MENU_LABEL', apply_filters('gp_most_popular_menu_label', 'Most Popular'));
}

if (!defined('GP_MOST_POPULAR_ENABLE_BEST_SELLERS_FALLBACK')) {
    define('GP_MOST_POPULAR_ENABLE_BEST_SELLERS_FALLBACK', apply_filters('gp_most_popular_enable_best_sellers_fallback', true));
}

// Support environment variables for headless setups
if (getenv('GP_MOST_POPULAR_TITLE')) {
    define('GP_MOST_POPULAR_DEFAULT_TITLE', getenv('GP_MOST_POPULAR_TITLE'));
}

if (getenv('GP_MOST_POPULAR_DESCRIPTION')) {
    define('GP_MOST_POPULAR_DEFAULT_DESCRIPTION', getenv('GP_MOST_POPULAR_DESCRIPTION'));
}

if (getenv('GP_MOST_POPULAR_MAX')) {
    define('GP_MOST_POPULAR_MAX_ITEMS', (int) getenv('GP_MOST_POPULAR_MAX'));
}

if (getenv('GP_MOST_POPULAR_MENU_LABEL')) {
    define('GP_MOST_POPULAR_MENU_LABEL', getenv('GP_MOST_POPULAR_MENU_LABEL'));
}

if (getenv('GP_MOST_POPULAR_ENABLE_BEST_SELLERS')) {
    define('GP_MOST_POPULAR_ENABLE_BEST_SELLERS_FALLBACK', getenv('GP_MOST_POPULAR_ENABLE_BEST_SELLERS') === 'true');
}

/**
 * Register Custom Post Type for Most Popular Settings
 */
function gp_most_popular_register_post_type() {
    register_post_type('popular_settings', array(
        'labels' => array(
            'name' => 'Most Popular Settings',
            'singular_name' => 'Popular Setting',
            'menu_name' => GP_MOST_POPULAR_MENU_LABEL,
            'add_new' => 'Edit Settings',
            'add_new_item' => 'Edit Popular Settings',
            'edit_item' => 'Edit ' . GP_MOST_POPULAR_MENU_LABEL,
            'view_item' => 'View Settings',
        ),
        'public' => true,
        'publicly_queryable' => true,
        'show_ui' => true,
        'show_in_menu' => true,
        'menu_icon' => 'dashicons-chart-line',
        'menu_position' => 57,
        'supports' => array('title'),
        'capability_type' => 'post',
        'capabilities' => array(
            'create_posts' => 'manage_options',
        ),
        'map_meta_cap' => true,
        'has_archive' => false,
        'exclude_from_search' => true,
        'show_in_graphql' => true,
        'graphql_single_name' => 'PopularSetting',
        'graphql_plural_name' => 'PopularSettings',
    ));
}
add_action('init', 'gp_most_popular_register_post_type');

/**
 * Register ACF Field Group for Most Popular Items
 */
function gp_most_popular_register_acf_fields() {
    if (function_exists('acf_add_local_field_group')) {
        acf_add_local_field_group(array(
            'key' => 'group_most_popular',
            'title' => 'Most Popular Items Settings',
            'fields' => array(
                // Title Field
                array(
                    'key' => 'field_popular_title',
                    'label' => 'Section Title',
                    'name' => 'popular_title',
                    'type' => 'text',
                    'instructions' => 'Enter the title for the most popular items section',
                    'required' => 0,
                    'default_value' => GP_MOST_POPULAR_DEFAULT_TITLE,
                    'placeholder' => GP_MOST_POPULAR_DEFAULT_TITLE,
                    'maxlength' => 100,
                    'show_in_graphql' => 1,
                    'graphql_field_name' => 'popularTitle',
                ),
                // Description Field
                array(
                    'key' => 'field_popular_description',
                    'label' => 'Section Description',
                    'name' => 'popular_description',
                    'type' => 'textarea',
                    'instructions' => 'Enter the description for the most popular items section',
                    'required' => 0,
                    'default_value' => GP_MOST_POPULAR_DEFAULT_DESCRIPTION,
                    'placeholder' => GP_MOST_POPULAR_DEFAULT_DESCRIPTION,
                    'maxlength' => 500,
                    'rows' => 3,
                    'new_lines' => '',
                    'show_in_graphql' => 1,
                    'graphql_field_name' => 'popularDescription',
                ),
                // Popular Content Field
                array(
                    'key' => 'field_popular_items',
                    'label' => 'Popular Content (Optional)',
                    'name' => 'popular_items',
                    'type' => 'relationship',
                    'instructions' => 'Manually select up to ' . GP_MOST_POPULAR_MAX_ITEMS . ' items. ' . (GP_MOST_POPULAR_ENABLE_BEST_SELLERS_FALLBACK ? 'Empty slots will be filled with best-sellers based on sales (WooCommerce only). ' : '') . 'Use the post type filter to select products, posts, or other content.',
                    'required' => 0,
                    'post_type' => array(),  // Empty = all post types available
                    'taxonomy' => array(),
                    'filters' => array('search', 'post_type', 'taxonomy'),
                    'elements' => array('featured_image'),
                    'min' => 0,
                    'max' => GP_MOST_POPULAR_MAX_ITEMS,
                    'return_format' => 'id',
                    'show_in_graphql' => 1,
                    'graphql_field_name' => 'popularItems',
                ),
            ),
            'location' => array(
                array(
                    array(
                        'param' => 'post_type',
                        'operator' => '==',
                        'value' => 'popular_settings',
                    ),
                ),
            ),
            'menu_order' => 0,
            'position' => 'normal',
            'style' => 'default',
            'label_placement' => 'top',
            'instruction_placement' => 'label',
            'hide_on_screen' => '',
            'active' => true,
            'description' => 'Fields for managing the most popular items section',
            'show_in_graphql' => 1,
            'graphql_field_name' => 'mostPopular',
        ));
    }
}
add_action('acf/init', 'gp_most_popular_register_acf_fields');

/**
 * Get best-selling products by total sales (WooCommerce only)
 *
 * @param int $limit Number of products to retrieve
 * @param array $exclude_ids Product IDs to exclude
 * @return array Array of product IDs
 */
function gp_most_popular_get_best_sellers($limit = 4, $exclude_ids = array()) {
    // Only work if WooCommerce is active
    if (!class_exists('WooCommerce')) {
        return array();
    }

    global $wpdb;

    $exclude_sql = '';
    if (!empty($exclude_ids)) {
        $exclude_ids = array_map('intval', $exclude_ids);
        $exclude_sql = 'AND p.ID NOT IN (' . implode(',', $exclude_ids) . ')';
    }

    $query = "
        SELECT p.ID
        FROM {$wpdb->posts} p
        LEFT JOIN {$wpdb->postmeta} pm ON p.ID = pm.post_id AND pm.meta_key = 'total_sales'
        WHERE p.post_type = 'product'
        AND p.post_status = 'publish'
        {$exclude_sql}
        ORDER BY CAST(pm.meta_value AS UNSIGNED) DESC, p.post_date DESC
        LIMIT %d
    ";

    $product_ids = $wpdb->get_col($wpdb->prepare($query, $limit));

    return array_map('intval', $product_ids);
}

/**
 * Register custom GraphQL field resolver
 */
function gp_most_popular_register_graphql_resolver() {
    register_graphql_field('MostPopular_Fields', 'popularItemsResolved', array(
        'type' => array('list_of' => 'Product'),
        'description' => 'Popular items with smart fallback to best-sellers (WooCommerce only)',
        'resolve' => function($source, $args, $context, $info) {
            // Get the parent post from source
            $post_id = null;

            // The $source is the ACF field group data
            // We need to find the post ID from the query context
            if (isset($context->request['popularSettingsId'])) {
                $post_id = $context->request['popularSettingsId'];
            } else {
                // Get from the first popular_settings post
                $posts = get_posts(array(
                    'post_type' => 'popular_settings',
                    'posts_per_page' => 1,
                    'post_status' => 'publish',
                ));

                if (empty($posts)) {
                    return array();
                }

                $post_id = $posts[0]->ID;
            }

            // Get manually selected items
            $manual_items = get_field('popular_items', $post_id);
            if (!is_array($manual_items)) {
                $manual_items = array();
            }

            // Calculate how many more items we need
            $needed = GP_MOST_POPULAR_MAX_ITEMS - count($manual_items);

            // Get best-sellers to fill remaining slots (if enabled and WooCommerce is active)
            $best_sellers = array();
            if ($needed > 0 && GP_MOST_POPULAR_ENABLE_BEST_SELLERS_FALLBACK) {
                $best_sellers = gp_most_popular_get_best_sellers($needed, $manual_items);
            }

            // Combine manual + best-sellers
            $all_item_ids = array_merge($manual_items, $best_sellers);

            if (empty($all_item_ids)) {
                return array();
            }

            // Use WPGraphQL's DataSource to properly load items
            return array_filter(array_map(function($item_id) use ($context) {
                return \WPGraphQL\Data\DataSource::resolve_post_object($item_id, $context);
            }, $all_item_ids));
        }
    ));
}
add_action('graphql_register_types', 'gp_most_popular_register_graphql_resolver');

/**
 * Create default settings post on plugin activation
 */
function gp_most_popular_create_default_post() {
    $existing = get_posts(array(
        'post_type' => 'popular_settings',
        'posts_per_page' => 1,
        'post_status' => 'publish',
    ));

    if (empty($existing)) {
        $post_id = wp_insert_post(array(
            'post_title' => 'Popular Settings',
            'post_type' => 'popular_settings',
            'post_status' => 'publish',
            'comment_status' => 'closed',
            'ping_status' => 'closed',
        ));

        if ($post_id && function_exists('update_field')) {
            update_field('popular_title', GP_MOST_POPULAR_DEFAULT_TITLE, $post_id);
            update_field('popular_description', GP_MOST_POPULAR_DEFAULT_DESCRIPTION, $post_id);
        }
    }
}
register_activation_hook(__FILE__, 'gp_most_popular_create_default_post');
