import { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useActionData, Form } from "@remix-run/react";
import { json } from "@remix-run/node";
import { Card, Page, BlockStack, Button, Text, Banner } from "@shopify/polaris";
import { authenticate } from "../shopify.server";

const DELIVERY_CUSTOMIZATION_MUTATION = `
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
`;

const DELIVERY_CUSTOMIZATIONS_QUERY = `
  query deliveryCustomizations {
    deliveryCustomizations(first: 10) {
      nodes {
        id
        title
        enabled
        functionId
      }
    }
  }
`;

const DELIVERY_CUSTOMIZATION_DELETE_MUTATION = `
  mutation deliveryCustomizationDelete($id: ID!) {
    deliveryCustomizationDelete(id: $id) {
      deletedId
      userErrors {
        field
        message
      }
    }
  }
`;

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  try {
    const response = await admin.graphql(DELIVERY_CUSTOMIZATIONS_QUERY);
    const data = await response.json();
    
    return json({
      customizations: data.data?.deliveryCustomizations?.nodes || [],
      functionId: process.env.SHOPIFY_FULFILLMENT_SELECTOR_ID || "76d887fa-c26d-4ce9-b89a-91833951de72",
      error: null
    });
  } catch (error) {
    console.error("Error fetching delivery customizations:", error);
    return json({
      customizations: [],
      functionId: process.env.SHOPIFY_FULFILLMENT_SELECTOR_ID || "76d887fa-c26d-4ce9-b89a-91833951de72",
      error: "Failed to load delivery customizations"
    });
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const actionType = formData.get("action");

  if (actionType === "create") {
    const functionId = process.env.SHOPIFY_FULFILLMENT_SELECTOR_ID || "76d887fa-c26d-4ce9-b89a-91833951de72";
    try {
      const response = await admin.graphql(DELIVERY_CUSTOMIZATION_MUTATION, {
        variables: {
          deliveryCustomization: {
            functionId: functionId,
            title: "Fulfillment Selector",
            enabled: true
          }
        }
      });

      const data = await response.json();
      
      if (data.data?.deliveryCustomizationCreate?.userErrors?.length > 0) {
        return json({
          success: false,
          errors: data.data.deliveryCustomizationCreate.userErrors
        });
      }

      return json({
        success: true,
        customization: data.data?.deliveryCustomizationCreate?.deliveryCustomization
      });
    } catch (error) {
      console.error("Error creating delivery customization:", error);
      return json({
        success: false,
        errors: [{ message: "Failed to create delivery customization" }]
      });
    }
  }

  if (actionType === "delete") {
    const customizationId = formData.get("customizationId");
    
    try {
      const response = await admin.graphql(DELIVERY_CUSTOMIZATION_DELETE_MUTATION, {
        variables: {
          id: customizationId
        }
      });

      const data = await response.json();
      
      if (data.data?.deliveryCustomizationDelete?.userErrors?.length > 0) {
        return json({
          success: false,
          errors: data.data.deliveryCustomizationDelete.userErrors
        });
      }

      return json({
        success: true,
        deletedId: data.data?.deliveryCustomizationDelete?.deletedId
      });
    } catch (error) {
      console.error("Error deleting delivery customization:", error);
      return json({
        success: false,
        errors: [{ message: "Failed to delete delivery customization" }]
      });
    }
  }

  return json({ success: false, errors: [{ message: "Invalid action" }] });
};

export default function Functions() {
  const { customizations, functionId, error } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  const fulfillmentSelectorCustomization = customizations.find(
    (c) => c.functionId === functionId || c.title === "Fulfillment Selector"
  );

  return (
    <Page title="Delivery Customization Functions">
      <BlockStack gap="400">
        {error && (
          <Banner tone="critical">
            <Text>{error}</Text>
          </Banner>
        )}

        {actionData?.success === false && (
          <Banner tone="critical">
            <Text>
              {actionData.errors?.map((e: any) => e.message).join(", ")}
            </Text>
          </Banner>
        )}

        {actionData?.success === true && (
          <Banner tone="success">
            <Text>
              {actionData.customization 
                ? "Delivery customization activated successfully!"
                : "Delivery customization deleted successfully!"
              }
            </Text>
          </Banner>
        )}

        <Card>
          <BlockStack gap="300">
            <Text variant="headingMd">Fulfillment Selector Function</Text>
            <Text>
              This function filters delivery options at checkout based on customer's 
              fulfillment preference (pickup vs delivery) selected in the cart.
            </Text>

            {fulfillmentSelectorCustomization ? (
              <BlockStack gap="200">
                <Text>
                  <strong>Status:</strong> {fulfillmentSelectorCustomization.enabled ? "✅ Active" : "⚠️ Inactive"}
                </Text>
                <Text>
                  <strong>ID:</strong> {fulfillmentSelectorCustomization.id}
                </Text>
                <Text>
                  <strong>Function ID:</strong> {fulfillmentSelectorCustomization.functionId}
                </Text>
                
                <Form method="post">
                  <input type="hidden" name="action" value="delete" />
                  <input type="hidden" name="customizationId" value={fulfillmentSelectorCustomization.id} />
                  <Button variant="primary" tone="critical" submit>
                    Deactivate Function
                  </Button>
                </Form>
              </BlockStack>
            ) : (
              <BlockStack gap="200">
                <Text>
                  <strong>Status:</strong> ❌ Not activated
                </Text>
                <Text>
                  The delivery customization function is deployed but needs to be activated 
                  to start filtering checkout delivery options.
                </Text>
                
                <Form method="post">
                  <input type="hidden" name="action" value="create" />
                  <Button variant="primary" submit>
                    Activate Function
                  </Button>
                </Form>
              </BlockStack>
            )}
          </BlockStack>
        </Card>

        {customizations.length > 0 && (
          <Card>
            <BlockStack gap="300">
              <Text variant="headingMd">All Delivery Customizations</Text>
              {customizations.map((customization) => (
                <BlockStack key={customization.id} gap="100">
                  <Text><strong>{customization.title}</strong></Text>
                  <Text>Function ID: {customization.functionId}</Text>
                  <Text>Status: {customization.enabled ? "Active" : "Inactive"}</Text>
                  <Text>ID: {customization.id}</Text>
                </BlockStack>
              ))}
            </BlockStack>
          </Card>
        )}
      </BlockStack>
    </Page>
  );
}