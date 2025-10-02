import { useState, useEffect, useMemo } from 'react';
import { SellerFormData } from '../../types';

export const useUnsavedChanges = (
  formData: SellerFormData,
  currentStep: number,
  addresses: any[],
  emails: any[]
) => {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedData, setLastSavedData] = useState<string>('');

  // Detect changes
  const hasChanges = useMemo(() => {
    const currentData = JSON.stringify({
      formData,
      currentStep,
      addresses,
      emails
    });
    return currentData !== lastSavedData;
  }, [formData, currentStep, addresses, emails, lastSavedData]);

  // Update hasUnsavedChanges when changes detected
  useEffect(() => {
    setHasUnsavedChanges(hasChanges);
  }, [hasChanges]);

  // Mark as saved
  const markAsSaved = () => {
    const currentData = JSON.stringify({
      formData,
      currentStep,
      addresses,
      emails
    });
    setLastSavedData(currentData);
    setHasUnsavedChanges(false);
  };

  return { 
    hasUnsavedChanges, 
    markAsSaved 
  };
};