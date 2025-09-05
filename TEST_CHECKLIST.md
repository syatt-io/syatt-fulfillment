# Fulfillment Pre-Selection POC - Test Checklist

## Pre-Testing Setup Verification

### ✅ Store Configuration
- [ ] Shopify Plus store with checkout extensibility enabled
- [ ] At least 2-3 store locations configured with pickup enabled
- [ ] Dawn theme or compatible theme installed
- [ ] App development environment configured

### ✅ Files Deployed
- [ ] `cart-fulfillment-selector.liquid` added to theme sections
- [ ] `cart-fulfillment.js` uploaded to theme assets
- [ ] `cart-fulfillment.css` uploaded to theme assets
- [ ] Cart template updated to include fulfillment selector section
- [ ] Checkout extension deployed via `shopify app deploy`

## Core Functionality Tests

### Test 1: Cart Fulfillment Selection (Delivery)
**Steps:**
1. Add products to cart
2. Navigate to cart page
3. Verify fulfillment selector appears
4. Select "Ship to me" radio button
5. Check browser dev tools Network tab for `/cart/update.js` call

**Expected Results:**
- [ ] Fulfillment selector displays with proper styling
- [ ] "Ship to me" option can be selected
- [ ] AJAX call to `/cart/update.js` succeeds
- [ ] Cart attributes include `fulfillment_type: "delivery"`
- [ ] No JavaScript errors in console

### Test 2: Cart Fulfillment Selection (Pickup)
**Steps:**
1. Add products to cart
2. Navigate to cart page
3. Select "Pick up in store" radio button
4. Verify store location dropdown appears
5. Select a store from dropdown
6. Check Network tab for cart update calls

**Expected Results:**
- [ ] Store location dropdown appears when pickup selected
- [ ] Dropdown contains mock store locations
- [ ] Can select a specific location
- [ ] Cart attributes include:
  - `fulfillment_type: "pickup"`
  - `pickup_location_id: "gid://shopify/Location/..."`
  - `pickup_location_name: "[Store Name]"`

### Test 3: Checkout Auto-Selection (Delivery)
**Steps:**
1. Complete Test 1 (select delivery in cart)
2. Proceed to checkout
3. Look for fulfillment pre-selection banner
4. Verify shipping option is auto-selected

**Expected Results:**
- [ ] Green banner displays "✓ Delivery selected from your cart"
- [ ] Shipping/delivery option is automatically selected
- [ ] "Change selection" button appears
- [ ] No React errors in browser console

### Test 4: Checkout Auto-Selection (Pickup)
**Steps:**
1. Complete Test 2 (select pickup + location in cart)
2. Proceed to checkout
3. Look for fulfillment pre-selection banner
4. Verify pickup option is auto-selected

**Expected Results:**
- [ ] Banner displays "✓ Store pickup selected from your cart ([Location Name])"
- [ ] Store pickup option is automatically selected
- [ ] Correct pickup location is pre-selected
- [ ] "Change selection" button appears

### Test 5: No Pre-Selection Fallback
**Steps:**
1. Add products to cart
2. Navigate to cart page but don't make fulfillment selection
3. Proceed to checkout
4. Verify standard checkout behavior

**Expected Results:**
- [ ] No fulfillment pre-selection banner appears
- [ ] Standard shipping option selection works normally
- [ ] No JavaScript errors
- [ ] Checkout functions as expected

### Test 6: Change Selection in Checkout
**Steps:**
1. Complete Test 3 or Test 4 (make pre-selection)
2. In checkout, click "Change selection" button
3. Select different shipping option
4. Complete checkout process

**Expected Results:**
- [ ] "Change selection" button works
- [ ] Can change to different shipping option
- [ ] Banner disappears or updates appropriately
- [ ] Checkout completes successfully

## Technical Validation Tests

### JavaScript Console Tests
**Open browser dev tools → Console tab while testing**

**Expected for Cart Page:**
- [ ] No JavaScript errors
- [ ] CartFulfillment class initializes successfully
- [ ] Cart update AJAX calls return success status
- [ ] Event listeners are properly attached

**Expected for Checkout:**
- [ ] No React errors
- [ ] Extension renders without warnings
- [ ] Cart attributes are correctly read
- [ ] Shipping options are available

### Network Tab Tests  
**Open browser dev tools → Network tab while testing**

**Expected for Cart Updates:**
- [ ] `/cart/update.js` calls return 200 status
- [ ] Request payload includes correct attributes
- [ ] Response includes updated cart data

### Responsive Design Tests
- [ ] Mobile (375px width): Layout works properly
- [ ] Tablet (768px width): Elements are properly sized
- [ ] Desktop (1200px width): Full functionality maintained
- [ ] Touch interactions work on mobile devices

## Error Handling Tests

### Test 7: Network Failure Simulation
**Steps:**
1. Open dev tools → Network tab
2. Set throttling to "Offline"
3. Try to change fulfillment selection in cart
4. Verify error handling

**Expected Results:**
- [ ] Error message displays appropriately
- [ ] User is notified of the failure
- [ ] Interface doesn't break
- [ ] Can retry when connection restored

### Test 8: Invalid Data Handling
**Steps:**
1. Manually modify cart attributes via browser console
2. Set invalid fulfillment_type value
3. Proceed to checkout
4. Verify graceful degradation

**Expected Results:**
- [ ] Invalid data doesn't crash checkout extension
- [ ] Falls back to standard checkout behavior
- [ ] No unhandled React errors

## Accessibility Tests

### Keyboard Navigation
- [ ] Tab order is logical through fulfillment options
- [ ] Radio buttons can be selected via keyboard
- [ ] Dropdown can be navigated with arrow keys
- [ ] "Change selection" button is keyboard accessible

### Screen Reader Compatibility
- [ ] Radio button labels are properly associated
- [ ] Dropdown has accessible label
- [ ] Loading states are announced
- [ ] Error messages are announced

## Performance Tests

### Page Load Speed
- [ ] Cart page loads without noticeable delay
- [ ] JavaScript file loads without blocking rendering
- [ ] CSS doesn't cause layout shifts

### Memory Usage
- [ ] No memory leaks after multiple cart updates
- [ ] Event listeners are properly cleaned up
- [ ] No excessive API calls

## Browser Compatibility Tests

Test in these browsers:
- [ ] Chrome (latest)
- [ ] Firefox (latest)  
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

## Production Readiness Checklist

Before deploying to production:
- [ ] Replace mock location data with real Shopify Admin API calls
- [ ] Add proper error boundary components
- [ ] Implement analytics tracking
- [ ] Add loading states for location fetching
- [ ] Test with real inventory and pickup availability
- [ ] Optimize bundle sizes
- [ ] Add proper logging for debugging
- [ ] Set up monitoring and alerting

## Test Data Required

### Store Locations (Admin Setup)
Create test locations with these details:
- **Downtown Store**: 123 Main St, City, State 12345 (Pickup enabled)
- **Mall Location**: 456 Shopping Center Dr, City, State 12345 (Pickup enabled)
- **Westside Branch**: 789 West Ave, City, State 12345 (Pickup enabled)

### Test Products
- At least 1-2 products with inventory at pickup locations
- Products should have proper shipping configurations

### Shipping Zones
- Ensure shipping zones are configured for delivery options
- Local pickup should be enabled in shipping settings

## Debugging Commands

```bash
# Check extension status
shopify app info

# View app logs  
shopify app logs

# Redeploy extension
shopify app deploy

# Test theme locally
shopify theme dev --store=your-store.myshopify.com
```

## Success Criteria

POC is considered successful when:
- [ ] All 8 core tests pass
- [ ] No critical JavaScript/React errors
- [ ] Responsive design works across devices
- [ ] Basic accessibility requirements met
- [ ] Cart attributes persist through checkout
- [ ] Auto-selection works for both delivery and pickup

## Notes Section

Use this space to record any issues found during testing:

---

**Issues Found:**
- 

**Workarounds Applied:**
- 

**Future Improvements Needed:**
- 