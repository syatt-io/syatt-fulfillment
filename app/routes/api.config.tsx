import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";

// CORS headers for cross-origin requests from Shopify storefront
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Requested-With",
};

// Handle preflight OPTIONS request
export const action = async () => {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    // Get the app URL from environment variables
    const appUrl = process.env.SHOPIFY_APP_URL || process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000' 
      : 'https://syatt-fulfillment-d4pju.ondigitalocean.app';

    return json(
      {
        appUrl,
        environment: process.env.NODE_ENV || 'development'
      },
      { 
        headers: {
          ...corsHeaders,
          // Cache for 5 minutes
          "Cache-Control": "public, max-age=300"
        }
      }
    );

  } catch (error) {
    console.error("Config fetch error:", error);
    return json(
      { error: "Internal server error" },
      { 
        status: 500,
        headers: corsHeaders 
      }
    );
  }
};