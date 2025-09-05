# Testing Delivery Customization with Cart Attributes

## Option 1: Use Production Cart → Local Checkout
1. Go to your production store: https://syatt-personalize.myshopify.com
2. Add products to cart and select fulfillment type (pickup/delivery)
3. When you click checkout, manually change the URL from production to your local tunnel
   - From: `https://syatt-personalize.myshopify.com/checkouts/...`
   - To: `https://[your-cloudflare-url].trycloudflare.com/checkouts/...`

## Option 2: Set Cart Attributes via URL Parameters
Add these parameters to your local checkout URL:
- `?attributes[fulfillment_type]=pickup`
- `?attributes[pickup_location_id]=gid://shopify/Location/123456789`

## Option 3: Use GraphQL to Create Cart with Attributes
Use the GraphQL playground at http://localhost:3457 to create a cart with attributes:

```graphql
mutation {
  cartCreate(input: {
    lines: [{
      merchandiseId: "gid://shopify/ProductVariant/YOUR_VARIANT_ID"
      quantity: 1
    }]
    attributes: [
      { key: "fulfillment_type", value: "pickup" }
      { key: "pickup_location_id", value: "gid://shopify/Location/123456789" }
    ]
  }) {
    cart {
      checkoutUrl
    }
  }
}
```

## Option 4: Share Session Between Production and Local
1. Set cart attributes in production
2. Copy the cart/checkout ID from the URL
3. Use the same checkout ID in your local environment
