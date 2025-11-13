import { useEffect, useState } from 'react';
import { 
  initializeAffiliateTracking, 
  getStoredAffiliateData, 
  getAffiliateDataForOrder,
  AffiliateTrackingData 
} from '../utils/affiliate-tracking';

/**
 * Hook for managing affiliate tracking in React components
 */
export function useAffiliateTracking() {
  const [affiliateData, setAffiliateData] = useState<AffiliateTrackingData | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    // Initialize affiliate tracking
    initializeAffiliateTracking();
    
    // Get initial affiliate data
    const data = getStoredAffiliateData();
    setAffiliateData(data);
    setIsTracking(!!data?.affiliateCode);

    // Set up periodic check for affiliate data changes
    const interval = setInterval(() => {
      const currentData = getStoredAffiliateData();
      setAffiliateData(currentData);
      setIsTracking(!!currentData?.affiliateCode);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  /**
   * Get affiliate data formatted for order creation
   */
  const getOrderAffiliateData = () => {
    return getAffiliateDataForOrder();
  };

  /**
   * Check if currently tracking an affiliate
   */
  const hasActiveAffiliate = () => {
    return isTracking && !!affiliateData?.affiliateCode;
  };

  /**
   * Get the current affiliate code
   */
  const getAffiliateCode = () => {
    return affiliateData?.affiliateCode;
  };

  /**
   * Get the tracked product ID
   */
  const getTrackedProductId = () => {
    return affiliateData?.productId;
  };

  /**
   * Get the tracked variant ID
   */
  const getTrackedVariantId = () => {
    return affiliateData?.variantId;
  };

  return {
    affiliateData,
    isTracking,
    hasActiveAffiliate,
    getOrderAffiliateData,
    getAffiliateCode,
    getTrackedProductId,
    getTrackedVariantId,
  };
}
