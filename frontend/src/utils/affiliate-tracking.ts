/**
 * Affiliate tracking utilities for capturing and managing affiliate codes
 */

export interface AffiliateTrackingData {
  affiliateCode?: string;
  productId?: number;
  variantId?: number;
  programId?: number;
  timestamp: number;
}

const AFFILIATE_STORAGE_KEY = 'affiliate_tracking';
const AFFILIATE_EXPIRY_HOURS = 24; // 24 hours

/**
 * Capture affiliate code from URL parameters
 */
export function captureAffiliateFromUrl(): AffiliateTrackingData | null {
  if (typeof window === 'undefined') return null;

  const urlParams = new URLSearchParams(window.location.search);
  const affiliateCode = urlParams.get('aff');
  const variantId = urlParams.get('variant');
  const programId = urlParams.get('program');
  
  if (!affiliateCode) return null;

  // Extract product ID from URL path (assuming /product/:id format)
  const pathParts = window.location.pathname.split('/');
  const productIndex = pathParts.indexOf('product');
  const productId = productIndex >= 0 && productIndex + 1 < pathParts.length 
    ? parseInt(pathParts[productIndex + 1], 10) 
    : undefined;

  const trackingData: AffiliateTrackingData = {
    affiliateCode,
    productId: productId && !isNaN(productId) ? productId : undefined,
    variantId: variantId ? parseInt(variantId, 10) : undefined,
    programId: programId ? parseInt(programId, 10) : undefined,
    timestamp: Date.now(),
  };

  // Store in sessionStorage for checkout process
  storeAffiliateData(trackingData);
  
  console.log('🔗 Affiliate code captured:', trackingData);
  return trackingData;
}

/**
 * Store affiliate data in session storage
 */
export function storeAffiliateData(data: AffiliateTrackingData): void {
  if (typeof window === 'undefined') return;
  
  try {
    sessionStorage.setItem(AFFILIATE_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to store affiliate data:', error);
  }
}

/**
 * Retrieve stored affiliate data
 */
export function getStoredAffiliateData(): AffiliateTrackingData | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = sessionStorage.getItem(AFFILIATE_STORAGE_KEY);
    if (!stored) return null;

    const data: AffiliateTrackingData = JSON.parse(stored);
    
    // Check if data has expired
    const now = Date.now();
    const expiryTime = data.timestamp + (AFFILIATE_EXPIRY_HOURS * 60 * 60 * 1000);
    
    if (now > expiryTime) {
      clearAffiliateData();
      return null;
    }

    return data;
  } catch (error) {
    console.warn('Failed to retrieve affiliate data:', error);
    return null;
  }
}

/**
 * Clear stored affiliate data
 */
export function clearAffiliateData(): void {
  if (typeof window === 'undefined') return;
  
  try {
    sessionStorage.removeItem(AFFILIATE_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear affiliate data:', error);
  }
}

/**
 * Get affiliate data for order creation
 */
export function getAffiliateDataForOrder(): {
  affiliateCode?: string;
  affiliateUserId?: number;
  affiliateProgramId?: number;
} {
  const data = getStoredAffiliateData();
  if (!data || !data.affiliateCode) return {};

  return {
    affiliateCode: data.affiliateCode,
    affiliateProgramId: data.programId,
    // Note: userId will be resolved by backend from affiliateCode
  };
}

/**
 * Initialize affiliate tracking on page load
 */
export function initializeAffiliateTracking(): void {
  if (typeof window === 'undefined') return;

  // Capture affiliate code from current URL
  captureAffiliateFromUrl();

  // Set up event listener for navigation changes (for SPAs)
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function(...args) {
    originalPushState.apply(history, args);
    setTimeout(captureAffiliateFromUrl, 0);
  };

  history.replaceState = function(...args) {
    originalReplaceState.apply(history, args);
    setTimeout(captureAffiliateFromUrl, 0);
  };

  // Listen for popstate events (back/forward navigation)
  window.addEventListener('popstate', () => {
    setTimeout(captureAffiliateFromUrl, 0);
  });
}

/**
 * Validate affiliate code format
 */
export function isValidAffiliateCode(code: string): boolean {
  // Basic validation - adjust based on your affiliate code format
  return /^[A-Za-z0-9_-]+$/.test(code) && code.length >= 3 && code.length <= 50;
}

/**
 * Generate affiliate link for a product
 */
export function generateAffiliateLink(
  productId: number, 
  affiliateCode: string, 
  variantId?: number,
  programId?: number,
  baseUrl: string = 'https://everymart.com'
): string {
  const url = new URL(`${baseUrl}/product/${productId}`);
  url.searchParams.set('aff', affiliateCode);
  
  if (variantId) {
    url.searchParams.set('variant', variantId.toString());
  }
  
  if (programId) {
    url.searchParams.set('program', programId.toString());
  }
  
  return url.toString();
}
