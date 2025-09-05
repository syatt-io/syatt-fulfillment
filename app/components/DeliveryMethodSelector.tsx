import { useState } from "react";
import {
  Card,
  FormLayout,
  RadioButton,
  Select,
  Button,
  Banner,
  Spinner,
} from "@shopify/polaris";

interface Location {
  id: string;
  name: string;
  address: string;
}

interface DeliveryMethodSelectorProps {
  locations?: Location[];
  onCreateCart: (deliveryMethod: string, pickupLocationId?: string, lines?: any[]) => void;
  loading?: boolean;
  error?: string;
}

export function DeliveryMethodSelector({ 
  locations = [], 
  onCreateCart, 
  loading = false,
  error 
}: DeliveryMethodSelectorProps) {
  const [deliveryMethod, setDeliveryMethod] = useState("shipping");
  const [selectedLocation, setSelectedLocation] = useState("");

  const locationOptions = locations.map(location => ({
    label: `${location.name} - ${location.address}`,
    value: location.id,
  }));

  const handleCreateCart = () => {
    onCreateCart(
      deliveryMethod,
      deliveryMethod === "pickup" ? selectedLocation : undefined
    );
  };

  const isPickupSelected = deliveryMethod === "pickup";
  const canSubmit = !isPickupSelected || (isPickupSelected && selectedLocation);

  return (
    <Card>
      <FormLayout>
        <div>
          <p style={{ marginBottom: "1rem", fontWeight: "bold" }}>
            Choose your delivery method:
          </p>
          
          <RadioButton
            label="Shipping to my address"
            checked={deliveryMethod === "shipping"}
            id="shipping"
            name="deliveryMethod"
            onChange={() => setDeliveryMethod("shipping")}
          />
          
          <RadioButton
            label="Pickup from store"
            checked={deliveryMethod === "pickup"}
            id="pickup"
            name="deliveryMethod"
            onChange={() => setDeliveryMethod("pickup")}
          />
        </div>

        {isPickupSelected && (
          <Select
            label="Select pickup location"
            options={[
              { label: "Choose a store", value: "" },
              ...locationOptions
            ]}
            value={selectedLocation}
            onChange={setSelectedLocation}
            placeholder="Choose a store location"
          />
        )}

        {error && (
          <Banner status="critical" title="Error creating cart">
            {error}
          </Banner>
        )}

        <Button
          primary
          onClick={handleCreateCart}
          disabled={!canSubmit || loading}
          loading={loading}
        >
          {loading ? <Spinner size="small" /> : "Create Cart with Preferences"}
        </Button>

        <div style={{ marginTop: "1rem", fontSize: "0.875rem", color: "#637381" }}>
          <p><strong>What this demonstrates:</strong></p>
          <ul style={{ marginLeft: "1rem" }}>
            <li>Pre-selects {deliveryMethod} method in checkout</li>
            {isPickupSelected && selectedLocation && (
              <li>Pre-selects specific pickup location</li>
            )}
            <li>Uses Shopify's 2024 Cart API preferences feature</li>
          </ul>
        </div>
      </FormLayout>
    </Card>
  );
}