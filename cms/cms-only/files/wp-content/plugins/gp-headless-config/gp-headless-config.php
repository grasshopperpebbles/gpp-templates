<?php
/**
 * Plugin Name: GP Headless Config
 * Plugin URI: https://github.com/yourusername/gp-headless-config
 * Description: Centralized configuration management for headless Next.js frontend. Stores API keys, measurement IDs, and other config via GraphQL.
 * Version: 1.0.0
 * Author: Your Name
 * Author URI: https://yourwebsite.com
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: gp-headless-config
 * Requires at least: 6.0
 * Requires PHP: 8.0
 *
 * @package HeadlessConfig
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('HEADLESS_CONFIG_VERSION', '1.0.0');
define('HEADLESS_CONFIG_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('HEADLESS_CONFIG_PLUGIN_URL', plugin_dir_url(__FILE__));

/**
 * Main GP Headless Config Class
 */
class Headless_Config {

    /**
     * Instance of this class
     */
    private static $instance = null;

    /**
     * Get instance
     */
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Constructor
     */
    private function __construct() {
        // Initialize plugin
        add_action('admin_menu', [$this, 'add_admin_menu']);
        add_action('admin_init', [$this, 'register_settings']);
        add_action('graphql_register_types', [$this, 'register_graphql_fields']);
    }

    /**
     * Add admin menu
     */
    public function add_admin_menu() {
        add_options_page(
            __('GP Headless Config', 'gp-headless-config'),
            __('GP Headless Config', 'gp-headless-config'),
            'manage_options',
            'gp-headless-config',
            [$this, 'render_settings_page']
        );
    }

    /**
     * Register settings
     */
    public function register_settings() {
        // Register settings group
        register_setting('headless_config_group', 'headless_config_options', [
            'sanitize_callback' => [$this, 'sanitize_options']
        ]);

        // Analytics Section
        add_settings_section(
            'headless_config_analytics',
            __('Analytics & Monitoring', 'gp-headless-config'),
            [$this, 'render_analytics_section'],
            'gp-headless-config'
        );

        add_settings_field(
            'ga4_measurement_id',
            __('GA4 Measurement ID', 'gp-headless-config'),
            [$this, 'render_text_field'],
            'gp-headless-config',
            'headless_config_analytics',
            [
                'field' => 'ga4_measurement_id',
                'placeholder' => 'G-XXXXXXXXXX',
                'description' => 'Google Analytics 4 Measurement ID from https://analytics.google.com'
            ]
        );

        add_settings_field(
            'sentry_dsn',
            __('Sentry DSN', 'gp-headless-config'),
            [$this, 'render_text_field'],
            'gp-headless-config',
            'headless_config_analytics',
            [
                'field' => 'sentry_dsn',
                'placeholder' => 'https://examplePublicKey@o0.ingest.sentry.io/0',
                'description' => 'Sentry Data Source Name from https://sentry.io'
            ]
        );

        add_settings_field(
            'sentry_environment',
            __('Sentry Environment', 'gp-headless-config'),
            [$this, 'render_text_field'],
            'gp-headless-config',
            'headless_config_analytics',
            [
                'field' => 'sentry_environment',
                'placeholder' => 'production',
                'description' => 'Environment name (development, staging, production)'
            ]
        );

        // AWS Section
        add_settings_section(
            'headless_config_aws',
            __('AWS CloudWatch', 'gp-headless-config'),
            [$this, 'render_aws_section'],
            'gp-headless-config'
        );

        add_settings_field(
            'cloudwatch_log_group',
            __('CloudWatch Log Group', 'gp-headless-config'),
            [$this, 'render_text_field'],
            'gp-headless-config',
            'headless_config_aws',
            [
                'field' => 'cloudwatch_log_group',
                'placeholder' => '/aws/nextjs/production',
                'description' => 'CloudWatch Log Group name for Next.js logs'
            ]
        );

        add_settings_field(
            'cloudwatch_region',
            __('AWS Region', 'gp-headless-config'),
            [$this, 'render_text_field'],
            'gp-headless-config',
            'headless_config_aws',
            [
                'field' => 'cloudwatch_region',
                'placeholder' => 'us-east-1',
                'description' => 'AWS region for CloudWatch logs'
            ]
        );

        // Site Configuration Section
        add_settings_section(
            'headless_config_site',
            __('Site Configuration', 'gp-headless-config'),
            [$this, 'render_site_section'],
            'gp-headless-config'
        );

        add_settings_field(
            'frontend_url',
            __('Frontend URL', 'gp-headless-config'),
            [$this, 'render_text_field'],
            'gp-headless-config',
            'headless_config_site',
            [
                'field' => 'frontend_url',
                'placeholder' => 'https://yoursite.com',
                'description' => 'Your Next.js frontend URL'
            ]
        );

        add_settings_field(
            'environment',
            __('Environment', 'gp-headless-config'),
            [$this, 'render_select_field'],
            'gp-headless-config',
            'headless_config_site',
            [
                'field' => 'environment',
                'options' => [
                    'development' => 'Development',
                    'staging' => 'Staging',
                    'production' => 'Production'
                ],
                'description' => 'Current environment'
            ]
        );

        // Email Settings Section
        add_settings_section(
            'headless_config_email',
            __('Email Settings (Resend)', 'gp-headless-config'),
            [$this, 'render_email_section'],
            'gp-headless-config'
        );

        add_settings_field(
            'resend_enabled',
            __('Enable Resend Emails', 'gp-headless-config'),
            [$this, 'render_checkbox_field'],
            'gp-headless-config',
            'headless_config_email',
            [
                'field' => 'resend_enabled',
                'label' => 'Send branded order confirmation emails via Resend',
                'description' => 'When disabled, only Stripe receipts will be sent. Stripe receipts are always sent regardless of this setting.'
            ]
        );

        add_settings_field(
            'resend_from_email',
            __('From Email', 'gp-headless-config'),
            [$this, 'render_text_field'],
            'gp-headless-config',
            'headless_config_email',
            [
                'field' => 'resend_from_email',
                'placeholder' => 'orders@foreverunbothered.com',
                'description' => 'Email address to send from (must be verified in Resend)'
            ]
        );

        add_settings_field(
            'resend_from_name',
            __('From Name', 'gp-headless-config'),
            [$this, 'render_text_field'],
            'gp-headless-config',
            'headless_config_email',
            [
                'field' => 'resend_from_name',
                'placeholder' => 'Forever Unbothered',
                'description' => 'Name to display as the email sender'
            ]
        );
    }

    /**
     * Sanitize options
     */
    public function sanitize_options($input) {
        $sanitized = [];

        if (isset($input['ga4_measurement_id'])) {
            $sanitized['ga4_measurement_id'] = sanitize_text_field($input['ga4_measurement_id']);
        }

        if (isset($input['sentry_dsn'])) {
            $sanitized['sentry_dsn'] = esc_url_raw($input['sentry_dsn']);
        }

        if (isset($input['sentry_environment'])) {
            $sanitized['sentry_environment'] = sanitize_text_field($input['sentry_environment']);
        }

        if (isset($input['cloudwatch_log_group'])) {
            $sanitized['cloudwatch_log_group'] = sanitize_text_field($input['cloudwatch_log_group']);
        }

        if (isset($input['cloudwatch_region'])) {
            $sanitized['cloudwatch_region'] = sanitize_text_field($input['cloudwatch_region']);
        }

        if (isset($input['frontend_url'])) {
            $sanitized['frontend_url'] = esc_url_raw($input['frontend_url']);
        }

        if (isset($input['environment'])) {
            $sanitized['environment'] = sanitize_text_field($input['environment']);
        }

        // Email settings
        $sanitized['resend_enabled'] = isset($input['resend_enabled']) ? 1 : 0;

        if (isset($input['resend_from_email'])) {
            $sanitized['resend_from_email'] = sanitize_email($input['resend_from_email']);
        }

        if (isset($input['resend_from_name'])) {
            $sanitized['resend_from_name'] = sanitize_text_field($input['resend_from_name']);
        }

        return $sanitized;
    }

    /**
     * Render settings page
     */
    public function render_settings_page() {
        ?>
        <div class="wrap">
            <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
            <p>Configure settings for your headless Next.js frontend. These settings are exposed via GraphQL.</p>
            <form action="options.php" method="post">
                <?php
                settings_fields('headless_config_group');
                do_settings_sections('gp-headless-config');
                submit_button(__('Save Settings', 'gp-headless-config'));
                ?>
            </form>

            <div class="card" style="margin-top: 20px;">
                <h2>GraphQL Query Example</h2>
                <p>Use this query in your Next.js app to fetch configuration:</p>
                <pre style="background: #f5f5f5; padding: 15px; border-radius: 4px; overflow-x: auto;">
query GetHeadlessConfig {
  headlessConfig {
    ga4MeasurementId
    sentryDsn
    sentryEnvironment
    cloudwatchLogGroup
    cloudwatchRegion
    frontendUrl
    environment
    # Email settings
    resendEnabled
    resendFromEmail
    resendFromName
  }
}</pre>
            </div>
        </div>
        <?php
    }

    /**
     * Render section descriptions
     */
    public function render_analytics_section() {
        echo '<p>' . esc_html__('Configure analytics and error tracking services.', 'gp-headless-config') . '</p>';
    }

    public function render_aws_section() {
        echo '<p>' . esc_html__('Configure AWS CloudWatch logging.', 'gp-headless-config') . '</p>';
    }

    public function render_site_section() {
        echo '<p>' . esc_html__('General site configuration.', 'gp-headless-config') . '</p>';
    }

    public function render_email_section() {
        echo '<p>' . esc_html__('Configure Resend email service for transactional emails. Stripe receipts are always sent automatically.', 'gp-headless-config') . '</p>';
    }

    /**
     * Render text field
     */
    public function render_text_field($args) {
        $options = get_option('headless_config_options', []);
        $value = isset($options[$args['field']]) ? $options[$args['field']] : '';
        ?>
        <input
            type="text"
            name="headless_config_options[<?php echo esc_attr($args['field']); ?>]"
            value="<?php echo esc_attr($value); ?>"
            placeholder="<?php echo esc_attr($args['placeholder']); ?>"
            class="regular-text"
        />
        <?php if (isset($args['description'])): ?>
            <p class="description"><?php echo esc_html($args['description']); ?></p>
        <?php endif; ?>
        <?php
    }

    /**
     * Render select field
     */
    public function render_select_field($args) {
        $options = get_option('headless_config_options', []);
        $value = isset($options[$args['field']]) ? $options[$args['field']] : '';
        ?>
        <select name="headless_config_options[<?php echo esc_attr($args['field']); ?>]">
            <?php foreach ($args['options'] as $option_value => $option_label): ?>
                <option value="<?php echo esc_attr($option_value); ?>" <?php selected($value, $option_value); ?>>
                    <?php echo esc_html($option_label); ?>
                </option>
            <?php endforeach; ?>
        </select>
        <?php if (isset($args['description'])): ?>
            <p class="description"><?php echo esc_html($args['description']); ?></p>
        <?php endif; ?>
        <?php
    }

    /**
     * Render checkbox field
     */
    public function render_checkbox_field($args) {
        $options = get_option('headless_config_options', []);
        $checked = isset($options[$args['field']]) ? (bool) $options[$args['field']] : false;
        ?>
        <label>
            <input
                type="checkbox"
                name="headless_config_options[<?php echo esc_attr($args['field']); ?>]"
                value="1"
                <?php checked($checked, true); ?>
            />
            <?php if (isset($args['label'])): ?>
                <?php echo esc_html($args['label']); ?>
            <?php endif; ?>
        </label>
        <?php if (isset($args['description'])): ?>
            <p class="description"><?php echo esc_html($args['description']); ?></p>
        <?php endif; ?>
        <?php
    }

    /**
     * Register GraphQL fields
     */
    public function register_graphql_fields() {
        // Register newsletter subscribe mutation
        register_graphql_mutation('subscribeToNewsletter', [
            'inputFields' => [
                'email' => [
                    'type' => ['non_null' => 'String'],
                    'description' => __('Email address to subscribe', 'gp-headless-config'),
                ],
            ],
            'outputFields' => [
                'success' => [
                    'type' => 'Boolean',
                    'description' => __('Whether the subscription was successful', 'gp-headless-config'),
                ],
                'message' => [
                    'type' => 'String',
                    'description' => __('Response message', 'gp-headless-config'),
                ],
            ],
            'mutateAndGetPayload' => function($input) {
                $email = sanitize_email($input['email']);

                if (!is_email($email)) {
                    return [
                        'success' => false,
                        'message' => 'Invalid email address',
                    ];
                }

                // Get existing subscribers
                $subscribers = get_option('headless_newsletter_subscribers', []);

                // Check if already subscribed
                if (in_array($email, $subscribers)) {
                    return [
                        'success' => true,
                        'message' => 'You are already subscribed!',
                    ];
                }

                // Add new subscriber
                $subscribers[] = $email;
                update_option('headless_newsletter_subscribers', $subscribers);

                return [
                    'success' => true,
                    'message' => 'Successfully subscribed to newsletter!',
                ];
            },
        ]);


        // Register headlessConfig query
        register_graphql_field('RootQuery', 'headlessConfig', [
            'type' => 'HeadlessConfig',
            'description' => __('Configuration settings for headless Next.js frontend', 'gp-headless-config'),
            'resolve' => function() {
                $options = get_option('headless_config_options', []);

                return [
                    'ga4MeasurementId' => $options['ga4_measurement_id'] ?? null,
                    'sentryDsn' => $options['sentry_dsn'] ?? null,
                    'sentryEnvironment' => $options['sentry_environment'] ?? 'production',
                    'cloudwatchLogGroup' => $options['cloudwatch_log_group'] ?? null,
                    'cloudwatchRegion' => $options['cloudwatch_region'] ?? 'us-east-1',
                    'frontendUrl' => $options['frontend_url'] ?? null,
                    'environment' => $options['environment'] ?? 'production',
                    // Email settings
                    'resendEnabled' => isset($options['resend_enabled']) ? (bool) $options['resend_enabled'] : false,
                    'resendFromEmail' => $options['resend_from_email'] ?? null,
                    'resendFromName' => $options['resend_from_name'] ?? null,
                ];
            }
        ]);

        // Register HeadlessConfig type
        register_graphql_object_type('HeadlessConfig', [
            'description' => __('Headless configuration object', 'gp-headless-config'),
            'fields' => [
                'ga4MeasurementId' => [
                    'type' => 'String',
                    'description' => __('Google Analytics 4 Measurement ID', 'gp-headless-config'),
                ],
                'sentryDsn' => [
                    'type' => 'String',
                    'description' => __('Sentry Data Source Name for error tracking', 'gp-headless-config'),
                ],
                'sentryEnvironment' => [
                    'type' => 'String',
                    'description' => __('Sentry environment name', 'gp-headless-config'),
                ],
                'cloudwatchLogGroup' => [
                    'type' => 'String',
                    'description' => __('AWS CloudWatch Log Group name', 'gp-headless-config'),
                ],
                'cloudwatchRegion' => [
                    'type' => 'String',
                    'description' => __('AWS region for CloudWatch', 'gp-headless-config'),
                ],
                'frontendUrl' => [
                    'type' => 'String',
                    'description' => __('Next.js frontend URL', 'gp-headless-config'),
                ],
                'environment' => [
                    'type' => 'String',
                    'description' => __('Current environment (development, staging, production)', 'gp-headless-config'),
                ],
                // Email settings
                'resendEnabled' => [
                    'type' => 'Boolean',
                    'description' => __('Whether Resend email service is enabled', 'gp-headless-config'),
                ],
                'resendFromEmail' => [
                    'type' => 'String',
                    'description' => __('Email address to send from via Resend', 'gp-headless-config'),
                ],
                'resendFromName' => [
                    'type' => 'String',
                    'description' => __('Display name for Resend emails', 'gp-headless-config'),
                ],
            ],
        ]);
    }
}

// Initialize plugin
Headless_Config::get_instance();
