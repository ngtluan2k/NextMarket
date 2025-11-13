/**
 * Affiliate tracking utilities for capturing and managing affiliate codes
 * Uses cookies for 30-day attribution window
 */

import Cookies from 'js-cookie';

export interface AffiliateTrackingData {
  affiliateCode?: string;
  productId?: number;
  variantId?: number;
  programId?: number;
  timestamp: number;
  clickId?: string; // Unique click ID
  source?: string; // utm_source
}

const AFFILIATE_STORAGE_KEY = 'affiliate_tracking';
const ATTRIBUTION_WINDOW_DAYS = 30; // 30 days attribution window

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

  // Get utm_source if available
  const utmSource = urlParams.get('utm_source');
  
  const trackingData: AffiliateTrackingData = {
    affiliateCode,
    productId: productId && !isNaN(productId) ? productId : undefined,
    variantId: variantId ? parseInt(variantId, 10) : undefined,
    programId: programId ? parseInt(programId, 10) : undefined,
    timestamp: Date.now(),
    source: utmSource || undefined,
  };

  // Store in sessionStorage for checkout process
  storeAffiliateData(trackingData);
  
  console.log('🔗 Affiliate code captured:', trackingData);
  return trackingData;
}

/**
 * Generate unique click ID
 */
function generateClickId(): string {
  return `click_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Track click to backend
 */
async function trackAffiliateClick(data: AffiliateTrackingData): Promise<void> {
  try {
    await fetch('/api/affiliate-links/track-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    console.log('📊 Click tracked to backend:', data.clickId);
  } catch (error) {
    console.warn('Failed to track click to backend:', error);
  }
}

/**
 * Store affiliate data in cookies (30 days)
 */
export function storeAffiliateData(data: AffiliateTrackingData): void {
  if (typeof window === 'undefined') return;
  
  try {
    const trackingData = {
      ...data,
      clickId: data.clickId || generateClickId(),
      timestamp: Date.now(),
    };
    
    // Set cookie with 30 days expiry
    Cookies.set(AFFILIATE_STORAGE_KEY, JSON.stringify(trackingData), {
      expires: ATTRIBUTION_WINDOW_DAYS,
      sameSite: 'lax',
      secure: window.location.protocol === 'https:',
    });
    
    // Track click to backend
    trackAffiliateClick(trackingData);
    
    console.log('🍪 Affiliate data stored in cookie (30 days):', trackingData);
  } catch (error) {
    console.warn('Failed to store affiliate data:', error);
  }
}

/**
 * Retrieve stored affiliate data from cookies
 */
export function getStoredAffiliateData(): AffiliateTrackingData | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = Cookies.get(AFFILIATE_STORAGE_KEY);
    if (!stored) return null;

    const data: AffiliateTrackingData = JSON.parse(stored);
    
    // Check if data has expired (30 days)
    const now = Date.now();
    const daysSinceClick = (now - data.timestamp) / (1000 * 60 * 60 * 24);
    
    if (daysSinceClick > ATTRIBUTION_WINDOW_DAYS) {
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
 * Clear stored affiliate data from cookies
 */
export function clearAffiliateData(): void {
  if (typeof window === 'undefined') return;
  
  try {
    Cookies.remove(AFFILIATE_STORAGE_KEY);
    console.log('🗑️ Affiliate cookie cleared');
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
