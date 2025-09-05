class CartFulfillment {
  constructor() {
    this.container = document.querySelector('[data-cart-fulfillment]');
    this.loadingElement = this.container?.querySelector('.cart-fulfillment__loading');
    this.errorElement = this.container?.querySelector('.cart-fulfillment__error');
    this.pickupLocationsContainer = this.container?.querySelector('.cart-fulfillment__pickup-locations');
    this.locationSelect = this.container?.querySelector('[data-pickup-location-select]');
    this.radioButtons = this.container?.querySelectorAll('input[name="fulfillment-type"]');
    
    this.init();
  }

  init() {
    if (!this.container) return;
    
    // Load pickup locations on initialization
    this.loadPickupLocations();
    
    // Bind event listeners
    this.bindEvents();
    
    // Set initial state
    this.updatePickupLocationVisibility();
  }

  bindEvents() {
    // Radio button change event
    this.radioButtons.forEach(radio => {
      radio.addEventListener('change', this.handleFulfillmentTypeChange.bind(this));
    });

    // Location select change event
    if (this.locationSelect) {
      this.locationSelect.addEventListener('change', this.handleLocationChange.bind(this));
    }
  }

  async loadPickupLocations() {
    try {
      // In a real implementation, you would fetch this from Shopify's API
      // For POC, we'll use mock data
      const mockLocations = [
        {
          id: 'gid://shopify/Location/123456789',
          name: 'Downtown Store',
          address: '123 Main St, City, State 12345'
        },
        {
          id: 'gid://shopify/Location/987654321', 
          name: 'Mall Location',
          address: '456 Shopping Center Dr, City, State 12345'
        },
        {
          id: 'gid://shopify/Location/456789123',
          name: 'Westside Branch',
          address: '789 West Ave, City, State 12345'
        }
      ];

      this.populateLocationSelect(mockLocations);
    } catch (error) {
      console.error('Failed to load pickup locations:', error);
      this.showError('Unable to load store locations. Please try again.');
    }
  }

  populateLocationSelect(locations) {
    if (!this.locationSelect) return;

    // Clear existing options (keep the default "Choose a location..." option)
    const defaultOption = this.locationSelect.querySelector('option[value=""]');
    this.locationSelect.innerHTML = '';
    if (defaultOption) {
      this.locationSelect.appendChild(defaultOption);
    }

    // Add location options
    locations.forEach(location => {
      const option = document.createElement('option');
      option.value = location.id;
      option.textContent = `${location.name} - ${location.address}`;
      option.dataset.locationName = location.name;
      this.locationSelect.appendChild(option);
    });

    // Set current selection if it exists in cart attributes
    const currentLocationId = this.getCurrentCartAttribute('pickup_location_id');
    if (currentLocationId) {
      this.locationSelect.value = currentLocationId;
    }
  }

  async handleFulfillmentTypeChange(event) {
    const fulfillmentType = event.target.value;
    
    // Update UI immediately
    this.updatePickupLocationVisibility();
    
    // Prepare cart attributes
    const attributes = {
      'attributes[fulfillment_type]': fulfillmentType
    };

    // Clear pickup-specific attributes if switching to delivery
    if (fulfillmentType === 'delivery') {
      attributes['attributes[pickup_location_id]'] = '';
      attributes['attributes[pickup_location_name]'] = '';
    }

    await this.updateCartAttributes(attributes);
  }

  async handleLocationChange(event) {
    const locationId = event.target.value;
    const selectedOption = event.target.selectedOptions[0];
    const locationName = selectedOption?.dataset.locationName || '';

    const attributes = {
      'attributes[pickup_location_id]': locationId,
      'attributes[pickup_location_name]': locationName
    };

    await this.updateCartAttributes(attributes);
  }

  updatePickupLocationVisibility() {
    const pickupSelected = document.querySelector('#fulfillment-pickup')?.checked;
    
    if (this.pickupLocationsContainer) {
      this.pickupLocationsContainer.style.display = pickupSelected ? 'block' : 'none';
    }
  }

  async updateCartAttributes(attributes) {
    this.showLoading(true);
    this.hideError();

    try {
      // First, update the cart attributes (existing functionality)
      const response = await fetch('/cart/update.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: new URLSearchParams(attributes)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const cart = await response.json();
      console.log('Cart updated successfully:', cart);

      // NEW: Create a new cart with preferences for checkout pre-selection
      await this.createCartWithPreferences(cart);
      
      // Dispatch custom event for other scripts that might need to know
      document.dispatchEvent(new CustomEvent('cart:fulfillment-updated', {
        detail: { attributes, cart }
      }));

    } catch (error) {
      console.error('Failed to update cart attributes:', error);
      this.showError('Unable to save your selection. Please try again.');
    } finally {
      this.showLoading(false);
    }
  }

  async createCartWithPreferences(cart) {
    // Extract fulfillment preferences from cart attributes
    const fulfillmentType = cart.attributes?.fulfillment_type;
    const pickupLocationId = cart.attributes?.pickup_location_id;

    if (!fulfillmentType) return; // No preferences to set

    try {
      // Prepare cart lines from current cart
      const lines = cart.items.map(item => ({
        merchandiseId: `gid://shopify/ProductVariant/${item.variant_id}`,
        quantity: item.quantity
      }));

      // Call your app's public cart creation API
      const shop = window.Shopify?.shop || window.location.hostname;
      
      // Try to get the app URL dynamically from the page
      let appUrl = null;
      
      // Look for script tags that might contain app references
      const scriptTags = document.querySelectorAll('script[src*="trycloudflare.com"], script[src*="shopify-app"]');
      if (scriptTags.length > 0) {
        const srcUrl = scriptTags[0].src;
        const urlMatch = srcUrl.match(/(https:\/\/[^\/]+)/);
        if (urlMatch) appUrl = urlMatch[1];
      }
      
      // Fallback: try common app URL patterns or use a configured value
      if (!appUrl) {
        // You can set this as a global variable in your theme
        appUrl = window.SHOPIFY_APP_URL || 'https://reporter-synthetic-significant-revision.trycloudflare.com';
      }
      
      console.log('Using app URL:', appUrl);
      const response = await fetch(`${appUrl}/api/public/cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({
          lines,
          deliveryMethod: fulfillmentType === 'pickup' ? 'pickup' : 'shipping',
          pickupLocationId: fulfillmentType === 'pickup' ? pickupLocationId : undefined,
          shop
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.cart?.checkoutUrl) {
          // Store the new checkout URL for later use
          window.preselectedCheckoutUrl = result.cart.checkoutUrl;
          console.log('✅ Cart with preferences created:', result.cart.checkoutUrl);
        }
      }
    } catch (error) {
      console.warn('Could not create cart with preferences:', error);
      // Don't fail the main flow - cart attributes are still updated
    }
  }

  getCurrentCartAttribute(key) {
    // This would normally come from the Liquid template
    // For now, we'll try to read from a data attribute or global variable
    if (window.cartAttributes && window.cartAttributes[key]) {
      return window.cartAttributes[key];
    }
    
    // Fallback: try to read from a script tag with cart data
    const cartDataScript = document.querySelector('#cart-data');
    if (cartDataScript) {
      try {
        const cartData = JSON.parse(cartDataScript.textContent);
        return cartData.attributes?.[key];
      } catch (e) {
        console.warn('Could not parse cart data:', e);
      }
    }
    
    return null;
  }

  showLoading(show) {
    if (this.loadingElement) {
      this.loadingElement.style.display = show ? 'flex' : 'none';
    }
  }

  hideError() {
    if (this.errorElement) {
      this.errorElement.style.display = 'none';
      this.errorElement.textContent = '';
    }
  }

  showError(message) {
    if (this.errorElement) {
      this.errorElement.textContent = message;
      this.errorElement.style.display = 'block';
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new CartFulfillment();
    interceptCheckoutButtons();
  });
} else {
  new CartFulfillment();
  interceptCheckoutButtons();
}

// Intercept checkout button clicks to use pre-selected checkout URL if available
function interceptCheckoutButtons() {
  const checkoutButtons = document.querySelectorAll('[name="add"], .btn[href*="checkout"], .checkout-button, [data-cart-url*="checkout"]');
  
  checkoutButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      if (window.preselectedCheckoutUrl) {
        e.preventDefault();
        window.location.href = window.preselectedCheckoutUrl;
      }
    });
  });
  
  // Also listen for custom cart events that might trigger checkout
  document.addEventListener('cart:fulfillment-updated', function(e) {
    console.log('🔄 Cart fulfillment updated, checkout URL ready:', window.preselectedCheckoutUrl);
  });
}

// Export for potential use by other scripts
window.CartFulfillment = CartFulfillment;