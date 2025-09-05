import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";

// CORS headers for cross-origin requests from Shopify storefront
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Requested-With",
};

// Handle preflight OPTIONS request
export const loader = async () => {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { 
      status: 405,
      headers: corsHeaders 
    });
  }

  try {
    const body = await request.json();
    const { lines, deliveryMethod, pickupLocationId, shop } = body;

    if (!shop) {
      return json({ error: "Shop parameter is required" }, { 
        status: 400,
        headers: corsHeaders 
      });
    }

    // For storefront requests, we'll use a simpler approach
    // You would need to configure a storefront access token for this shop
    const STOREFRONT_ACCESS_TOKEN = process.env.STOREFRONT_ACCESS_TOKEN || "your-storefront-access-token";
    
    const cartCreateMutation = `
      mutation cartCreate($input: CartInput!) {
        cartCreate(input: $input) {
          cart {
            id
            checkoutUrl
            totalQuantity
            cost {
              totalAmount {
                amount
                currencyCode
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    // Note: preferences field is not available in Storefront API
    // We'll create a regular cart and use cart attributes instead
    const cartInput = {
      lines: lines || [],
      attributes: [
        { key: "fulfillment_type", value: deliveryMethod || "shipping" },
        ...(pickupLocationId ? [{ key: "pickup_location_id", value: pickupLocationId }] : [])
      ]
    };

    const storefrontResponse = await fetch(
      `https://${shop}/api/2024-10/graphql.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Storefront-Access-Token": STOREFRONT_ACCESS_TOKEN,
        },
        body: JSON.stringify({
          query: cartCreateMutation,
          variables: { input: cartInput }
        }),
      }
    );

    const result = await storefrontResponse.json();

    if (result.errors) {
      return json({ error: "GraphQL errors", details: result.errors }, { 
        status: 400,
        headers: corsHeaders 
      });
    }

    const cartData = result.data?.cartCreate;
    
    if (cartData?.userErrors?.length > 0) {
      return json({ error: "Cart creation failed", details: cartData.userErrors }, { 
        status: 400,
        headers: corsHeaders 
      });
    }

    return json({ cart: cartData?.cart }, { headers: corsHeaders });

  } catch (error) {
    console.error("Cart creation error:", error);
    return json({ error: "Internal server error" }, { 
      status: 500,
      headers: corsHeaders 
    });
  }
};