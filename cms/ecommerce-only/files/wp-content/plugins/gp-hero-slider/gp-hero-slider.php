<?php
/**
 * Plugin Name: GP Hero Slider
 * Plugin URI: https://github.com/lesgreen/headless-wordpress-starter
 * Description: Rotating hero images for blog site homepages using ACF fields and WPGraphQL
 * Version: 1.0.0
 * Author: GrassHopper Pebbles
 * Requires at least: 6.0
 * Requires PHP: 7.4
 * Text Domain: gp-hero-slider
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Register Hero Slide custom post type
 */
function gp_hero_slider_register_post_type() {
    register_post_type('hero_slide', array(
        'labels' => array(
            'name' => 'Hero Slides',
            'singular_name' => 'Hero Slide',
            'menu_name' => 'Hero Slides',
            'add_new' => 'Add New Slide',
            'add_new_item' => 'Add New Hero Slide',
            'edit_item' => 'Edit Hero Slide',
            'view_item' => 'View Hero Slide',
            'all_items' => 'All Slides',
            'search_items' => 'Search Slides',
            'not_found' => 'No slides found',
            'not_found_in_trash' => 'No slides found in trash',
        ),
        'public' => true,
        'publicly_queryable' => true,
        'show_ui' => true,
        'show_in_menu' => true,
        'menu_icon' => 'dashicons-images-alt2',
        'menu_position' => 55,
        'supports' => array('title', 'thumbnail'),
        'capability_type' => 'post',
        'capabilities' => array(
            'create_posts' => 'manage_options',
        ),
        'map_meta_cap' => true,
        'has_archive' => false,
        'exclude_from_search' => true,
        'show_in_graphql' => true,
        'graphql_single_name' => 'HeroSlide',
        'graphql_plural_name' => 'HeroSlides',
    ));
}
add_action('init', 'gp_hero_slider_register_post_type');

/**
 * Register ACF fields for Hero Slides
 */
function gp_hero_slider_register_acf_fields() {
    if (function_exists('acf_add_local_field_group')) {
        acf_add_local_field_group(array(
            'key' => 'group_hero_slider',
            'title' => 'Hero Slide Settings',
            'fields' => array(
                array(
                    'key' => 'field_hero_subtitle',
                    'label' => 'Subtitle',
                    'name' => 'hero_subtitle',
                    'type' => 'text',
                    'instructions' => 'Optional subtitle displayed below the slide title',
                    'required' => 0,
                    'maxlength' => 200,
                    'show_in_graphql' => 1,
                    'graphql_field_name' => 'heroSubtitle',
                ),
                array(
                    'key' => 'field_hero_link_url',
                    'label' => 'Link URL',
                    'name' => 'hero_link_url',
                    'type' => 'url',
                    'instructions' => 'Optional CTA destination URL',
                    'required' => 0,
                    'show_in_graphql' => 1,
                    'graphql_field_name' => 'heroLinkUrl',
                ),
                array(
                    'key' => 'field_hero_link_text',
                    'label' => 'Link Text',
                    'name' => 'hero_link_text',
                    'type' => 'text',
                    'instructions' => 'CTA button label (e.g. "Learn More")',
                    'required' => 0,
                    'maxlength' => 50,
                    'show_in_graphql' => 1,
                    'graphql_field_name' => 'heroLinkText',
                ),
                array(
                    'key' => 'field_hero_sort_order',
                    'label' => 'Sort Order',
                    'name' => 'hero_sort_order',
                    'type' => 'number',
                    'instructions' => 'Display order (lower numbers appear first)',
                    'required' => 0,
                    'default_value' => 0,
                    'min' => 0,
                    'show_in_graphql' => 1,
                    'graphql_field_name' => 'heroSortOrder',
                ),
            ),
            'location' => array(
                array(
                    array(
                        'param' => 'post_type',
                        'operator' => '==',
                        'value' => 'hero_slide',
                    ),
                ),
            ),
            'menu_order' => 0,
            'position' => 'normal',
            'style' => 'default',
            'label_placement' => 'top',
            'instruction_placement' => 'label',
            'active' => true,
            'description' => 'Fields for hero slider slides',
            'show_in_graphql' => 1,
            'graphql_field_name' => 'heroSlideFields',
        ));
    }
}
add_action('acf/init', 'gp_hero_slider_register_acf_fields');

/**
 * Create a sample hero slide on plugin activation
 */
function gp_hero_slider_activate() {
    // Register the post type first so we can create posts
    gp_hero_slider_register_post_type();

    $existing = get_posts(array(
        'post_type' => 'hero_slide',
        'posts_per_page' => 1,
        'post_status' => 'publish',
    ));

    if (empty($existing)) {
        $post_id = wp_insert_post(array(
            'post_title' => 'Welcome',
            'post_type' => 'hero_slide',
            'post_status' => 'publish',
            'comment_status' => 'closed',
            'ping_status' => 'closed',
            'menu_order' => 0,
        ));

        if ($post_id && function_exists('update_field')) {
            update_field('hero_subtitle', 'Discover our latest content', $post_id);
            update_field('hero_link_url', '/', $post_id);
            update_field('hero_link_text', 'Explore', $post_id);
            update_field('hero_sort_order', 0, $post_id);
        }
    }
}
register_activation_hook(__FILE__, 'gp_hero_slider_activate');
