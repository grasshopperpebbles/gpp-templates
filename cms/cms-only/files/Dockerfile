FROM wordpress:6.6-php8.3-apache

# Install Redis PHP extension for object caching
RUN pecl install redis-6.0.2 \
    && docker-php-ext-enable redis

# Install additional useful PHP extensions
RUN docker-php-ext-install opcache

# Install WP-CLI
RUN curl -O https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar \
    && chmod +x wp-cli.phar \
    && mv wp-cli.phar /usr/local/bin/wp

# Install unzip (needed for plugin installation from GitHub)
RUN apt-get update && apt-get install -y unzip && rm -rf /var/lib/apt/lists/*

# Configure PHP for better performance
RUN { \
    echo 'opcache.enable=1'; \
    echo 'opcache.memory_consumption=256'; \
    echo 'opcache.max_accelerated_files=20000'; \
    echo 'opcache.revalidate_freq=2'; \
    } > /usr/local/etc/php/conf.d/opcache.ini
