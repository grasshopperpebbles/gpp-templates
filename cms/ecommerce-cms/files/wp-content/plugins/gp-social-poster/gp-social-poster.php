<?php
/**
 * Plugin Name: GP Social Poster
 * Plugin URI: https://github.com/lesgreen/headless-wordpress-starter
 * Description: Auto-post to Mastodon, X/Twitter, and Pinterest when publishing posts
 * Version: 1.0.0
 * Author: GP Development
 * License: GPL v2 or later
 * Text Domain: gp-social-poster
 */

if (!defined('ABSPATH')) {
    exit;
}

class GP_Social_Poster {

    private static $instance = null;
    private $options;

    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        $this->options = get_option('gp_social_poster_options', []);

        // Admin hooks
        add_action('admin_menu', [$this, 'add_admin_menu']);
        add_action('admin_init', [$this, 'register_settings']);

        // Post publish hook
        add_action('publish_post', [$this, 'on_post_publish'], 10, 2);

        // Add meta box for manual posting
        add_action('add_meta_boxes', [$this, 'add_meta_boxes']);

        // AJAX handlers
        add_action('wp_ajax_gp_social_post_now', [$this, 'ajax_post_now']);
    }

    /**
     * Add admin menu
     */
    public function add_admin_menu() {
        add_options_page(
            'GP Social Poster',
            'GP Social Poster',
            'manage_options',
            'gp-social-poster',
            [$this, 'render_settings_page']
        );
    }

    /**
     * Register settings
     */
    public function register_settings() {
        register_setting('gp_social_poster', 'gp_social_poster_options', [
            'sanitize_callback' => [$this, 'sanitize_options']
        ]);

        // Mastodon Section
        add_settings_section(
            'gp_mastodon_section',
            'Mastodon Settings',
            [$this, 'mastodon_section_callback'],
            'gp-social-poster'
        );

        add_settings_field('mastodon_enabled', 'Enable Mastodon', [$this, 'checkbox_field'], 'gp-social-poster', 'gp_mastodon_section', ['field' => 'mastodon_enabled']);
        add_settings_field('mastodon_instance', 'Instance URL', [$this, 'text_field'], 'gp-social-poster', 'gp_mastodon_section', ['field' => 'mastodon_instance', 'placeholder' => 'https://mastodon.social']);
        add_settings_field('mastodon_access_token', 'Access Token', [$this, 'password_field'], 'gp-social-poster', 'gp_mastodon_section', ['field' => 'mastodon_access_token']);

        // X/Twitter Section
        add_settings_section(
            'gp_twitter_section',
            'X/Twitter Settings',
            [$this, 'twitter_section_callback'],
            'gp-social-poster'
        );

        add_settings_field('twitter_enabled', 'Enable X/Twitter', [$this, 'checkbox_field'], 'gp-social-poster', 'gp_twitter_section', ['field' => 'twitter_enabled']);
        add_settings_field('twitter_api_key', 'API Key', [$this, 'text_field'], 'gp-social-poster', 'gp_twitter_section', ['field' => 'twitter_api_key']);
        add_settings_field('twitter_api_secret', 'API Secret', [$this, 'password_field'], 'gp-social-poster', 'gp_twitter_section', ['field' => 'twitter_api_secret']);
        add_settings_field('twitter_access_token', 'Access Token', [$this, 'text_field'], 'gp-social-poster', 'gp_twitter_section', ['field' => 'twitter_access_token']);
        add_settings_field('twitter_access_secret', 'Access Token Secret', [$this, 'password_field'], 'gp-social-poster', 'gp_twitter_section', ['field' => 'twitter_access_secret']);

        // Pinterest Section
        add_settings_section(
            'gp_pinterest_section',
            'Pinterest Settings',
            [$this, 'pinterest_section_callback'],
            'gp-social-poster'
        );

        add_settings_field('pinterest_enabled', 'Enable Pinterest', [$this, 'checkbox_field'], 'gp-social-poster', 'gp_pinterest_section', ['field' => 'pinterest_enabled']);
        add_settings_field('pinterest_access_token', 'Access Token', [$this, 'password_field'], 'gp-social-poster', 'gp_pinterest_section', ['field' => 'pinterest_access_token']);
        add_settings_field('pinterest_board_id', 'Board ID', [$this, 'text_field'], 'gp-social-poster', 'gp_pinterest_section', ['field' => 'pinterest_board_id', 'placeholder' => 'username/board-name']);

        // General Settings
        add_settings_section(
            'gp_general_section',
            'General Settings',
            null,
            'gp-social-poster'
        );

        add_settings_field('auto_post_enabled', 'Auto-post on Publish', [$this, 'checkbox_field'], 'gp-social-poster', 'gp_general_section', ['field' => 'auto_post_enabled']);
        add_settings_field('post_template', 'Post Template', [$this, 'textarea_field'], 'gp-social-poster', 'gp_general_section', ['field' => 'post_template', 'placeholder' => '{title} - {url}', 'description' => 'Available tags: {title}, {url}, {excerpt}, {author}']);
    }

    /**
     * Section callbacks
     */
    public function mastodon_section_callback() {
        echo '<p>Get your access token from your Mastodon instance: Settings > Development > New Application</p>';
    }

    public function twitter_section_callback() {
        echo '<p>Get your API credentials from <a href="https://developer.twitter.com/en/portal/dashboard" target="_blank">Twitter Developer Portal</a>. Requires a developer account.</p>';
    }

    public function pinterest_section_callback() {
        echo '<p>Get your access token from <a href="https://developers.pinterest.com/" target="_blank">Pinterest Developers</a>. Requires a business account.</p>';
    }

    /**
     * Field renderers
     */
    public function text_field($args) {
        $field = $args['field'];
        $value = $this->options[$field] ?? '';
        $placeholder = $args['placeholder'] ?? '';
        echo '<input type="text" name="gp_social_poster_options[' . esc_attr($field) . ']" value="' . esc_attr($value) . '" placeholder="' . esc_attr($placeholder) . '" class="regular-text">';
    }

    public function password_field($args) {
        $field = $args['field'];
        $value = $this->options[$field] ?? '';
        echo '<input type="password" name="gp_social_poster_options[' . esc_attr($field) . ']" value="' . esc_attr($value) . '" class="regular-text">';
    }

    public function checkbox_field($args) {
        $field = $args['field'];
        $checked = !empty($this->options[$field]);
        echo '<input type="checkbox" name="gp_social_poster_options[' . esc_attr($field) . ']" value="1" ' . checked($checked, true, false) . '>';
    }

    public function textarea_field($args) {
        $field = $args['field'];
        $value = $this->options[$field] ?? '{title} - {url}';
        $placeholder = $args['placeholder'] ?? '';
        $description = $args['description'] ?? '';
        echo '<textarea name="gp_social_poster_options[' . esc_attr($field) . ']" placeholder="' . esc_attr($placeholder) . '" class="large-text" rows="3">' . esc_textarea($value) . '</textarea>';
        if ($description) {
            echo '<p class="description">' . esc_html($description) . '</p>';
        }
    }

    /**
     * Sanitize options
     */
    public function sanitize_options($input) {
        $sanitized = [];
        $text_fields = ['mastodon_instance', 'mastodon_access_token', 'twitter_api_key', 'twitter_api_secret', 'twitter_access_token', 'twitter_access_secret', 'pinterest_access_token', 'pinterest_board_id', 'post_template'];
        $checkbox_fields = ['mastodon_enabled', 'twitter_enabled', 'pinterest_enabled', 'auto_post_enabled'];

        foreach ($text_fields as $field) {
            $sanitized[$field] = sanitize_text_field($input[$field] ?? '');
        }

        foreach ($checkbox_fields as $field) {
            $sanitized[$field] = !empty($input[$field]) ? 1 : 0;
        }

        return $sanitized;
    }

    /**
     * Render settings page
     */
    public function render_settings_page() {
        ?>
        <div class="wrap">
            <h1>GP Social Poster</h1>
            <p>Auto-post to Mastodon, X/Twitter, and Pinterest. Works alongside Blog2Social (Facebook, LinkedIn, Tumblr, Bluesky, Threads).</p>

            <form method="post" action="options.php">
                <?php
                settings_fields('gp_social_poster');
                do_settings_sections('gp-social-poster');
                submit_button();
                ?>
            </form>

            <hr>
            <h2>Test Connection</h2>
            <p>
                <button type="button" class="button" onclick="gpTestConnection('mastodon')">Test Mastodon</button>
                <button type="button" class="button" onclick="gpTestConnection('twitter')">Test X/Twitter</button>
                <button type="button" class="button" onclick="gpTestConnection('pinterest')">Test Pinterest</button>
            </p>
            <div id="gp-test-result"></div>

            <script>
            function gpTestConnection(platform) {
                document.getElementById('gp-test-result').innerHTML = 'Testing ' + platform + '...';
                jQuery.post(ajaxurl, {
                    action: 'gp_social_test_connection',
                    platform: platform,
                    _wpnonce: '<?php echo wp_create_nonce('gp_social_test'); ?>'
                }, function(response) {
                    document.getElementById('gp-test-result').innerHTML = response.data.message;
                });
            }
            </script>
        </div>
        <?php
    }

    /**
     * Add meta boxes
     */
    public function add_meta_boxes() {
        add_meta_box(
            'gp_social_poster_meta',
            'GP Social Poster',
            [$this, 'render_meta_box'],
            'post',
            'side',
            'default'
        );
    }

    /**
     * Render meta box
     */
    public function render_meta_box($post) {
        $posted = get_post_meta($post->ID, '_gp_social_posted', true) ?: [];
        ?>
        <p>
            <label>
                <input type="checkbox" name="gp_social_skip" value="1">
                Skip auto-posting for this post
            </label>
        </p>
        <p><strong>Posted to:</strong></p>
        <ul style="margin-left: 20px;">
            <li>Mastodon: <?php echo !empty($posted['mastodon']) ? '✅' : '❌'; ?></li>
            <li>X/Twitter: <?php echo !empty($posted['twitter']) ? '✅' : '❌'; ?></li>
            <li>Pinterest: <?php echo !empty($posted['pinterest']) ? '✅' : '❌'; ?></li>
        </ul>
        <?php if ($post->post_status === 'publish'): ?>
        <p>
            <button type="button" class="button" onclick="gpPostNow(<?php echo $post->ID; ?>)">Post Now</button>
        </p>
        <script>
        function gpPostNow(postId) {
            jQuery.post(ajaxurl, {
                action: 'gp_social_post_now',
                post_id: postId,
                _wpnonce: '<?php echo wp_create_nonce('gp_social_post'); ?>'
            }, function(response) {
                alert(response.data.message);
                location.reload();
            });
        }
        </script>
        <?php endif; ?>
        <?php
    }

    /**
     * On post publish
     */
    public function on_post_publish($post_id, $post) {
        // Check if auto-post is enabled
        if (empty($this->options['auto_post_enabled'])) {
            return;
        }

        // Check if skip is set
        if (!empty($_POST['gp_social_skip'])) {
            return;
        }

        // Don't post revisions or autosaves
        if (wp_is_post_revision($post_id) || wp_is_post_autosave($post_id)) {
            return;
        }

        // Check if already posted (prevent duplicate posts on update)
        $posted = get_post_meta($post_id, '_gp_social_posted', true) ?: [];

        $this->post_to_all($post_id, $post, $posted);
    }

    /**
     * Post to all enabled platforms
     */
    private function post_to_all($post_id, $post = null, $already_posted = []) {
        if (!$post) {
            $post = get_post($post_id);
        }

        $content = $this->build_post_content($post);
        $image_url = get_the_post_thumbnail_url($post_id, 'large');
        $results = [];

        // Mastodon
        if (!empty($this->options['mastodon_enabled']) && empty($already_posted['mastodon'])) {
            $results['mastodon'] = $this->post_to_mastodon($content, $image_url);
        }

        // X/Twitter
        if (!empty($this->options['twitter_enabled']) && empty($already_posted['twitter'])) {
            $results['twitter'] = $this->post_to_twitter($content, $image_url);
        }

        // Pinterest
        if (!empty($this->options['pinterest_enabled']) && empty($already_posted['pinterest'])) {
            $results['pinterest'] = $this->post_to_pinterest($post, $image_url);
        }

        // Update posted status
        $posted = array_merge($already_posted, $results);
        update_post_meta($post_id, '_gp_social_posted', $posted);

        return $results;
    }

    /**
     * Build post content from template
     */
    private function build_post_content($post) {
        $template = $this->options['post_template'] ?? '{title} - {url}';

        $replacements = [
            '{title}' => $post->post_title,
            '{url}' => get_permalink($post->ID),
            '{excerpt}' => wp_trim_words($post->post_excerpt ?: $post->post_content, 30),
            '{author}' => get_the_author_meta('display_name', $post->post_author),
        ];

        return str_replace(array_keys($replacements), array_values($replacements), $template);
    }

    /**
     * Post to Mastodon
     */
    private function post_to_mastodon($content, $image_url = null) {
        $instance = rtrim($this->options['mastodon_instance'] ?? '', '/');
        $token = $this->options['mastodon_access_token'] ?? '';

        if (empty($instance) || empty($token)) {
            return false;
        }

        $media_id = null;

        // Upload image if provided
        if ($image_url) {
            $image_response = wp_remote_post($instance . '/api/v2/media', [
                'headers' => [
                    'Authorization' => 'Bearer ' . $token,
                ],
                'body' => [
                    'url' => $image_url,
                ],
            ]);

            if (!is_wp_error($image_response)) {
                $image_data = json_decode(wp_remote_retrieve_body($image_response), true);
                $media_id = $image_data['id'] ?? null;
            }
        }

        // Post status
        $body = ['status' => $content];
        if ($media_id) {
            $body['media_ids'] = [$media_id];
        }

        $response = wp_remote_post($instance . '/api/v1/statuses', [
            'headers' => [
                'Authorization' => 'Bearer ' . $token,
                'Content-Type' => 'application/json',
            ],
            'body' => json_encode($body),
        ]);

        if (is_wp_error($response)) {
            error_log('GP Social Poster - Mastodon error: ' . $response->get_error_message());
            return false;
        }

        $status_code = wp_remote_retrieve_response_code($response);
        return $status_code >= 200 && $status_code < 300;
    }

    /**
     * Post to X/Twitter
     */
    private function post_to_twitter($content, $image_url = null) {
        $api_key = $this->options['twitter_api_key'] ?? '';
        $api_secret = $this->options['twitter_api_secret'] ?? '';
        $access_token = $this->options['twitter_access_token'] ?? '';
        $access_secret = $this->options['twitter_access_secret'] ?? '';

        if (empty($api_key) || empty($api_secret) || empty($access_token) || empty($access_secret)) {
            return false;
        }

        // Twitter API v2 requires OAuth 1.0a
        $url = 'https://api.twitter.com/2/tweets';
        $oauth = $this->build_twitter_oauth($url, 'POST', $api_key, $api_secret, $access_token, $access_secret);

        $response = wp_remote_post($url, [
            'headers' => [
                'Authorization' => $oauth,
                'Content-Type' => 'application/json',
            ],
            'body' => json_encode(['text' => $content]),
        ]);

        if (is_wp_error($response)) {
            error_log('GP Social Poster - Twitter error: ' . $response->get_error_message());
            return false;
        }

        $status_code = wp_remote_retrieve_response_code($response);
        return $status_code >= 200 && $status_code < 300;
    }

    /**
     * Build Twitter OAuth 1.0a header
     */
    private function build_twitter_oauth($url, $method, $consumer_key, $consumer_secret, $token, $token_secret) {
        $oauth = [
            'oauth_consumer_key' => $consumer_key,
            'oauth_nonce' => md5(mt_rand()),
            'oauth_signature_method' => 'HMAC-SHA1',
            'oauth_timestamp' => time(),
            'oauth_token' => $token,
            'oauth_version' => '1.0',
        ];

        // Build signature base string
        ksort($oauth);
        $base_string = $method . '&' . rawurlencode($url) . '&' . rawurlencode(http_build_query($oauth, '', '&', PHP_QUERY_RFC3986));
        $signing_key = rawurlencode($consumer_secret) . '&' . rawurlencode($token_secret);
        $oauth['oauth_signature'] = base64_encode(hash_hmac('sha1', $base_string, $signing_key, true));

        // Build header
        $header_parts = [];
        foreach ($oauth as $key => $value) {
            $header_parts[] = rawurlencode($key) . '="' . rawurlencode($value) . '"';
        }

        return 'OAuth ' . implode(', ', $header_parts);
    }

    /**
     * Post to Pinterest
     */
    private function post_to_pinterest($post, $image_url) {
        $token = $this->options['pinterest_access_token'] ?? '';
        $board_id = $this->options['pinterest_board_id'] ?? '';

        if (empty($token) || empty($board_id) || empty($image_url)) {
            return false;
        }

        $url = 'https://api.pinterest.com/v5/pins';

        $body = [
            'board_id' => $board_id,
            'title' => $post->post_title,
            'description' => wp_trim_words($post->post_excerpt ?: $post->post_content, 100),
            'link' => get_permalink($post->ID),
            'media_source' => [
                'source_type' => 'image_url',
                'url' => $image_url,
            ],
        ];

        $response = wp_remote_post($url, [
            'headers' => [
                'Authorization' => 'Bearer ' . $token,
                'Content-Type' => 'application/json',
            ],
            'body' => json_encode($body),
        ]);

        if (is_wp_error($response)) {
            error_log('GP Social Poster - Pinterest error: ' . $response->get_error_message());
            return false;
        }

        $status_code = wp_remote_retrieve_response_code($response);
        return $status_code >= 200 && $status_code < 300;
    }

    /**
     * AJAX: Post now
     */
    public function ajax_post_now() {
        check_ajax_referer('gp_social_post', '_wpnonce');

        if (!current_user_can('edit_posts')) {
            wp_send_json_error(['message' => 'Permission denied']);
        }

        $post_id = intval($_POST['post_id']);
        $results = $this->post_to_all($post_id);

        $messages = [];
        foreach ($results as $platform => $success) {
            $messages[] = ucfirst($platform) . ': ' . ($success ? 'Posted!' : 'Failed');
        }

        wp_send_json_success(['message' => implode("\n", $messages)]);
    }
}

// Initialize
add_action('plugins_loaded', function() {
    GP_Social_Poster::get_instance();
});

// AJAX test connection handler
add_action('wp_ajax_gp_social_test_connection', function() {
    check_ajax_referer('gp_social_test', '_wpnonce');

    $platform = sanitize_text_field($_POST['platform']);
    $options = get_option('gp_social_poster_options', []);

    switch ($platform) {
        case 'mastodon':
            $instance = rtrim($options['mastodon_instance'] ?? '', '/');
            $token = $options['mastodon_access_token'] ?? '';

            if (empty($instance) || empty($token)) {
                wp_send_json_error(['message' => 'Mastodon: Missing instance URL or access token']);
            }

            $response = wp_remote_get($instance . '/api/v1/accounts/verify_credentials', [
                'headers' => ['Authorization' => 'Bearer ' . $token],
            ]);

            if (is_wp_error($response)) {
                wp_send_json_error(['message' => 'Mastodon: ' . $response->get_error_message()]);
            }

            $body = json_decode(wp_remote_retrieve_body($response), true);
            if (!empty($body['username'])) {
                wp_send_json_success(['message' => 'Mastodon: Connected as @' . $body['username']]);
            } else {
                wp_send_json_error(['message' => 'Mastodon: Invalid response']);
            }
            break;

        case 'twitter':
            $api_key = $options['twitter_api_key'] ?? '';
            if (empty($api_key)) {
                wp_send_json_error(['message' => 'X/Twitter: Missing API credentials']);
            }
            wp_send_json_success(['message' => 'X/Twitter: Credentials saved (test post to verify)']);
            break;

        case 'pinterest':
            $token = $options['pinterest_access_token'] ?? '';
            if (empty($token)) {
                wp_send_json_error(['message' => 'Pinterest: Missing access token']);
            }

            $response = wp_remote_get('https://api.pinterest.com/v5/user_account', [
                'headers' => ['Authorization' => 'Bearer ' . $token],
            ]);

            if (is_wp_error($response)) {
                wp_send_json_error(['message' => 'Pinterest: ' . $response->get_error_message()]);
            }

            $body = json_decode(wp_remote_retrieve_body($response), true);
            if (!empty($body['username'])) {
                wp_send_json_success(['message' => 'Pinterest: Connected as @' . $body['username']]);
            } else {
                wp_send_json_error(['message' => 'Pinterest: Invalid response']);
            }
            break;

        default:
            wp_send_json_error(['message' => 'Unknown platform']);
    }
});
