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
  console.error('  fulfillmentType:', fulfillmentType);
  console.error('  pickupLocationId:', pickupLocationId);

  // If no fulfillment type is specified, don't modify anything
  if (!fulfillmentType) {
    console.error('⚠️ No fulfillment type found - returning NO_CHANGES');
    return NO_CHANGES;
  }

  const operations = [];

  // Process each delivery group
  cart.deliveryGroups?.forEach((deliveryGroup, groupIndex) => {
    deliveryGroup.deliveryOptions?.forEach((deliveryOption, optionIndex) => {
      const optionHandle = deliveryOption.handle;
      const optionTitle = deliveryOption.title?.toLowerCase() || '';
      const optionCode = deliveryOption.code?.toLowerCase() || '';

      // Determine if this is a pickup or shipping option based on common indicators
      const isPickupOption = (
        optionHandle?.includes('pickup') ||
        optionTitle.includes('pickup') ||
        optionTitle.includes('pick up') ||
        optionTitle.includes('store') ||
        optionCode.includes('pickup')
      );

      const isShippingOption = (
        optionHandle?.includes('ship') ||
        optionTitle.includes('ship') ||
        optionTitle.includes('deliver') ||
        optionTitle.includes('standard') ||
        optionTitle.includes('express') ||
        optionCode.includes('ship') ||
        !isPickupOption // Default to shipping if not explicitly pickup
      );

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
          hide: {
            deliveryOptionHandle: optionHandle
          }
        });

        console.error('🚫 Hiding delivery option');
      } else {
        console.error('✅ Keeping delivery option');
      }
    });
  });

  // If we made any changes, return them
  if (operations.length > 0) {
    console.error('🎯 DELIVERY CUSTOMIZATION: Applied operations');
    return { operations };
  }

  console.error('🔄 DELIVERY CUSTOMIZATION: No changes needed');
  return NO_CHANGES;
};