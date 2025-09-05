import { useState, useEffect } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useActionData, useLoaderData, useFetcher } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  BlockStack,
  InlineStack,
  Link,
  Banner,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { DeliveryMethodSelector } from "../components/DeliveryMethodSelector";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  try {
    // Fetch store locations for pickup
    const locationsQuery = `
      query {
        locations(first: 10) {
          edges {
            node {
              id
              name
              address {
                formatted
              }
            }
          }
        }
      }
    `;

    // Fetch a sample product variant
    const productsQuery = `
      query {
        products(first: 1) {
          edges {
            node {
              id
              title
              variants(first: 1) {
                edges {
                  node {
                    id
                  }
                }
              }
            }
          }
        }
      }
    `;

    const [locationsResponse, productsResponse] = await Promise.all([
      admin.graphql(locationsQuery),
      admin.graphql(productsQuery)
    ]);

    const locationsData = await locationsResponse.json();
    const productsData = await productsResponse.json();
    
    const locations = locationsData.data?.locations?.edges
      .map((edge: any) => ({
        id: edge.node.id,
        name: edge.node.name,
        address: edge.node.address?.formatted || "Address not available"
      }))
      .filter((location: any) => location.id && location.name) // Filter out invalid locations
      || [];
    

    const sampleVariant = productsData.data?.products?.edges?.[0]?.node?.variants?.edges?.[0]?.node;

    return json({ locations, sampleVariant });
  } catch (error) {
    console.error("Error fetching data:", error);
    return json({ locations: [], sampleVariant: null });
  }
};

interface CartCreateResponse {
  cart?: {
    id: string;
    checkoutUrl: string;
    totalQuantity: number;
  };
  error?: string;
}

export default function DeliveryDemo() {
  const { locations, sampleVariant } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<CartCreateResponse>();
  const [cartUrl, setCartUrl] = useState<string | null>(null);

  const handleCreateCart = async (deliveryMethod: string, pickupLocationId?: string, lines?: any[]) => {
    const defaultLines = sampleVariant ? [
      {
        merchandiseId: sampleVariant.id,
        quantity: 1,
      }
    ] : [];

    const payload = {
      deliveryMethod,
      pickupLocationId,
      lines: lines || defaultLines
    };

    fetcher.submit(
      { data: JSON.stringify(payload) },
      {
        method: "POST",
        action: "/api/cart",
      }
    );
  };

  useEffect(() => {
    if (fetcher.data?.cart?.checkoutUrl) {
      setCartUrl(fetcher.data.cart.checkoutUrl);
    }
  }, [fetcher.data]);

  const isLoading = fetcher.state === "submitting";
  const error = fetcher.data?.error;

  return (
    <Page>
      <TitleBar title="Delivery Method Pre-Selection Demo" />
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <BlockStack gap="400">
              <Card>
                <BlockStack gap="300">
                  <Text as="h2" variant="headingMd">
                    Pickup vs Delivery Pre-Selection Demo
                  </Text>
                  <Text as="p" variant="bodyMd">
                    This demo shows how to pre-select pickup vs delivery methods in Shopify checkout
                    using the 2024 Cart API preferences feature. Select your preferred method below
                    and create a cart to see the checkout with your choice pre-selected.
                  </Text>
                  {!sampleVariant && (
                    <Banner status="info">
                      No products found in your store. You may need to create a product first to test cart creation.
                    </Banner>
                  )}
                  {sampleVariant && (
                    <Text as="p" variant="bodyMd" color="success">
                      ✅ Using sample product for cart creation: {sampleVariant.id}
                    </Text>
                  )}
                </BlockStack>
              </Card>

              <DeliveryMethodSelector
                locations={locations}
                onCreateCart={handleCreateCart}
                loading={isLoading}
                error={error}
              />

              {cartUrl && (
                <Card>
                  <BlockStack gap="300">
                    <Text as="h3" variant="headingMd" color="success">
                      Cart Created Successfully! 🎉
                    </Text>
                    <Text as="p" variant="bodyMd">
                      Your cart has been created with delivery preferences. 
                      Click the link below to see the checkout with your selected delivery method pre-selected.
                    </Text>
                    <InlineStack>
                      <Link
                        url={cartUrl}
                        target="_blank"
                        external
                      >
                        Open Checkout with Pre-Selected Delivery Method
                      </Link>
                    </InlineStack>
                  </BlockStack>
                </Card>
              )}

              <Card>
                <BlockStack gap="300">
                  <Text as="h3" variant="headingMd">
                    Technical Implementation
                  </Text>
                  <BlockStack gap="200">
                    <Text as="p" variant="bodyMd">
                      This implementation uses:
                    </Text>
                    <ul style={{ marginLeft: "1rem" }}>
                      <li><strong>Shopify Storefront API</strong> - cartCreate mutation with preferences</li>
                      <li><strong>2024-04 API version</strong> - Latest version supporting delivery preferences</li>
                      <li><strong>Cart preferences object</strong> - Pre-populates delivery method and pickup location</li>
                      <li><strong>Location API</strong> - Fetches available pickup locations</li>
                    </ul>
                  </BlockStack>
                </BlockStack>
              </Card>
            </BlockStack>
          </Layout.Section>

          <Layout.Section variant="oneThird">
            <BlockStack gap="400">
              <Card>
                <BlockStack gap="200">
                  <Text as="h3" variant="headingMd">
                    Locations Available
                  </Text>
                  {locations.length > 0 ? (
                    <BlockStack gap="100">
                      {locations.map((location: any) => (
                        <Text key={location.id} as="p" variant="bodyMd">
                          • {location.name}
                        </Text>
                      ))}
                    </BlockStack>
                  ) : (
                    <Banner status="info">
                      No pickup locations found. You may need to set up locations in your Shopify admin.
                    </Banner>
                  )}
                </BlockStack>
              </Card>

              <Card>
                <BlockStack gap="200">
                  <Text as="h3" variant="headingMd">
                    Next Steps
                  </Text>
                  <ul style={{ marginLeft: "1rem" }}>
                    <li>Test with real products</li>
                    <li>Set up actual pickup locations</li>
                    <li>Add Delivery Customization Function</li>
                    <li>Implement in your storefront</li>
                  </ul>
                </BlockStack>
              </Card>
            </BlockStack>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}