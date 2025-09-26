export interface SellerFormData {
  // Store basic info
  name: string;
  slug?: string;
  description?: string;
  email?: string;
  phone?: string;

  // Store Information
  store_information: {
    type: string; // 'individual' | 'company'
    name: string;
    addresses?: string;
    tax_code?: string;
  };

  // Store Identification
  store_identification: {
    type: string; // 'CMND' | 'CCCD' | 'Passport' | 'GPKD'
    full_name: string;
    img_front?: string;
    img_back?: string;
  };

  // Bank Account
  bank_account: {
    bank_name: string;
    account_number: string;
    account_holder: string;
    is_default?: boolean;
  };

  // Store Address
  store_address: {
    recipient_name: string;
    phone: string;
    street: string;
    city: string;
    province: string;
    country: string;
    postal_code: string;
    type: string;
    detail?: string;
    is_default?: boolean;
   
  };

  // Store Email (optional)
  store_information_email: {
    email: string;
  };

  // Documents (optional)
  documents?: {
    doc_type: string;
    file_url: string;
  }[];
}

// Default initial data
export const defaultSellerFormData: SellerFormData = {
  name: '',
  description: '',
  email: '',
  phone: '',
  store_information: {
    type: 'individual',
    name: '',
    addresses: '',
    tax_code: '',
  },
  store_identification: {
    type: 'CCCD',
    full_name: '',
    img_front: '',
    img_back: '',
  },
  bank_account: {
    bank_name: '',
    account_number: '',
    account_holder: '',
    is_default: true,
  },
  store_address: {
    recipient_name: '',
    phone: '',
    street: '',
    city: '',
    province: '',
    country: 'Vietnam',
    postal_code: '',
    type: 'pickup',
    detail: '',
    is_default: true,
    
  },
  store_information_email: {
    email: '',
  },
  documents: [],
};


