<?php
/**
 * Plugin Name: GPP Stripe
 * Description: Stripe checkout scaffold for WordPress / WooCommerce workspaces.
 * Version: 0.1.0
 * Author: GrasshopperPebbles
 */

if (!defined('ABSPATH')) {
    exit;
}

define('GPP_STRIPE_VERSION', '0.1.0');

function gpp_stripe_publishable_key(): string {
    return getenv('STRIPE_PUBLISHABLE_KEY') ?: '';
}
