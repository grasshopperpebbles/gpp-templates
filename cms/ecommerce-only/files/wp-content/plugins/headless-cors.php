<?php
/**
 * Plugin Name: Headless CORS
 * Description: Adds CORS headers for headless WordPress (GraphQL + REST API)
 * Version: 1.0.0
 * Author: GrassHopper Pebbles
 * Text Domain: headless-cors
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Get allowed origins from WordPress options or environment.
 * Falls back to FRONTEND_URL constant if defined, otherwise allows localhost:3000.
 */
function gp_headless_cors_get_origins() {
    $origins = get_option('headless_cors_allowed_origins', '');
    if (!empty($origins)) {
        return array_map('trim', explode(',', $origins));
    }
    if (defined('FRONTEND_URL') && FRONTEND_URL) {
        return array(rtrim(FRONTEND_URL, '/'));
    }
    return array('http://localhost:3000');
}

/**
 * Check if the request origin is allowed and return it, or false.
 */
function gp_headless_cors_check_origin() {
    $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
    if (empty($origin)) {
        return false;
    }

    $allowed = gp_headless_cors_get_origins();
    foreach ($allowed as $allowed_origin) {
        if ($allowed_origin === '*' || $origin === $allowed_origin) {
            return $origin;
        }
    }
    return false;
}

/**
 * Send CORS headers.
 */
function gp_headless_cors_send_headers() {
    $origin = gp_headless_cors_check_origin();
    if ($origin) {
        header("Access-Control-Allow-Origin: $origin");
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, woocommerce-session');
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Max-Age: 86400');
    }
}

/**
 * Handle preflight OPTIONS requests early.
 */
function gp_headless_cors_handle_preflight() {
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        gp_headless_cors_send_headers();
        status_header(204);
        exit;
    }
}
add_action('init', 'gp_headless_cors_handle_preflight', 1);

/**
 * Add CORS headers to REST API responses.
 */
function gp_headless_cors_rest_headers($response) {
    $origin = gp_headless_cors_check_origin();
    if ($origin) {
        $response->header('Access-Control-Allow-Origin', $origin);
        $response->header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        $response->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, woocommerce-session');
        $response->header('Access-Control-Allow-Credentials', 'true');
    }
    return $response;
}
add_filter('rest_post_dispatch', 'gp_headless_cors_rest_headers');

/**
 * Add CORS headers to GraphQL responses.
 */
function gp_headless_cors_graphql_headers($response) {
    gp_headless_cors_send_headers();
    return $response;
}
add_filter('graphql_response_headers_to_send', 'gp_headless_cors_graphql_headers');

/**
 * Also hook into send_headers for general coverage.
 */
add_action('send_headers', 'gp_headless_cors_send_headers');
