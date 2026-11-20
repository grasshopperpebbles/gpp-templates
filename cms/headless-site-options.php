<?php
/**
 * Plugin Name: Headless Site Options
 * Description: Custom site options for headless WordPress sites. Access via Settings > Site Options.
 * Version: 1.1.0
 * Author: GPP
 */

if (!defined('ABSPATH')) exit;

class Headless_Site_Options {

    private $options_group = 'headless_site_options';
    private $options_page = 'headless-site-options';

    public function __construct() {
        add_action('admin_menu', [$this, 'add_options_page']);
        add_action('admin_init', [$this, 'register_settings']);
        add_action('rest_api_init', [$this, 'register_rest_routes']);
        add_action('graphql_register_types', [$this, 'register_graphql_fields']);
    }

    public function add_options_page() {
        add_options_page(
            'Site Options',
            'Site Options',
            'manage_options',
            $this->options_page,
            [$this, 'render_options_page']
        );
    }

    public function register_settings() {
        add_settings_section('headless_site_type_section', 'Site Configuration', null, $this->options_page);
        $this->add_field('site_type', 'Site Type', 'headless_site_type_section', 'select', [
            'ecommerce_cms' => 'E-commerce with CMS',
            'cms_ecommerce' => 'CMS with E-commerce',
            'cms_only' => 'CMS only',
            'ecommerce_only' => 'E-commerce only'
        ]);
        $this->add_field('homepage_type', 'Homepage Type', 'headless_site_type_section', 'select', [
            'products' => 'Products',
            'blog' => 'Blog/Content'
        ]);

        add_settings_section('headless_copyright_section', 'Copyright', null, $this->options_page);
        $this->add_field('copyright_name', 'Business/Entity Name', 'headless_copyright_section', 'text', [], 'Name shown in copyright notice.');
        $this->add_field('copyright_year', 'Start Year', 'headless_copyright_section', 'text', [], 'Year the site launched. Defaults to current year.');
        $this->add_field('copyright_text', 'Custom Copyright Text', 'headless_copyright_section', 'text', [], 'Overrides auto-generated copyright if set.');

        add_settings_section('headless_contact_section', 'Contact', null, $this->options_page);
        $this->add_field('contact_email', 'Email', 'headless_contact_section');
        $this->add_field('contact_phone', 'Phone', 'headless_contact_section');

        add_settings_section('headless_social_section', 'Social Media', null, $this->options_page);
        $this->add_field('social_facebook', 'Facebook URL', 'headless_social_section');
        $this->add_field('social_instagram', 'Instagram URL', 'headless_social_section');
        $this->add_field('social_twitter', 'Twitter/X URL', 'headless_social_section');
        $this->add_field('social_youtube', 'YouTube URL', 'headless_social_section');
        $this->add_field('social_linkedin', 'LinkedIn URL', 'headless_social_section');
        $this->add_field('social_tiktok', 'TikTok URL', 'headless_social_section');

        add_settings_section('headless_blog_section', 'Blog Settings', function() {
            echo '<p>Configure blog-specific settings.</p>';
        }, $this->options_page);
        $this->add_field('blog_name', 'Blog Name', 'headless_blog_section', 'text', [], 'Optional. Falls back to site name if empty.');
        $this->add_field('blog_description', 'Blog Description', 'headless_blog_section', 'text', [], 'Optional. Falls back to site tagline if empty.');
        $this->add_field('posts_per_page', 'Posts Per Page', 'headless_blog_section', 'number');
    }

    private function add_field($id, $label, $section, $type = 'text', $options = [], $description = '') {
        $option_name = 'headless_' . $id;
        $sanitize = ($type === 'number') ? 'absint' : 'sanitize_text_field';
        register_setting($this->options_group, $option_name, ['sanitize_callback' => $sanitize, 'default' => '']);
        add_settings_field($option_name, $label, function() use ($option_name, $type, $options, $description) {
            $value = get_option($option_name, '');
            if ($type === 'select') {
                echo '<select name="' . esc_attr($option_name) . '" class="regular-text">';
                foreach ($options as $key => $lbl) {
                    echo '<option value="' . esc_attr($key) . '" ' . selected($value, $key, false) . '>' . esc_html($lbl) . '</option>';
                }
                echo '</select>';
            } elseif ($type === 'number') {
                echo '<input type="number" name="' . esc_attr($option_name) . '" value="' . esc_attr($value) . '" class="small-text" min="1" max="100" />';
            } else {
                echo '<input type="text" name="' . esc_attr($option_name) . '" value="' . esc_attr($value) . '" class="regular-text" />';
            }
            if ($description) echo '<p class="description">' . esc_html($description) . '</p>';
        }, $this->options_page, $section);
    }

    public function render_options_page() {
        if (!current_user_can('manage_options')) return;
        ?>
        <div class="wrap">
            <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
            <form action="options.php" method="post">
                <?php settings_fields($this->options_group); do_settings_sections($this->options_page); submit_button('Save Settings'); ?>
            </form>
            <hr /><h2>API Access</h2>
            <p><strong>REST API:</strong> <code><?php echo esc_url(rest_url('headless/v1/site-options')); ?></code></p>
        </div>
        <?php
    }

    public function register_rest_routes() {
        register_rest_route('headless/v1', '/site-options', [
            'methods' => 'GET',
            'callback' => [$this, 'get_site_options'],
            'permission_callback' => '__return_true'
        ]);
        register_rest_route('headless/v1', '/site-options/social', [
            'methods' => 'POST',
            'callback' => [$this, 'update_social_links'],
            'permission_callback' => function () {
                return current_user_can('edit_others_posts');
            }
        ]);
    }

    private $social_keys = ['facebook', 'instagram', 'twitter', 'youtube', 'linkedin', 'tiktok'];

    /**
     * Write social links. Each value must be '' (clears it) or an https:// URL.
     * All values are checked before any is written; unknown keys are ignored.
     */
    public function update_social_links(WP_REST_Request $request) {
        $params = $request->get_json_params();
        if (!is_array($params)) $params = [];

        $updates = [];
        foreach ($this->social_keys as $key) {
            if (!array_key_exists($key, $params)) continue;
            $value = $params[$key];
            if (!is_string($value)) {
                return new WP_Error('invalid_social_link', sprintf('%s must be a string.', $key), ['status' => 400]);
            }
            $value = trim($value);
            if ($value === '') {
                $updates[$key] = '';
                continue;
            }
            $clean = esc_url_raw($value, ['https']);
            if (stripos($value, 'https://') !== 0 || $clean === '' || stripos($clean, 'https://') !== 0) {
                return new WP_Error('invalid_social_link', sprintf('%s must be an https:// URL or empty.', $key), ['status' => 400]);
            }
            $updates[$key] = $clean;
        }

        foreach ($updates as $key => $value) {
            update_option('headless_social_' . $key, $value);
        }

        $stored = [];
        foreach ($this->social_keys as $key) {
            $stored[$key] = get_option('headless_social_' . $key, '');
        }
        return rest_ensure_response($stored);
    }

    private function get_site_logo_url() {
        $custom_logo_id = get_theme_mod('custom_logo');
        if ($custom_logo_id) {
            return wp_get_attachment_image_url($custom_logo_id, 'full');
        }
        return null;
    }

    public function get_site_options() {
        $blog_name = get_option('headless_blog_name', '');
        $blog_desc = get_option('headless_blog_description', '');
        $posts_per_page = get_option('headless_posts_per_page', '');
        return [
            'siteName' => get_bloginfo('name'),
            'siteDescription' => get_bloginfo('description'),
            'siteLogo' => $this->get_site_logo_url(),
            'copyright' => [
                'name' => get_option('headless_copyright_name', ''),
                'year' => get_option('headless_copyright_year', '') ?: (string)date('Y'),
                'text' => get_option('headless_copyright_text', ''),
            ],
            'contact' => [
                'email' => get_option('headless_contact_email', ''),
                'phone' => get_option('headless_contact_phone', ''),
            ],
            'social' => [
                'facebook' => get_option('headless_social_facebook', ''),
                'instagram' => get_option('headless_social_instagram', ''),
                'twitter' => get_option('headless_social_twitter', ''),
                'youtube' => get_option('headless_social_youtube', ''),
                'linkedin' => get_option('headless_social_linkedin', ''),
                'tiktok' => get_option('headless_social_tiktok', ''),
            ],
            'blog' => [
                'name' => $blog_name ?: get_bloginfo('name'),
                'description' => $blog_desc ?: get_bloginfo('description'),
                'postsPerPage' => $posts_per_page ? (int)$posts_per_page : (int)get_option('posts_per_page', 10),
            ],
            'siteType' => get_option('headless_site_type', 'ecommerce_cms'),
            'homepageType' => get_option('headless_homepage_type', 'products')
        ];
    }

    public function register_graphql_fields() {
        if (!function_exists('register_graphql_field')) return;

        register_graphql_object_type('CopyrightOptions', [
            'description' => 'Copyright options',
            'fields' => [
                'name' => ['type' => 'String', 'description' => 'Business/entity name'],
                'year' => ['type' => 'String', 'description' => 'Start year'],
                'text' => ['type' => 'String', 'description' => 'Custom copyright text'],
            ]
        ]);

        register_graphql_object_type('ContactOptions', [
            'description' => 'Contact options',
            'fields' => [
                'email' => ['type' => 'String'],
                'phone' => ['type' => 'String'],
            ]
        ]);

        register_graphql_object_type('SocialOptions', [
            'description' => 'Social media URLs',
            'fields' => [
                'facebook' => ['type' => 'String'],
                'instagram' => ['type' => 'String'],
                'twitter' => ['type' => 'String'],
                'youtube' => ['type' => 'String'],
                'linkedin' => ['type' => 'String'],
                'tiktok' => ['type' => 'String'],
            ]
        ]);

        register_graphql_object_type('BlogOptions', [
            'description' => 'Blog-specific options',
            'fields' => [
                'name' => ['type' => 'String'],
                'description' => ['type' => 'String'],
                'postsPerPage' => ['type' => 'Int'],
            ]
        ]);

        register_graphql_object_type('SiteOptions', [
            'description' => 'Custom site options',
            'fields' => [
                'siteName' => ['type' => 'String', 'description' => 'WordPress site name'],
                'siteDescription' => ['type' => 'String', 'description' => 'WordPress site tagline'],
                'siteLogo' => ['type' => 'String', 'description' => 'URL of the site logo set via Customizer'],
                'copyright' => ['type' => 'CopyrightOptions'],
                'contact' => ['type' => 'ContactOptions'],
                'social' => ['type' => 'SocialOptions'],
                'siteType' => ['type' => 'String'],
                'homepageType' => ['type' => 'String'],
                'blog' => ['type' => 'BlogOptions'],
            ]
        ]);

        register_graphql_field('RootQuery', 'siteOptions', [
            'type' => 'SiteOptions',
            'description' => 'Get custom site options',
            'resolve' => function() {
                return $this->get_site_options();
            }
        ]);
    }
}

new Headless_Site_Options();
