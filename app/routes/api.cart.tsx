import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  // Handle both app requests and storefront requests
  let admin, session;
  
  try {
    // Try to authenticate as admin first (for app requests)
    const authResult = await authenticate.admin(request);
    admin = authResult.admin;
    session = authResult.session;
  } catch (error) {
    // For storefront requests, we need to get the shop from headers or other means
    const shop = request.headers.get('x-shopify-shop') || request.headers.get('referer')?.match(/https?:\/\/([^\/]+)/)?.[1];
    if (!shop) {
      return json({ error: "Unable to determine shop" }, { status: 400 });
    }
    
    // Create a minimal session object for storefront requests
    session = { shop };
    
    // We'll need to get admin access differently for storefront requests
    // For now, let's use a placeholder - you might need to adjust this based on your setup
  }
  
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    let body;
    
    // Handle different content types
    const contentType = request.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      body = await request.json();
    } else {
      const formData = await request.formData();
      const bodyStr = formData.get("data") as string;
      body = JSON.parse(bodyStr);
    }
    
    const { lines, deliveryMethod, pickupLocationId } = body;

    const storefrontAccessToken = await getStorefrontAccessToken(admin);
    
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

    const cartInput = {
      lines: lines || [],
      ...(deliveryMethod && {
        preferences: {
          delivery: {
            deliveryMethod: deliveryMethod.toUpperCase(),
            ...(pickupLocationId && { pickupLocationId })
          }
        }
      })
    };

    const storefrontResponse = await fetch(
      `https://${session.shop}/api/2024-04/graphql.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Storefront-Access-Token": storefrontAccessToken,
        },
        body: JSON.stringify({
          query: cartCreateMutation,
          variables: { input: cartInput }
        }),
      }
    );

    const result = await storefrontResponse.json();

    if (result.errors) {
      return json({ error: "GraphQL errors", details: result.errors }, { status: 400 });
    }

    const cartData = result.data?.cartCreate;
    
    if (cartData?.userErrors?.length > 0) {
      return json({ error: "Cart creation failed", details: cartData.userErrors }, { status: 400 });
    }

    return json({ cart: cartData?.cart });

  } catch (error) {
    console.error("Cart creation error:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
};

async function getStorefrontAccessToken(admin: any) {
  const storefrontAccessTokenQuery = `
    query {
      storefrontAccessTokens(first: 1) {
        edges {
          node {
            accessToken
            title
          }
        }
      }
    }
  `;

  const response = await admin.graphql(storefrontAccessTokenQuery);
  const data = await response.json();
  
  const tokens = data.data?.storefrontAccessTokens?.edges;
  
  if (!tokens || tokens.length === 0) {
    throw new Error("No storefront access token found. Please create one in your Shopify admin.");
  }
  
  return tokens[0].node.accessToken;
}