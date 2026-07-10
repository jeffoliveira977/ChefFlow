#!/bin/sh
set -e

# Initialize storage directory if empty
if [ -d "/var/www/storage-init" ] && [ ! "$(ls -A /var/www/storage 2>/dev/null)" ]; then
  echo "Initializing storage directory..."
  cp -R /var/www/storage-init/. /var/www/storage
fi

# Remove storage-init directory if it exists
if [ -d "/var/www/storage-init" ]; then
  rm -rf /var/www/storage-init
fi

mkdir -p /var/www/bootstrap/cache
mkdir -p /var/www/storage/app/public
mkdir -p /var/www/storage/framework/cache/data
mkdir -p /var/www/storage/framework/sessions
mkdir -p /var/www/storage/framework/views
mkdir -p /var/www/storage/logs

if [ "$(id -u)" = "0" ]; then
  echo "Setting permissions for development..."
  chown -R www-data:www-data /var/www/bootstrap/cache
  chown -R www-data:www-data /var/www/storage
fi


if [ "$APP_ENV" != "production" ] && [ ! -d "/var/www/vendor" ]; then
  echo "Installing Composer dependencies..."
  composer install --no-interaction --prefer-dist
fi


# Ensure the database schema is up to date.
if [ "$APP_ENV" = "production" ]; then
  php artisan migrate --force
else
  php artisan migrate
fi

# Auto-seed if database is empty
if php artisan tinker --execute "echo App\Models\User::count();" 2>/dev/null | grep -q "^0$"; then
  echo "Database is empty. Seeding data..."
  php artisan db:seed --force
fi

# Configure caching based on environment
if [ "$APP_ENV" = "production" ]; then
  echo "Caching Laravel configuration, routes, and views..."
  php artisan config:cache
  php artisan route:cache
  php artisan view:cache
else
  echo "Clearing Laravel configuration, routes, and views cache..."
  php artisan config:clear
  php artisan route:clear
  php artisan view:clear
fi

if [ "$(id -u)" = "0" ]; then
  chown -R www-data:www-data /var/www/bootstrap/cache
  chown -R www-data:www-data /var/www/storage
fi

exec "$@"