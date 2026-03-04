# GP Social Poster

Auto-post WordPress content to Mastodon, X/Twitter, and Pinterest.

## Overview

This plugin complements Blog2Social by adding support for platforms not included in Blog2Social's free tier:

| Platform | Blog2Social Free | GP Social Poster |
|----------|------------------|------------------|
| Facebook | ✅ | - |
| LinkedIn | ✅ | - |
| Tumblr | ✅ | - |
| Bluesky | ✅ | - |
| Threads | ✅ | - |
| Mastodon | ❌ | ✅ |
| X/Twitter | ❌ | ✅ |
| Pinterest | ❌ | ✅ |

## Features

- **Auto-post on publish**: Automatically share new posts to enabled platforms
- **Manual posting**: Post button in the post editor sidebar
- **Post template**: Customize how posts appear with tags like `{title}`, `{url}`, `{excerpt}`
- **Image support**: Automatically includes featured image when available
- **Connection testing**: Test your API connections from the settings page
- **Skip option**: Skip auto-posting for individual posts

## Setup

### Mastodon

1. Go to your Mastodon instance (e.g., mastodon.social)
2. Navigate to **Settings > Development > New Application**
3. Create an app with `write:statuses` and `write:media` scopes
4. Copy the **Access Token**
5. In WordPress, go to **Settings > GP Social Poster**
6. Enter your instance URL and access token

### X/Twitter

1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create a new project and app (Free tier works)
3. Generate **API Key**, **API Secret**, **Access Token**, and **Access Token Secret**
4. Ensure your app has **Read and Write** permissions
5. In WordPress, enter all four credentials

### Pinterest

1. Go to [Pinterest Developers](https://developers.pinterest.com/)
2. Create an app (requires Business account)
3. Generate an access token with `pins:write` scope
4. Get your board ID from the board URL (format: `username/board-name`)
5. In WordPress, enter the access token and board ID

## Post Template

Customize how posts appear using these tags:

- `{title}` - Post title
- `{url}` - Post permalink
- `{excerpt}` - Post excerpt (first 30 words)
- `{author}` - Post author display name

**Default template:** `{title} - {url}`

**Example custom template:**
```
Check out: {title}

{excerpt}

Read more: {url}
```

## Hooks & Filters

### Modify post content before sending

```php
add_filter('gp_social_post_content', function($content, $post, $platform) {
    if ($platform === 'twitter') {
        // Add hashtags for Twitter
        $content .= ' #WordPress #blogging';
    }
    return $content;
}, 10, 3);
```

### Skip posting for certain post types

```php
add_filter('gp_social_should_post', function($should_post, $post_id, $platform) {
    $post = get_post($post_id);
    if ($post->post_type === 'page') {
        return false;
    }
    return $should_post;
}, 10, 3);
```

## Requirements

- WordPress 5.0+
- PHP 7.4+
- Valid API credentials for each platform

## Troubleshooting

### Posts not appearing on social media

1. Check the **Test Connection** buttons in settings
2. Verify API credentials are correct
3. Check WordPress debug log for errors
4. Ensure the post has a featured image (required for Pinterest)

### Rate limits

- **Mastodon**: Generally generous limits
- **X/Twitter Free**: 1,500 tweets/month, 50 tweets/day
- **Pinterest**: Check your app's rate limit in developer dashboard

## License

GPL v2 or later
