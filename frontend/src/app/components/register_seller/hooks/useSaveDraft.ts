import { useState } from 'react';
import { SellerFormData } from '../../types';

export const useSaveDraft = () => {
  const [loading, setLoading] = useState(false);

  const saveDraft = async (
    currentStep: number,
    formData: SellerFormData,
    addresses: any[],
    emails: any[],
    storeId: number | null,
    onSuccess: (message: string) => void,
    onError: (message: string) => void
  ) => {
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const defaultAddress = addresses.find(a => a.is_default);
      const defaultEmail = emails.find(e => e.is_default);
      
      // Build step data based on current step
      let stepData: any = {
        name: formData.name,
        description: formData.description,
        email: formData.email,
        phone: formData.phone,
        is_draft: true,
      };

      // Add store_id if exists
      if (storeId) {
        stepData.store_id = storeId;
      }

      // Add data based on current step
      if (currentStep >= 1 && defaultAddress) {
        stepData.store_address = {
          recipient_name: defaultAddress.recipient_name,
          phone: defaultAddress.phone,
          street: defaultAddress.street,
          // Backend yêu cầu "district" thay vì "city" và là string không rỗng
          district:
            (defaultAddress as any).district && String((defaultAddress as any).district).trim()
              ? (defaultAddress as any).district
              : null,
          ward: (defaultAddress as any).ward || '',
          province: defaultAddress.province,
          country: defaultAddress.country,
          postal_code: defaultAddress.postal_code,
          type: defaultAddress.type,
          detail: defaultAddress.detail,
          is_default: true,
        };
      }

      if (currentStep >= 2) {
        stepData.store_information = {
          type: formData.store_information.type,
          name: formData.store_information.name,
          addresses: formData.store_information.addresses,
          tax_code: formData.store_information.tax_code,
        };

        if (defaultEmail) {
          stepData.store_information_email = {
            email: defaultEmail.email,
          };
        }

        // Add documents if available
        const sanitizedDocs = (formData.documents || [])
          .filter(d => d?.file_url && d?.doc_type)
          .map(d => ({ doc_type: d.doc_type, file_url: d.file_url }));
        
        if (sanitizedDocs.length > 0) {
          stepData.documents = sanitizedDocs;
        }
      }

      if (currentStep >= 3) {
        // Add identification if available
        const hasIdentificationData = 
          !!formData.store_identification.full_name ||
          !!formData.store_identification.img_front ||
          !!formData.store_identification.img_back;
        
        if (hasIdentificationData) {
          stepData.store_identification = {
            type: formData.store_identification.type,
            full_name: formData.store_identification.full_name,
            img_front: formData.store_identification.img_front,
            img_back: formData.store_identification.img_back,
          };
        }

        // Add bank account if available
        const hasBankData = 
          formData.bank_account.bank_name ||
          formData.bank_account.account_number ||
          formData.bank_account.account_holder;
        
        if (hasBankData) {
          stepData.bank_account = formData.bank_account;
        }
      }

      const res = await fetch('http://localhost:3000/stores/register-seller', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(stepData),
      });

      const data = await res.json();
      if (res.ok) {
        onSuccess(`✅ Đã lưu Step ${currentStep} thành công!`);
        
        if (data?.data?.id) {
          // Save current step to localStorage
          localStorage.setItem('seller_registration_current_step', currentStep.toString());
          // Save form data to localStorage
          localStorage.setItem('seller_registration_form_data', JSON.stringify(formData));
          // Save addresses to localStorage
          localStorage.setItem('seller_registration_addresses', JSON.stringify(addresses));
          
          return data.data.id;
        }
      } else {
        onError(`❌ Lỗi lưu Step ${currentStep}: ${data.message || 'Thất bại'}`);
      }
    } catch (error: any) {
      onError(`❌ Lỗi kết nối: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    saveDraft,
  };
};
