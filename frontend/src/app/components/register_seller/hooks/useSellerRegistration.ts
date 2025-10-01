import { useState, useEffect } from 'react';
import { SellerFormData, defaultSellerFormData } from '../../types';

export const useSellerRegistration = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<SellerFormData>(defaultSellerFormData);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'info' | 'error' | 'warning'>('info');
  const [storeId, setStoreId] = useState<number | null>(null);
  const [storeInformationId, setStoreInformationId] = useState<number | null>(null);

  // Keys cho localStorage
  const FORM_DATA_KEY = 'seller_registration_form_data';
  const CURRENT_STEP_KEY = 'seller_registration_current_step';

  const steps = [
    { id: 1, title: 'Thông tin Shop', description: '' },
    { id: 2, title: 'Thông tin thuế', description: '' },
    { id: 3, title: 'Thông tin định danh', description: '' },
    { id: 4, title: 'Hoàn tất', description: '' },
  ];

  // Auto-save form data mỗi khi có thay đổi
  useEffect(() => {
    try {
      localStorage.setItem(FORM_DATA_KEY, JSON.stringify(formData));
    } catch (error) {
      console.error('Error saving form data:', error);
    }
  }, [formData]);

  // Auto-save current step
  useEffect(() => {
    try {
      localStorage.setItem(CURRENT_STEP_KEY, currentStep.toString());
    } catch (error) {
      console.error('Error saving current step:', error);
    }
  }, [currentStep]);

  // Update nested object
  const handleInputChange = (
    section: keyof SellerFormData,
    field: string,
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...(prev[section] as object),
        [field]: value,
      },
    }));
  };

  // Update root fields
  const handleBasicChange = (field: keyof SellerFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const nextStep = () => {
    setMessage('');
    currentStep < steps.length && setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    setMessage('');
    currentStep > 1 && setCurrentStep(currentStep - 1);
  };

  const clearSavedData = () => {
    localStorage.removeItem(FORM_DATA_KEY);
    localStorage.removeItem(CURRENT_STEP_KEY);
  };

  return {
    currentStep,
    setCurrentStep,
    formData,
    setFormData,
    loading,
    setLoading,
    message,
    setMessage,
    messageType,
    setMessageType,
    storeId,
    setStoreId,
    storeInformationId,
    setStoreInformationId,
    steps,
    handleInputChange,
    handleBasicChange,
    nextStep,
    prevStep,
    clearSavedData,
  };
};
