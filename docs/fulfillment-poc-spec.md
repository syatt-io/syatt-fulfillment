# Simplified Fulfillment Pre-Selection POC Specification

## Objective
Create a proof of concept that allows customers to select their fulfillment method (Delivery or Store Pickup) in the cart, then automatically applies this selection in the Shopify Plus checkout.

## Scope
- **In Scope**: Cart fulfillment selector, checkout extension to read and apply selection
- **Out of Scope**: PDP selection, complex validation, inventory checks, analytics

## Technical Specification for Claude Code

### 1. Cart Page Component (`sections/cart-fulfillment-selector.liquid`)

**Functionality:**
- Display radio button selector above checkout button
- Options: "Ship to me" and "Pick up in store"
- If pickup selected, show dropdown of available store locations
- Save selection to cart attributes via AJAX when changed
- Show current selection state on page load

**Data Structure:**
```javascript
// Cart attributes to set
{
  "attributes[fulfillment_type]": "delivery" | "pickup",
  "attributes[pickup_location_id]": "gid://shopify/Location/123456789",
  "attributes[pickup_location_name]": "Downtown Store"
}
```

**Implementation Notes:**
- Use Shopify Cart AJAX API (`/cart/update.js`)
- Fetch available pickup locations from Shopify's API
- Add visual feedback when selection changes (loading state)
- Style to match theme's existing cart design

### 2. Checkout UI Extension (`extensions/checkout-fulfillment/`)

**Configuration (`shopify.extension.toml`):**
- Name: "Fulfillment Pre-Selection"
- Type: UI Extension
- Target: `purchase.checkout.shipping-option-list.render-before`

**Main Component (`src/index.jsx`):**

**Core Logic:**
1. Read cart attributes using `useCartAttributes()` hook
2. Get available shipping options using `useShippingOptionList()`
3. If fulfillment_type exists in attributes:
   - Find matching shipping option
   - Auto-select using `applyShippingOption()`
   - Display custom banner showing pre-selection
4. Allow user to change selection if needed

**UI Requirements:**
- Show banner: "✓ [Delivery/Pickup] selected from your cart"
- Highlight pre-selected option with accent color
- Add "Change" button to expand all options if collapsed

### 3. File Structure for POC

```
theme/
├── sections/
│   └── cart-fulfillment-selector.liquid
├── assets/
│   └── cart-fulfillment.js
└── templates/
    └── cart.json (updated to include new section)

checkout-extension/
├── shopify.extension.toml
├── package.json
└── src/
    └── index.jsx
```

### 4. Step-by-Step Implementation Guide

#### Phase 1: Cart Selector
1. Create liquid section with fulfillment selector UI
2. Add JavaScript to handle selection changes
3. Implement Cart AJAX API calls to save attributes
4. Add to cart template

#### Phase 2: Checkout Extension
1. Initialize checkout extension with Shopify CLI
2. Read cart attributes in extension
3. Implement auto-selection logic
4. Add visual indicators for pre-selection
5. Test in development store

### 5. Test Data Setup

**Store Locations (Admin Setup):**
- Create 2-3 test locations with pickup enabled
- Ensure locations have inventory
- Set pickup availability in Shipping settings

**Test Scenarios:**
1. Select delivery → Proceed to checkout → Verify auto-selection
2. Select pickup → Proceed to checkout → Verify location selected
3. Don't select → Proceed to checkout → Verify standard behavior
4. Change selection in checkout → Verify it works

### 6. Simplified POC Code Structure

#### Cart JavaScript (Pseudocode)
```
// Listen for fulfillment selection change
// Get selected value (delivery or pickup)
// If pickup, get selected location details
// Call /cart/update.js with attributes
// Show success feedback
```

#### Checkout Extension (Pseudocode)
```
// Import Shopify checkout UI components
// Read cart attributes
// Find matching shipping option
// Apply selection automatically
// Render custom banner
// Handle user changes
```

### 7. Development Instructions for Claude Code

When implementing this POC:

1. **Start with the cart selector:**
   - Create a simple, functional UI first
   - Ensure cart attributes are properly saved
   - Test that attributes persist to checkout

2. **Then build the checkout extension:**
   - Use Shopify's checkout UI extension React components
   - Focus on reading and applying the selection
   - Add visual feedback last

3. **Keep it simple:**
   - No complex validation for POC
   - Assume happy path (locations available, valid selection)
   - Use console.log for debugging
   - Include error boundaries but simple error messages

### 8. Expected Deliverables

1. **Cart Fulfillment Selector Section**
   - Liquid template file
   - JavaScript for interaction
   - Basic styling

2. **Checkout UI Extension**
   - Complete extension folder
   - Configuration file
   - React component with selection logic

3. **Installation Instructions**
   - How to add section to cart
   - How to deploy checkout extension
   - Test store setup requirements

### 9. Success Criteria for POC

- [ ] Fulfillment selection saves to cart attributes
- [ ] Selection persists to checkout
- [ ] Checkout auto-selects matching option
- [ ] User can change selection in checkout
- [ ] No JavaScript errors in console
- [ ] Works on desktop and mobile

### 10. Known Limitations (Acceptable for POC)

- No inventory validation
- No address-based validation
- Basic styling only
- English only
- No analytics tracking
- No loading states optimization

---

## Quick Start for Claude Code

**Prompt Structure:**
"Create a Shopify Plus proof of concept with:
1. A cart section that lets users choose between delivery or store pickup
2. A checkout UI extension that reads this selection and auto-applies it
3. Use cart attributes to pass data between cart and checkout
4. Keep it simple - no complex validation needed for POC"

**Key Technical Details to Include:**
- Shopify Plus with checkout extensibility enabled
- React for checkout extension
- Vanilla JavaScript for cart (or theme's existing framework)
- Cart AJAX API for attribute updates
- Checkout UI Extensions API for reading attributes

This specification should give Claude Code enough context to build a functional POC that demonstrates the core concept without unnecessary complexity.