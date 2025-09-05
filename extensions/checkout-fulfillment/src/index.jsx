import {
  reactExtension,
  Banner,
  useAttributeValues,
} from '@shopify/ui-extensions-react/checkout';
import { useEffect, useState } from 'react';

export default reactExtension(
  'purchase.checkout.contact.render-after',
  () => <FulfillmentPreSelection />
);

function FulfillmentPreSelection() {
  console.log('🎯 Fulfillment extension loaded at contact.render-after position!');
  
  const fulfillmentType = useAttributeValues(['fulfillment_type']);
  const pickupLocationId = useAttributeValues(['pickup_location_id']);
  const pickupLocationName = useAttributeValues(['pickup_location_name']);
  
  const [debugMode, setDebugMode] = useState(true);

  useEffect(() => {
    console.log('🔍 Extension useEffect running at contact position...');
    console.log('📦 Cart attributes:');
    console.log('  - fulfillmentType:', fulfillmentType);
    console.log('  - pickupLocationId:', pickupLocationId);
    console.log('  - pickupLocationName:', pickupLocationName);
    
    if (fulfillmentType && fulfillmentType[0]) {
      console.log('✅ Found pre-selection:', fulfillmentType[0]);
    } else {
      console.log('ℹ️ No fulfillment type found in cart attributes');
    }
  }, [fulfillmentType, pickupLocationId, pickupLocationName]);

  const hasPreSelection = fulfillmentType && fulfillmentType[0];
  
  // Debug version - always visible when no pre-selection
  if (debugMode && !hasPreSelection) {
    return (
      <Banner status="info">
        🧪 CONTACT POSITION: Fulfillment Extension Working! No pre-selection found. Try adding fulfillment_type to cart attributes.
      </Banner>
    );
  }

  // Show pre-selection banner
  if (hasPreSelection) {
    const type = fulfillmentType[0];
    const locationName = pickupLocationName && pickupLocationName[0];
    
    const bannerTitle = type === 'delivery' 
      ? '✓ Delivery selected from your cart'
      : `✓ Store pickup selected from your cart${locationName ? ` (${locationName})` : ''}`;

    return (
      <Banner status="success">
        {bannerTitle}
      </Banner>
    );
  }

  return (
    <Banner status="info">
      🧪 CONTACT POSITION: Extension loaded successfully. Waiting for fulfillment data...
    </Banner>
  );
}