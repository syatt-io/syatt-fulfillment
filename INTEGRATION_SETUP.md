# Cart Fulfillment Integration Setup

This guide explains how to integrate your existing Liquid cart fulfillment selector with the new Cart API preferences system for checkout pre-selection.

## What Changed

Your existing code now has **dual functionality**:

1. **Cart Attributes** (existing) - Stores preferences for display/logic
2. **Cart API Preferences** (NEW) - Pre-selects options in Shopify checkout

## Files Updated

### 1. `cart-fulfillment.js` ✅ Updated
- **New function**: `createCartWithPreferences()` - Creates cart with delivery preferences
- **Updated function**: `updateCartAttributes()` - Now calls both cart attributes AND preferences API
- **New feature**: Checkout button interception - Uses pre-selected checkout URLs

### 2. `cart-fulfillment-selector.liquid` ✅ Updated  
- **Enhancement**: Now populates locations from `shop.locations` in addition to JavaScript
- **Backward compatible**: Still works with existing JavaScript location loading

### 3. `app/routes/api.public.cart.tsx` ✅ Created
- **New API endpoint**: Handles storefront requests for cart creation with preferences
- **Public access**: No admin authentication required

## Setup Requirements

### 1. Environment Variables
Add to your `.env` file:
```bash
STOREFRONT_ACCESS_TOKEN=your-storefront-access-token
```

### 2. Create Storefront Access Token
In your Shopify admin:
1. Go to **Apps** → **Manage private apps** → **Create private app**
2. Enable **Storefront API access**
3. Add permissions:
   - `unauthenticated_read_product_listings`
   - `unauthenticated_read_content`
   - `unauthenticated_write_checkouts`
4. Copy the **Storefront access token**

### 3. Install in Your Theme
Add these files to your theme:

#### In your cart template (e.g., `templates/cart.liquid`):
```liquid
{% render 'cart-fulfillment-selector' %}
```

#### Copy these files to your theme:
- `cart-fulfillment-selector.liquid` → `snippets/cart-fulfillment-selector.liquid`
- `cart-fulfillment.js` → `assets/cart-fulfillment.js`
- Create `assets/cart-fulfillment.css` for styling

## How It Works

### User Journey:
1. **Customer selects pickup/delivery** in cart → `cart-fulfillment.js` triggers
2. **Cart attributes updated** → `/cart/update.js` (existing flow)
3. **Preferences API called** → `/apps/api/public/cart` (NEW)
4. **New checkout URL generated** with pre-selected options
5. **Checkout button clicked** → redirects to pre-selected checkout

### Technical Flow:
```
Cart Selection → Cart Attributes + API Call → Preferences Set → Checkout Pre-selected
```

## Integration Benefits

✅ **Backward Compatible**: Existing cart attribute logic still works  
✅ **Progressive Enhancement**: New preference features work on top  
✅ **Fallback Safe**: If API fails, normal checkout still works  
✅ **Real-time**: Creates preferences immediately when selection changes  

## Testing

### 1. Test Cart Attributes (existing)
- Select pickup/delivery options
- Check `cart.attributes.fulfillment_type` is set
- Verify location selection saves `pickup_location_id`

### 2. Test Preferences API (new)
- Open browser console when selecting options
- Look for: `✅ Cart with preferences created: [checkout-url]`
- Test the generated checkout URL for pre-selected options

### 3. Test Checkout Flow
- Add products to cart
- Select pickup/delivery preference  
- Click checkout button
- Verify correct option is pre-selected in Shopify checkout

## Troubleshooting

### API Errors
- Check `STOREFRONT_ACCESS_TOKEN` is set correctly
- Verify storefront access token has correct permissions
- Check browser console for error messages

### Checkout Not Pre-selected
- Confirm API call is successful (check console logs)
- Verify checkout URL is being generated
- Test with different products/configurations

### Cart Attributes Not Saving
- This is the existing functionality - check original cart JavaScript
- Verify `/cart/update.js` endpoint is working
- Check cart object in Shopify admin or Liquid templates

## Next Steps

1. **Deploy the updated files** to your theme
2. **Set up the storefront access token**
3. **Test thoroughly** in your development store
4. **Optional**: Create Delivery Customization Function for additional control

## Need Help?

- Check the browser console for detailed error messages
- Verify all API endpoints are accessible
- Test the demo page in your Shopify app at `/app/delivery-demo`