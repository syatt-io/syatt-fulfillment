# Shopify Functions & App Development Learnings

## Overview
This document captures key learnings and best practices from implementing Shopify delivery customization functions and app development.

## Delivery Customization Functions

### What They Do
- **Purpose**: Filter and modify delivery options shown at checkout
- **Type**: `cart.delivery-options.transform.run` function
- **Trigger**: Runs for every checkout session automatically
- **Input**: Cart data including attributes, delivery groups, and available options
- **Output**: Operations to hide/show delivery options

### Key Implementation Steps

#### 1. Function Generation
```bash
# Generate the function
shopify app generate extension --type=delivery_customization

# Choose cart.delivery-options.transform.run
# Function gets created in extensions/{function-name}/
```

#### 2. GraphQL Query Configuration
```graphql
# File: extensions/{function-name}/src/{function-name}.graphql
query CartDeliveryOptionsTransformRunInput {
  cart {
    # Cart attributes for conditional logic
    fulfillmentTypeAttribute: attribute(key: "fulfillment_type") { value }
    pickupLocationIdAttribute: attribute(key: "pickup_location_id") { value }
    
    # Delivery options to filter
    deliveryGroups {
      deliveryOptions {
        code
        title
        handle
      }
    }
  }
}
```

#### 3. Function Implementation
```javascript
// File: extensions/{function-name}/src/{function-name}.js
export function cartDeliveryOptionsTransformRun(input) {
  const cart = input?.cart;
  const fulfillmentType = cart.fulfillmentTypeAttribute?.value;
  
  if (!fulfillmentType) {
    return { operations: [] }; // No changes
  }
  
  const operations = [];
  
  cart.deliveryGroups?.forEach((deliveryGroup) => {
    deliveryGroup.deliveryOptions?.forEach((deliveryOption) => {
      const optionHandle = deliveryOption.handle;
      const isPickupOption = /* logic to determine pickup vs delivery */;
      
      let shouldHide = false;
      if (fulfillmentType === "pickup" && !isPickupOption) {
        shouldHide = true;
      } else if (fulfillmentType === "delivery" && isPickupOption) {
        shouldHide = true;
      }
      
      if (shouldHide) {
        operations.push({
          hide: {
            deliveryOptionHandle: optionHandle
          }
        });
      }
    });
  });
  
  return { operations };
}
```

#### 4. Deployment & Activation

**Deploy the Function:**
```bash
shopify app deploy --force
```

**Activate via Admin GraphQL:**
```graphql
mutation deliveryCustomizationCreate($deliveryCustomization: DeliveryCustomizationInput!) {
  deliveryCustomizationCreate(deliveryCustomization: $deliveryCustomization) {
    deliveryCustomization {
      id
      title
      enabled
      functionId
    }
    userErrors {
      field
      message
    }
  }
}
```

Variables:
```json
{
  "deliveryCustomization": {
    "functionId": "76d887fa-c26d-4ce9-b89a-91833951de72", // From .env file
    "title": "Fulfillment Selector",
    "enabled": true
  }
}
```

### Critical Issues & Solutions

#### Issue 1: Function ID Mismatch
**Problem**: Using function handle `"fulfillment-selector"` instead of UUID
**Error**: `Function fulfillment-selector not found`
**Solution**: Use the UUID from `.env` file (`SHOPIFY_FULFILLMENT_SELECTOR_ID`)

#### Issue 2: Client-Side Environment Variables
**Problem**: `process.env` not available in React components
**Error**: `ReferenceError: process is not defined`
**Solution**: Move environment variable access to server-side loader functions

```typescript
// ❌ Wrong - Client-side access
export default function Component() {
  const functionId = process.env.SHOPIFY_FULFILLMENT_SELECTOR_ID; // Error!
}

// ✅ Correct - Server-side loader
export const loader = async ({ request }: LoaderFunctionArgs) => {
  return json({
    functionId: process.env.SHOPIFY_FULFILLMENT_SELECTOR_ID,
    // ... other data
  });
};
```

#### Issue 3: Missing Permissions
**Problem**: GraphQL access denied for delivery customizations
**Solution**: Add correct scopes to `shopify.app.toml`

```toml
[access_scopes]
scopes = "write_products,read_orders,read_shipping,write_shipping,write_delivery_customizations"
```

#### Issue 4: Invalid Configuration Field
**Problem**: Including `configuration` in GraphQL mutation
**Error**: `Field is not defined on DeliveryCustomizationInput`
**Solution**: Remove configuration field from mutation

### Testing the Function

#### 1. Set Cart Attributes
```javascript
// Via Cart API
fetch('/cart/update.js', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    attributes: {
      fulfillment_type: 'pickup', // or 'delivery'
      pickup_location_id: 'location_123'
    }
  })
});
```

#### 2. Check Function Logs
Function runs at checkout and logs to browser console:
```
🚀 DELIVERY CUSTOMIZATION FUNCTION IS RUNNING!
🔍 Cart analysis: { fulfillmentType: 'pickup', ... }
🚫 Hiding delivery option: { handle: 'shipping-option-1', ... }
```

#### 3. Verify at Checkout
- Add products to cart
- Set cart attributes 
- Go to checkout
- Verify only relevant delivery options are shown

## Remix App Development

### Environment Variables
- **Server-side only**: `process.env` available in loaders/actions
- **Client-side**: Use loader data to pass server values to components
- **Pattern**: Read env vars in loader, pass to component via useLoaderData

### GraphQL Authentication
- Use `authenticate.admin(request)` in loaders/actions
- Admin API client automatically handles authentication
- Scopes must be declared in `shopify.app.toml` and deployed

### Development Workflow
```bash
# Start development server
shopify app dev --store=your-store.myshopify.com

# Deploy app (pushes scopes to Partner Dashboard)
shopify app deploy --force

# Function builds automatically with app
# WASM files generated in extensions/{name}/dist/
```

## Key File Locations

```
├── extensions/
│   └── fulfillment-selector/
│       ├── src/
│       │   ├── cart_delivery_options_transform_run.js
│       │   └── cart_delivery_options_transform_run.graphql
│       ├── dist/
│       │   └── function.wasm
│       └── shopify.function.extension.toml
├── app/
│   └── routes/
│       └── app.functions.tsx  # Admin interface for activation
├── .env  # Contains function UUIDs
└── shopify.app.toml  # App config including scopes
```

## Best Practices

### Function Development
1. **Always log extensively** - Functions run server-side, logs help debug
2. **Handle missing data gracefully** - Cart attributes may not exist
3. **Use descriptive operation names** - Makes debugging easier
4. **Test with different cart states** - Empty cart, missing attributes, etc.

### App Development  
1. **Server-side environment variables** - Never access `process.env` in components
2. **Proper error handling** - GraphQL can fail, handle gracefully
3. **Deploy after scope changes** - New scopes need deployment to work
4. **Use correct function IDs** - UUIDs from .env, not string handles

### Debugging
1. **Check browser console** - Function logs appear here during checkout
2. **Verify function deployment** - Check if WASM file exists in dist/
3. **Confirm activation** - Query deliveryCustomizations to verify activation
4. **Test incrementally** - Start with simple logic, add complexity gradually

## Common Gotchas

1. **Function activation != deployment** - Function must be both deployed AND activated
2. **UUID vs handle confusion** - Use UUID from .env for activation, not string handle  
3. **Client-side env vars** - Will cause hydration errors in React
4. **Scope deployment** - Changes to scopes require `shopify app deploy`
5. **Cart attribute timing** - Attributes must be set before checkout to be available

## Success Criteria

Function is working correctly when:
- ✅ No console errors in React app
- ✅ Function shows as "Active" in admin interface  
- ✅ Checkout shows filtered delivery options based on cart attributes
- ✅ Function logs appear in browser console during checkout
- ✅ Correct delivery options hidden/shown based on fulfillment type

## Resources

- [Shopify Functions Documentation](https://shopify.dev/docs/api/functions)
- [Delivery Customization Functions](https://shopify.dev/docs/api/functions/reference/cart-delivery-options-transform)
- [Admin GraphQL API](https://shopify.dev/docs/api/admin-graphql)
- [Remix Environment Variables](https://remix.run/docs/en/1.19.3/guides/envvars)