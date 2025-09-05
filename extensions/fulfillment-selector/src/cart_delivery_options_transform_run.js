// @ts-check

/**
 * @typedef {import("../generated/api").CartDeliveryOptionsTransformRunInput} CartDeliveryOptionsTransformRunInput
 * @typedef {import("../generated/api").CartDeliveryOptionsTransformRunResult} CartDeliveryOptionsTransformRunResult
 */

/**
 * @type {CartDeliveryOptionsTransformRunResult}
 */
const NO_CHANGES = {
  operations: [],
};

/**
 * @param {CartDeliveryOptionsTransformRunInput} input
 * @returns {CartDeliveryOptionsTransformRunResult}
 */
export function cartDeliveryOptionsTransformRun(input) {
  // ALWAYS LOG - even if function fails
  console.error('🚀 DELIVERY CUSTOMIZATION FUNCTION IS RUNNING!');

  const configuration = input?.deliveryCustomization?.metafield?.jsonValue ?? {};
  const cart = input?.cart;

  if (!cart) {
    console.error('❌ No cart found in input');
    return NO_CHANGES;
  }

  // Get cart attributes
  const fulfillmentType = cart.fulfillmentTypeAttribute?.value;
  const pickupLocationId = cart.pickupLocationIdAttribute?.value;

  console.error('🔍 Cart analysis:');
  console.error('  fulfillmentType:', fulfillmentType || 'undefined');
  console.error('  pickupLocationId:', pickupLocationId || 'undefined');
  console.error('  deliveryGroupsCount:', cart.deliveryGroups?.length || 0);

  // If no fulfillment type is specified, don't modify anything
  if (!fulfillmentType) {
    console.error('⚠️ No fulfillment type found - returning NO_CHANGES');
    return NO_CHANGES;
  }

  const operations = [];

  // Process each delivery group
  cart.deliveryGroups?.forEach((deliveryGroup, groupIndex) => {
    deliveryGroup.deliveryOptions?.forEach((deliveryOption, optionIndex) => {
      const optionHandle = deliveryOption.handle || '';
      const optionTitle = deliveryOption.title || '';
      const optionCode = deliveryOption.code || '';
      const optionDescription = deliveryOption.description || '';
      
      // Convert to lowercase for comparison
      const handleLower = optionHandle.toLowerCase();
      const titleLower = optionTitle.toLowerCase();
      const codeLower = optionCode.toLowerCase();
      const descLower = optionDescription.toLowerCase();

      // Enhanced logging for debugging
      console.error('📦 Analyzing delivery option:');
      console.error('  handle:', optionHandle);
      console.error('  title:', optionTitle);
      console.error('  code:', optionCode);
      console.error('  description:', optionDescription);

      // Determine if this is a pickup or shipping option based on common indicators
      const isPickupOption = (
        handleLower.includes('pickup') ||
        handleLower.includes('pick-up') ||
        handleLower.includes('pick_up') ||
        titleLower.includes('pickup') ||
        titleLower.includes('pick up') ||
        titleLower.includes('pick-up') ||
        titleLower.includes('store') ||
        titleLower.includes('local') ||
        codeLower.includes('pickup') ||
        codeLower.includes('pick') ||
        descLower.includes('pickup') ||
        descLower.includes('pick up')
      );

      const isShippingOption = (
        handleLower.includes('ship') ||
        handleLower.includes('shipping') ||
        titleLower.includes('ship') ||
        titleLower.includes('deliver') ||
        titleLower.includes('standard') ||
        titleLower.includes('express') ||
        titleLower.includes('economy') ||
        titleLower.includes('priority') ||
        codeLower.includes('ship') ||
        codeLower.includes('shipping') ||
        descLower.includes('ship') ||
        descLower.includes('deliver') ||
        // Also check for specific IDs
        optionHandle === 'SHIPPING' ||
        optionCode === 'SHIPPING' ||
        !isPickupOption // Default to shipping if not explicitly pickup
      );
      
      console.error('  isPickupOption:', isPickupOption);
      console.error('  isShippingOption:', isShippingOption);

      // Hide/show options based on fulfillment type selection
      let shouldHide = false;

      if (fulfillmentType === 'pickup') {
        // User selected pickup - hide all shipping options
        shouldHide = isShippingOption;
      } else if (fulfillmentType === 'delivery' || fulfillmentType === 'shipping') {
        // User selected delivery/shipping - hide all pickup options
        shouldHide = isPickupOption;
      }

      if (shouldHide) {
        operations.push({
          deliveryOptionHide: {
            deliveryOptionHandle: optionHandle
          }
        });

        console.error('🚫 HIDING delivery option:');
        console.error('  handle:', optionHandle);
        console.error('  title:', optionTitle);
        console.error('  code:', optionCode);
        console.error('  reason: User selected "' + fulfillmentType + '", this is a ' + (isShippingOption ? 'SHIPPING' : 'PICKUP') + ' option');
      } else {
        console.error('✅ KEEPING delivery option:');
        console.error('  handle:', optionHandle);
        console.error('  title:', optionTitle);  
        console.error('  code:', optionCode);
        console.error('  reason: User selected "' + fulfillmentType + '", this is a ' + (isShippingOption ? 'SHIPPING' : 'PICKUP') + ' option');
      }
    });
  });

  // If we made any changes, return them
  if (operations.length > 0) {
    console.error('🎯 DELIVERY CUSTOMIZATION: Applied ' + operations.length + ' operations');
    return { operations };
  }

  console.error('🔄 DELIVERY CUSTOMIZATION: No changes needed');
  return NO_CHANGES;
};