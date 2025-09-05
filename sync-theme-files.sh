#!/bin/bash

# Sync cart fulfillment files to Shopify theme

# Copy latest files to theme structure
cp cart-fulfillment-selector.liquid theme-files/snippets/
cp cart-fulfillment.js theme-files/assets/

# Push to live theme (test-data)
cd theme-files
shopify theme push \
  --store=syatt-personalize.myshopify.com \
  --theme=154013073661 \
  --only="snippets/cart-fulfillment-selector.liquid,assets/cart-fulfillment.js" \
  --force \
  --allow-live

echo "✅ Theme files synced successfully!"