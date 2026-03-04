<?php
/**
 * Plugin Name: GP Featured Items
 * Plugin URI: https://github.com/lesgreen/headless-wordpress-starter
 * Description: Manage featured content sections on homepage using ACF (generic, works for any content type)
 * Version: 1.1.0
 * Author: Generic Headless WordPress Starter
 * Requires at least: 6.0
 * Requires PHP: 7.4
 * Text Domain: gp-featured-items
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Configuration Constants (with filter support for customization)
 */
if (!defined('GP_FEATURED_ITEMS_DEFAULT_TITLE')) {
    define('GP_FEATURED_ITEMS_DEFAULT_TITLE', apply_filters('gp_featured_items_default_title', 'Featured Items'));
}

if (!defined('GP_FEATURED_ITEMS_DEFAULT_DESCRIPTION')) {
    define('GP_FEATURED_ITEMS_DEFAULT_DESCRIPTION', apply_filters('gp_featured_items_default_description', 'Highlighted content from our collection'));
}

if (!defined('GP_FEATURED_ITEMS_MAX_ITEMS')) {
    define('GP_FEATURED_ITEMS_MAX_ITEMS', apply_filters('gp_featured_items_max_items', 12));
}

if (!defined('GP_FEATURED_ITEMS_MENU_LABEL')) {
    define('GP_FEATURED_ITEMS_MENU_LABEL', apply_filters('gp_featured_items_menu_label', 'Featured Items'));
}

// Support environment variables for headless setups
if (getenv('GP_FEATURED_ITEMS_TITLE')) {
    define('GP_FEATURED_ITEMS_DEFAULT_TITLE', getenv('GP_FEATURED_ITEMS_TITLE'));
}

if (getenv('GP_FEATURED_ITEMS_DESCRIPTION')) {
    define('GP_FEATURED_ITEMS_DEFAULT_DESCRIPTION', getenv('GP_FEATURED_ITEMS_DESCRIPTION'));
}

if (getenv('GP_FEATURED_ITEMS_MAX')) {
    define('GP_FEATURED_ITEMS_MAX_ITEMS', (int) getenv('GP_FEATURED_ITEMS_MAX'));
}

if (getenv('GP_FEATURED_ITEMS_MENU_LABEL')) {
    define('GP_FEATURED_ITEMS_MENU_LABEL', getenv('GP_FEATURED_ITEMS_MENU_LABEL'));
}

/**
 * Register Custom Post Type for Featured Items Settings
 * (Alternative to ACF Pro Options Pages)
 */
function gp_featured_items_register_post_type() {
    register_post_type('site_settings', array(
        'labels' => array(
            'name' => 'Site Settings',
            'singular_name' => 'Site Setting',
            'menu_name' => GP_FEATURED_ITEMS_MENU_LABEL,
            'add_new' => 'Edit Settings',
            'add_new_item' => 'Edit Site Settings',
            'edit_item' => 'Edit ' . GP_FEATURED_ITEMS_MENU_LABEL,
            'view_item' => 'View Settings',
        ),
        'public' => true,  // Must be public for GraphQL
        'publicly_queryable' => true,
        'show_ui' => true,
        'show_in_menu' => true,
        'menu_icon' => 'dashicons-star-filled',
        'menu_position' => 56,
        'supports' => array('title'),
        'capability_type' => 'post',
        'capabilities' => array(
            'create_posts' => 'manage_options', // Only admins can create
        ),
        'map_meta_cap' => true,
        'has_archive' => false,
        'exclude_from_search' => true,
        'show_in_graphql' => true,
        'graphql_single_name' => 'SiteSetting',
        'graphql_plural_name' => 'SiteSettings',
    ));
}
add_action('init', 'gp_featured_items_register_post_type');

/**
 * Register ACF Field Group for Featured Items
 */
function gp_featured_items_register_acf_fields() {
    // Check if ACF function exists
    if (function_exists('acf_add_local_field_group')) {
        acf_add_local_field_group(array(
            'key' => 'group_featured_items',
            'title' => 'Featured Items Settings',
            'fields' => array(
                // Title Field
                array(
                    'key' => 'field_featured_title',
                    'label' => 'Section Title',
                    'name' => 'featured_title',
                    'type' => 'text',
                    'instructions' => 'Enter the title for the featured items section',
                    'required' => 0,
                    'default_value' => GP_FEATURED_ITEMS_DEFAULT_TITLE,
                    'placeholder' => GP_FEATURED_ITEMS_DEFAULT_TITLE,
                    'prepend' => '',
                    'append' => '',
                    'maxlength' => 100,
                    'show_in_graphql' => 1,  // Expose to WPGraphQL
                    'graphql_field_name' => 'featuredTitle',
                ),
                // Description Field
                array(
                    'key' => 'field_featured_description',
                    'label' => 'Section Description',
                    'name' => 'featured_description',
                    'type' => 'textarea',
                    'instructions' => 'Enter the description for the featured items section',
                    'required' => 0,
                    'default_value' => GP_FEATURED_ITEMS_DEFAULT_DESCRIPTION,
                    'placeholder' => GP_FEATURED_ITEMS_DEFAULT_DESCRIPTION,
                    'maxlength' => 500,
                    'rows' => 3,
                    'new_lines' => '', // No formatting
                    'show_in_graphql' => 1,  // Expose to WPGraphQL
                    'graphql_field_name' => 'featuredDescription',
                ),
                // Featured Content Field (Relationship - supports Products, Posts, etc.)
                array(
                    'key' => 'field_featured_items',
                    'label' => 'Featured Content',
                    'name' => 'featured_items',
                    'type' => 'relationship',
                    'instructions' => 'Select content to feature on the homepage. Drag to reorder. Use the post type filter to select products, posts, or other content.',
                    'required' => 0,
                    'post_type' => array(),  // Empty = all post types available
                    'taxonomy' => array(),
                    'filters' => array(
                        0 => 'search',
                        1 => 'post_type',
                        2 => 'taxonomy',
                    ),
                    'elements' => array(
                        0 => 'featured_image',  // Show images in selector
                    ),
                    'min' => 0,
                    'max' => GP_FEATURED_ITEMS_MAX_ITEMS,
                    'return_format' => 'id',  // Return IDs
                    'show_in_graphql' => 1,  // Expose to WPGraphQL
                    'graphql_field_name' => 'featuredItems',
                ),
            ),
            'location' => array(
                array(
                    array(
                        'param' => 'post_type',
                        'operator' => '==',
                        'value' => 'site_settings',
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
            'description' => 'Fields for managing the featured items section on the homepage',
            'show_in_graphql' => 1,  // Make entire group available in WPGraphQL
            'graphql_field_name' => 'featuredItems',
        ));
    }
}
add_action('acf/init', 'gp_featured_items_register_acf_fields');

/**
 * Create default settings post on plugin activation
 */
function gp_featured_items_create_default_post() {
    // Check if settings post already exists
    $existing = get_posts(array(
        'post_type' => 'site_settings',
        'posts_per_page' => 1,
        'post_status' => 'publish',
    ));

    // Create if doesn't exist
    if (empty($existing)) {
        $post_id = wp_insert_post(array(
            'post_title' => 'Site Settings',
            'post_type' => 'site_settings',
            'post_status' => 'publish',
            'comment_status' => 'closed',
            'ping_status' => 'closed',
        ));

        // Set default ACF values
        if ($post_id && function_exists('update_field')) {
            update_field('featured_title', GP_FEATURED_ITEMS_DEFAULT_TITLE, $post_id);
            update_field('featured_description', GP_FEATURED_ITEMS_DEFAULT_DESCRIPTION, $post_id);
        }
    }
}
register_activation_hook(__FILE__, 'gp_featured_items_create_default_post');
