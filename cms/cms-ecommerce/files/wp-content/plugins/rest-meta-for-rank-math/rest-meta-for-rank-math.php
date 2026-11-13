<?php
/**
 * Plugin Name:       REST Meta for Rank Math
 * Description:       Lets authorised apps read and write Rank Math's per-post SEO title, description, focus keywords and primary category through the core WordPress REST API.
 * Version:           1.0.0
 * Requires at least: 6.0
 * Requires PHP:      7.4
 * Author:            gpp
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       rest-meta-for-rank-math
 *
 * @package RestMetaForRankMath
 */

defined( 'ABSPATH' ) || exit;

/**
 * The Rank Math post meta keys this plugin exposes, with their REST type and sanitizer.
 *
 * @return array<string, array{type: string, sanitize: callable, description: string}>
 */
function rmrm_fields() {
	return array(
		'rank_math_title'            => array(
			'type'        => 'string',
			'sanitize'    => 'sanitize_text_field',
			'description' => __( 'Rank Math SEO title. Rank Math variables such as %sep% are allowed.', 'rest-meta-for-rank-math' ),
		),
		'rank_math_description'      => array(
			'type'        => 'string',
			'sanitize'    => 'sanitize_textarea_field',
			'description' => __( 'Rank Math meta description.', 'rest-meta-for-rank-math' ),
		),
		'rank_math_focus_keyword'    => array(
			'type'        => 'string',
			'sanitize'    => 'rmrm_sanitize_keywords',
			'description' => __( 'Comma-separated keywords. The first is the focus keyword.', 'rest-meta-for-rank-math' ),
		),
		'rank_math_primary_category' => array(
			'type'        => 'integer',
			'sanitize'    => 'absint',
			'description' => __( 'Term ID of the primary category.', 'rest-meta-for-rank-math' ),
		),
	);
}

/**
 * Whether Rank Math is loaded.
 *
 * @return bool
 */
function rmrm_rank_math_active() {
	return defined( 'RANK_MATH_VERSION' ) || class_exists( 'RankMath' );
}

/**
 * Trim each keyword, drop empty ones, and join them with commas.
 *
 * @param mixed $value Raw value.
 * @return string
 */
function rmrm_sanitize_keywords( $value ) {
	$parts = array_map( 'sanitize_text_field', explode( ',', (string) $value ) );
	$parts = array_filter( array_map( 'trim', $parts ), 'strlen' );
	return implode( ',', $parts );
}

/**
 * Only users who can edit the post may write its SEO fields.
 *
 * @param bool   $allowed   Whether the user can edit the meta.
 * @param string $meta_key  Meta key.
 * @param int    $object_id Post ID.
 * @return bool
 */
function rmrm_can_edit( $allowed, $meta_key, $object_id ) {
	return current_user_can( 'edit_post', (int) $object_id );
}

/**
 * Register the fields for REST on each post type. A key that another plugin already exposes in
 * REST is left alone; a key registered without REST is re-registered with it.
 */
function rmrm_register_meta() {
	if ( ! rmrm_rank_math_active() ) {
		return;
	}

	/**
	 * Post types whose Rank Math fields are exposed in REST.
	 *
	 * @param string[] $post_types Default: post and page.
	 */
	$post_types = (array) apply_filters( 'rmrm_post_types', array( 'post', 'page' ) );

	foreach ( $post_types as $post_type ) {
		// Core REST only returns meta for post types that support custom fields (post and page do).
		$type_object = get_post_type_object( $post_type );
		if ( ! $type_object || empty( $type_object->show_in_rest ) || ! post_type_supports( $post_type, 'custom-fields' ) ) {
			continue;
		}
		$registered = array_merge( get_registered_meta_keys( 'post' ), get_registered_meta_keys( 'post', $post_type ) );

		foreach ( rmrm_fields() as $key => $field ) {
			if ( 'rank_math_primary_category' === $key && ! is_object_in_taxonomy( $post_type, 'category' ) ) {
				continue;
			}
			if ( isset( $registered[ $key ] ) ) {
				if ( ! empty( $registered[ $key ]['show_in_rest'] ) ) {
					continue;
				}
				unregister_post_meta( $post_type, $key );
			}
			register_post_meta(
				$post_type,
				$key,
				array(
					'type'              => $field['type'],
					'description'       => $field['description'],
					'single'            => true,
					'sanitize_callback' => $field['sanitize'],
					'auth_callback'     => 'rmrm_can_edit',
					'show_in_rest'      => array(
						'schema' => array(
							'type'    => $field['type'],
							'context' => array( 'edit' ),
						),
					),
				)
			);
		}
	}
}
add_action( 'init', 'rmrm_register_meta', 20 );
