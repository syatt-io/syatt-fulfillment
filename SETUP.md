# Fulfillment Pre-Selection POC Setup Guide

## Overview
This guide will help you set up the Fulfillment Pre-Selection proof of concept, which allows customers to choose their fulfillment method (delivery or store pickup) in the cart and automatically applies this selection in the Shopify Plus checkout.

## Prerequisites

### Shopify Store Requirements
- **Shopify Plus account** with checkout extensibility enabled
- **Dawn theme** (or compatible theme)
- **Store locations configured** for pickup (at least 2-3 test locations)
- **Shopify CLI installed** (`npm install -g @shopify/cli @shopify/theme`)

### Verify Checkout Extensibility
1. Go to your Shopify Admin
2. Navigate to **Settings > Checkout**
3. Look for "Checkout extensibility" section
4. If not available, contact Shopify Plus support to enable it

## Part 1: Store Location Setup

### Configure Pickup Locations
1. In Shopify Admin, go to **Settings > Locations**
2. For each location where you want to offer pickup:
   - Click on the location name
   - Enable **"Fulfill online orders from this location"**
   - Enable **"Local pickup"**
   - Set pickup instructions and hours
3. Go to **Settings > Shipping and delivery**
4. Under **Local pickup**, configure:
   - Pickup instructions
   - Pickup availability
   - Any pickup fees (optional)

### Test Data Setup
Create at least 2-3 test locations:
- **Downtown Store**: 123 Main St, City, State 12345
- **Mall Location**: 456 Shopping Center Dr, City, State 12345  
- **Westside Branch**: 789 West Ave, City, State 12345

## Part 2: Theme Integration (Cart Section)

### 1. Add Files to Your Theme
Upload these files to your Dawn theme:

**In `assets/` folder:**
- `cart-fulfillment.js`
- `cart-fulfillment.css`

**In `sections/` folder:**
- `cart-fulfillment-selector.liquid`

### 2. Add Section to Cart Template
1. Edit `templates/cart.json` in your theme
2. Add the fulfillment selector section before the checkout section:

```json
{
  "sections": {
    "cart-items": {
      "type": "main-cart-items"
    },
    "cart-fulfillment": {
      "type": "cart-fulfillment-selector"
    },
    "cart-footer": {
      "type": "main-cart-footer"
    }
  },
  "order": [
    "cart-items",
    "cart-fulfillment", 
    "cart-footer"
  ]
}
```

### 3. Optional: Add Cart Data Script (Recommended)
Add this liquid code to your cart template to expose cart data to JavaScript:

```liquid
<script id="cart-data" type="application/json">
  {
    "attributes": {{ cart.attributes | json }},
    "item_count": {{ cart.item_count }},
    "total_price": {{ cart.total_price }}
  }
</script>
```

## Part 3: Checkout Extension Deployment

### 1. Install Dependencies
From your app directory:
```bash
cd extensions/checkout-fulfillment
npm install
```

### 2. Deploy the Extension
From the root app directory:
```bash
shopify app deploy
```

### 3. Configure Extension in Partner Dashboard
1. Go to your **Partner Dashboard**
2. Select your app
3. Navigate to **Extensions**
4. Find "Fulfillment Pre-Selection" extension
5. Configure the target: `purchase.checkout.shipping-option-list.render-before`

### 4. Install App in Test Store
1. From Partner Dashboard, get your app's installation URL
2. Install the app in your Shopify Plus development store
3. Grant the required permissions

## Part 4: Testing Guide

### Test Scenarios

#### Scenario 1: Delivery Selection
1. Add products to cart
2. Go to cart page
3. Select "Ship to me" option
4. Proceed to checkout
5. **Expected**: Shipping option auto-selected, green banner displayed

#### Scenario 2: Store Pickup Selection  
1. Add products to cart
2. Go to cart page
3. Select "Pick up in store" option
4. Choose a store location from dropdown
5. Proceed to checkout
6. **Expected**: Store pickup option auto-selected, banner shows location

#### Scenario 3: No Pre-Selection
1. Add products to cart
2. Go to cart page without making selection
3. Proceed to checkout
4. **Expected**: Standard checkout behavior, no banner

#### Scenario 4: Change Selection in Checkout
1. Complete Scenario 1 or 2 first
2. In checkout, click "Change selection" button
3. Choose different shipping option
4. **Expected**: Selection updates, banner disappears

### Debugging Checklist

#### Cart Issues
- [ ] JavaScript console shows no errors
- [ ] Network tab shows successful `/cart/update.js` calls
- [ ] Cart attributes are being saved (check cart object in browser dev tools)
- [ ] CSS styling matches Dawn theme

#### Checkout Extension Issues
- [ ] Extension is deployed and installed
- [ ] Extension appears in checkout (look for banner)
- [ ] Cart attributes are being read correctly
- [ ] Shipping options are being auto-selected
- [ ] No React errors in console

### Common Issues

**Cart attributes not saving:**
- Check AJAX requests in Network tab
- Verify CSRF tokens if using custom forms
- Ensure proper content-type headers

**Pickup locations not loading:**
- Update `cart-fulfillment.js` to fetch real locations via Admin API
- Check store location configuration in admin
- Verify locations have pickup enabled

**Extension not showing:**
- Verify app is installed and permissions granted
- Check extension configuration in Partner Dashboard
- Ensure checkout extensibility is enabled on Shopify Plus

**Auto-selection not working:**
- Check cart attributes are properly formatted
- Verify shipping options are available
- Look for React errors in browser console

## Part 5: Production Considerations

### Before Going Live
1. **Replace mock location data** in `cart-fulfillment.js` with real Shopify Admin API calls
2. **Add proper error handling** for API failures
3. **Implement loading states** for location fetching
4. **Add analytics tracking** for fulfillment selections
5. **Test with real inventory** and pickup availability
6. **Optimize for accessibility** (screen readers, keyboard navigation)

### Performance Optimizations
- Lazy load pickup locations only when needed
- Cache location data to reduce API calls
- Minimize JavaScript bundle size
- Use proper image optimization for icons

### Security Considerations
- Validate all cart attribute inputs
- Sanitize location data before display
- Use proper CORS configuration
- Don't expose sensitive location data

## Part 6: Customization Guide

### Styling Customization
Edit `cart-fulfillment.css` to match your brand:
- Update color variables to match your theme
- Adjust spacing and typography
- Modify icons and visual elements

### Functionality Extensions
- Add address validation for pickup locations
- Implement inventory checking per location
- Add estimated pickup times
- Include location hours and contact info
- Add map integration for location selection

### Language Support
Add translations to your theme's locale files:
```json
{
  "cart": {
    "fulfillment": {
      "title": "How would you like to receive your order?",
      "delivery": {
        "title": "Ship to me",
        "description": "Standard shipping to your address"
      },
      "pickup": {
        "title": "Pick up in store", 
        "description": "Available at select locations",
        "location_label": "Select store location:",
        "select_location": "Choose a location..."
      },
      "loading": "Updating...",
      "error": "Unable to save your selection. Please try again."
    }
  }
}
```

## Support and Troubleshooting

### Useful Commands
```bash
# Deploy extension
shopify app deploy

# View app logs  
shopify app logs

# Generate new extension
shopify app generate extension

# Preview theme changes
shopify theme dev --store=your-store.myshopify.com
```

### Resources
- [Shopify Checkout UI Extensions Documentation](https://shopify.dev/docs/api/checkout-ui-extensions)
- [Cart AJAX API Reference](https://shopify.dev/docs/themes/ajax-api/reference/cart)
- [Dawn Theme Documentation](https://shopify.dev/themes/tools/dawn)

This setup guide provides everything needed to implement and test the fulfillment pre-selection POC. For production deployment, ensure you complete the production considerations section.