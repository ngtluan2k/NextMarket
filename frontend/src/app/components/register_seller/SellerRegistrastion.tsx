import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SellerFormData, defaultSellerFormData } from '../types';

export const SellerRegistration: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState<SellerFormData>(
    defaultSellerFormData
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showSelectAddressModal, setShowSelectAddressModal] = useState(false);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [editingAddress, setEditingAddress] = useState<any>(null);

  // Keys cho localStorage
  const FORM_DATA_KEY = 'seller_registration_form_data';
  const CURRENT_STEP_KEY = 'seller_registration_current_step';
  const ADDRESSES_KEY = 'seller_registration_addresses';

  const steps = [
    { id: 1, title: 'Thông tin Shop', description: '' },
    { id: 2, title: 'Thông tin thuế', description: '' },
    { id: 3, title: 'Thông tin định danh', description: '' },
    { id: 4, title: 'Hoàn tất', description: '' },
  ];

  // Load data từ localStorage và server khi component mount
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        // 1. Load từ localStorage trước (dữ liệu user đang nhập)
        const savedFormData = localStorage.getItem(FORM_DATA_KEY);
        const savedStep = localStorage.getItem(CURRENT_STEP_KEY);
        const savedAddresses = localStorage.getItem(ADDRESSES_KEY);

        if (savedFormData) {
          const parsedData = JSON.parse(savedFormData);
          setFormData({ ...defaultSellerFormData, ...parsedData });
          setMessage('📝 Đã tải thông tin đã lưu từ phiên trước');
        }

        if (savedStep) {
          setCurrentStep(parseInt(savedStep));
        }

        if (savedAddresses) {
          setAddresses(JSON.parse(savedAddresses));
        }

        // 2. Kiểm tra xem có store draft trên server không
        const token = localStorage.getItem('token');
        if (token) {
          const res = await fetch('http://localhost:3000/stores/my-store', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (res.ok) {
            const data = await res.json();
            const store = data.data;

            // Nếu có store và là draft, load đầy đủ thông tin từ server
            if (store && store.is_draft) {
              setMessage(
                '📝 Đã tải thông tin bản nháp từ server. Hãy tiếp tục hoàn tất!'
              );
              // Fetch đầy đủ draft data từ backend
              await loadFullDraftData(store.id, savedFormData);
            }
          }
        }
      } catch (error) {
        console.error('Error loading saved data:', error);
        // Nếu có lỗi, clear localStorage để tránh conflict
        clearSavedData();
      }
    };

    loadSavedData();
  }, []);

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

  // Auto-save addresses
  useEffect(() => {
    try {
      localStorage.setItem(ADDRESSES_KEY, JSON.stringify(addresses));
    } catch (error) {
      console.error('Error saving addresses:', error);
    }
  }, [addresses]);

  // Load đầy đủ draft data từ server

  const loadFullDraftData = async (
    storeId: number,
    savedFormData: string | null
  ) => {
    try {
      const token = localStorage.getItem('token');
      // Prevent multiple concurrent calls
      if (loading) {
        console.log('🔄 Already loading draft data, skipping...');
        return;
      }
      setLoading(true);
      // Fetch draft data từ endpoint mới
      console.log(`🔍 Fetching draft data for store ${storeId}...`);
      const response = await fetch(`http://localhost:3000/stores/${storeId}/draft-data`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }); 

      console.log('📡 Response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        const draftData = result.data; // Extract data từ response
        console.log('📊 Full response:', result);
        console.log('📊 Draft data từ server:', draftData);
        // Map draft data về SellerFormData format
        const mappedFormData: SellerFormData = {
          // Basic store info - fix "undefined" name issue
          name:
            draftData.store?.name && draftData.store.name !== 'undefined'
              ? draftData.store.name
              : '',
          description: draftData.store?.description || '',
          email: draftData.store?.email || '',
          phone: draftData.store?.phone || '',

          // Store Information
          store_information: {
            type: draftData.storeInformation?.type || 'individual',
            name: draftData.storeInformation?.name || '',
            addresses: draftData.storeInformation?.addresses || '',
            tax_code: draftData.storeInformation?.tax_code || '',
          },

          // Store Identification
          store_identification: {
            type: draftData.storeIdentification?.type || 'CCCD',
            full_name: draftData.storeIdentification?.full_name || '',
            img_front: draftData.storeIdentification?.img_front || '',
            img_back: draftData.storeIdentification?.img_back || '',
          },

          // Bank Account
          bank_account: {
            bank_name: draftData.bankAccount?.bank_name || '',
            account_number: draftData.bankAccount?.account_number || '',
            account_holder: draftData.bankAccount?.account_holder || '',
            is_default: draftData.bankAccount?.is_default ?? true,
          },

          // Store Address
          store_address: {
            recipient_name: draftData.storeAddress?.recipient_name || '',
            phone: draftData.storeAddress?.phone || '',
            street: draftData.storeAddress?.street || '',
            city: draftData.storeAddress?.city || '',
            province: draftData.storeAddress?.province || '',
            country: draftData.storeAddress?.country || 'Vietnam',
            postal_code: draftData.storeAddress?.postal_code || '',
            type: draftData.storeAddress?.type || 'pickup',
            detail: draftData.storeAddress?.detail || '',
            is_default: draftData.storeAddress?.is_default ?? true,
          },

          // Store Email
          store_information_email: {
            email: draftData.storeEmail?.email || '',
          },

          // Documents
          documents: draftData.documents || [],
        };

        console.log('🔄 Mapped form data:', mappedFormData);

        // Set addresses nếu có
        if (draftData.storeAddress) {
          const addressData = {
            id: draftData.storeAddress.id || Date.now(),
            recipient_name: draftData.storeAddress.recipient_name || '',
            phone: draftData.storeAddress.phone || '',
            street: draftData.storeAddress.street || '',
            city: draftData.storeAddress.city || '',
            province: draftData.storeAddress.province || '',
            country: draftData.storeAddress.country || 'Vietnam',
            postal_code: draftData.storeAddress.postal_code || '',
            type: draftData.storeAddress.type || 'pickup',
            detail: draftData.storeAddress.detail || '',
            is_default: true,
          };
          setAddresses([addressData]);
        }

        // Merge với localStorage data nếu có (ưu tiên data có value)
        if (!savedFormData) {
          console.log('🔄 Setting form data từ server:', mappedFormData);
          setFormData(mappedFormData);
          console.log('✅ Form data đã được set từ server');
        } else {
          const localData = JSON.parse(savedFormData);

          // Smart merge: Chỉ dùng localStorage nếu có data thật sự
          const hasLocalData =
            localData.name || localData.phone || localData.email;

          if (hasLocalData) {
            const mergedData = {
              ...mappedFormData,
              ...localData,
            };
            console.log('🔄 Merging server + localStorage:', {
              mappedFormData,
              localData,
              mergedData,
            });
            setFormData(mergedData);
            console.log('✅ Form data đã được merged');
          } else {
            console.log(
              '🔄 localStorage trống, dùng server data:',
              mappedFormData
            );
            setFormData(mappedFormData);
            console.log(
              '✅ Form data đã được set từ server (localStorage empty)'
            );
          }
        }

        // Success message
        setMessage('📝 Đã tải đầy đủ thông tin bản nháp từ server!');

        // Determine current step based on data completeness
        let step = 1;
        if (mappedFormData.name && mappedFormData.phone) step = 2;
        if (mappedFormData.store_information.name) step = 3;

        if (mappedFormData.store_identification.full_name && mappedFormData.bank_account.bank_name) step = 4;
        
        if (!savedFormData) {
          setCurrentStep(step);
        }

        setMessage('📝 Đã tải đầy đủ thông tin bản nháp từ server!');
      } else {
        const errorData = await response.text();
        console.error('❌ API Error:', response.status, errorData);
        setMessage(`⚠️ Lỗi API: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Network/Parse error:', error);
      setMessage('⚠️ Không thể tải được bản nháp từ server');
    } finally {
      setLoading(false);
    }
  };

  // Clear saved data
  const clearSavedData = () => {
    localStorage.removeItem(FORM_DATA_KEY);
    localStorage.removeItem(CURRENT_STEP_KEY);
    localStorage.removeItem(ADDRESSES_KEY);
  };

  // Show confirmation before leaving if there's unsaved data
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const hasData =
        formData.name ||
        formData.phone ||
        formData.email ||
        formData.store_information.name ||
        addresses.length > 0;
      if (hasData) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [formData, addresses]);

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

  // Handle address modal
  const [addressFormData, setAddressFormData] = useState({
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
  });

  const handleAddressInputChange = (field: string, value: any) => {
    setAddressFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddAddress = () => {
    // Validate required fields
    if (
      !addressFormData.recipient_name ||
      !addressFormData.phone ||
      !addressFormData.street ||
      !addressFormData.city ||
      !addressFormData.province ||
      !addressFormData.postal_code
    ) {
      setMessage('❌ Vui lòng điền đầy đủ thông tin địa chỉ');
      return;
    }

    if (editingAddress) {
      // Update existing address
      setAddresses((prev) =>
        prev.map((addr) =>
          addr.id === editingAddress.id
            ? {
                ...addressFormData,
                id: editingAddress.id,
                is_default: editingAddress.is_default,
                // Removed is_draft reference
              }
            : addr
        )
      );

      // Update formData if editing default address
      if (editingAddress.is_default) {
        setFormData((prev) => ({
          ...prev,
          store_address: {
            ...addressFormData,
            is_default: true,
          },
        }));
      }

      setMessage('✅ Địa chỉ đã được cập nhật thành công');
    } else {
      // Add new address
      const isFirstAddress = addresses.length === 0;

      const newAddress = {
        ...addressFormData,
        id: Date.now(),
        is_default: isFirstAddress,
        // Removed is_draft reference
      };
      setAddresses((prev) => [...prev, newAddress]);

      // Update formData for backend submission (always use default address)
      if (isFirstAddress) {
        setFormData((prev) => ({
          ...prev,
          store_address: {
            ...addressFormData,
          },
        }));
      }

      setMessage('✅ Địa chỉ đã được thêm thành công');
    }

    // Reset form and close modal
    setAddressFormData({
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
    });
    setEditingAddress(null);
    setShowAddressModal(false);
  };

  const handleSetDefaultAddress = (addressId: number) => {
    // Update addresses array - set new default and unset others
    setAddresses((prev) =>
      prev.map((addr) => ({
        ...addr,
        is_default: addr.id === addressId,
      }))
    );

    // Update formData with new default address
    const newDefaultAddress = addresses.find((addr) => addr.id === addressId);
    if (newDefaultAddress) {
      setFormData((prev) => ({
        ...prev,
        store_address: newDefaultAddress,
      }));
    }
  };

  const handleEditAddress = (address: any) => {
    setEditingAddress(address);
    setAddressFormData({
      recipient_name: address.recipient_name,
      phone: address.phone,
      street: address.street,
      city: address.city,
      province: address.province,
      country: address.country,
      postal_code: address.postal_code,
      type: address.type,
      detail: address.detail || '',
      is_default: address.is_default,
      // Removed is_draft reference
    });
    setShowAddressModal(true);
  };

  const nextStep = () => {
    setMessage('');
    currentStep < steps.length && setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    setMessage('');
    currentStep > 1 && setCurrentStep(currentStep - 1);
  };

  // Lưu nháp từng step riêng biệt
  const handleSaveDraft = async () => {
    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');

      // Chỉ lấy data của step hiện tại
      let stepData: any = {};

      switch (currentStep) {
        case 1: {
          // Step 1: Thông tin shop cơ bản + địa chỉ
          stepData = {
            name: formData.name,
            description: formData.description,
            email: formData.email, // ✅ Thêm email
            phone: formData.phone,
            is_draft: true,
          };

          // Chỉ gửi store_address nếu user đã nhập thông tin (tương tự Step 3)
          const hasAddressData =
            formData.store_address.recipient_name ||
            formData.store_address.phone ||
            formData.store_address.street ||
            formData.store_address.city ||
            formData.store_address.province;

          if (hasAddressData) {
            stepData.store_address = formData.store_address;
          }
          break;
        }

        case 2: {
          // Step 2: Thông tin doanh nghiệp (bao gồm thông tin từ Step 1)
          stepData = {
            name: formData.name, // Required từ Step 1
            description: formData.description,
            email: formData.email, // ✅ Thêm email
            phone: formData.phone,
            store_information: formData.store_information,
            store_information_email: formData.store_information_email,

            is_draft: true
          };

          // Include address từ Step 1 nếu có
          const hasAddressDataStep2 =
            formData.store_address.recipient_name ||
            formData.store_address.phone ||
            formData.store_address.street ||
            formData.store_address.city ||
            formData.store_address.province;

          if (hasAddressDataStep2) {
            stepData.store_address = formData.store_address;
          }
          break;

        }

        case 3: {
          // Step 3: Thông tin định danh + ngân hàng + địa chỉ (bao gồm tất cả steps trước)
          stepData = {
            name: formData.name, // Required từ Step 1
            description: formData.description,
            email: formData.email, // ✅ Thêm email
            phone: formData.phone,
            store_information: formData.store_information, // Từ Step 2
            store_information_email: formData.store_information_email,
            documents: formData.documents,
            is_draft: true,
          };

          // Chỉ gửi store_identification nếu user đã nhập thông tin
          const hasIdentificationData =
            formData.store_identification.full_name ||
            formData.store_identification.img_front ||
            formData.store_identification.img_back;


          if (hasIdentificationData) {
            stepData.store_identification = formData.store_identification;
          }

          // Chỉ gửi bank_account nếu user đã nhập thông tin
          const hasBankData =
            formData.bank_account.bank_name ||
            formData.bank_account.account_number ||
            formData.bank_account.account_holder;
          if (hasBankData) {
            stepData.bank_account = formData.bank_account;
          }

          break;
        }

        case 4: {
          // Step 4: Submit toàn bộ (không phải draft)
          return handleFinalSubmit();
        }
      }

      const res = await fetch('http://localhost:3000/stores/register-seller', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(stepData),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(`✅ Đã lưu Step ${currentStep} thành công!`);
      } else {
        setMessage(
          `❌ Lỗi lưu Step ${currentStep}: ${data.message || 'Thất bại'}`
        );
      }
    } catch (error) {
      setMessage('❌ Lỗi kết nối');
    } finally {
      setLoading(false);
    }
  };

  // Submit hoàn tất toàn bộ form
  const handleFinalSubmit = async () => {
    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      // Gửi toàn bộ form data
      const submitData = {
        ...formData,
        is_draft: false, // Hoàn tất, không phải draft
      };

      const res = await fetch('http://localhost:3000/stores/register-seller', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(submitData),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage('✅ Đăng ký thành công! Cửa hàng đã được kích hoạt.');

        // Clear saved data sau khi thành công
        clearSavedData();
        setTimeout(() => navigate('/seller-dashboard'), 2000);
      } else {
        setMessage(data.message || 'Đăng ký thất bại');
      }
    } catch (error) {
      setMessage('❌ Lỗi kết nối');
    } finally {
      setLoading(false);
    }
  };
  const renderStep1 = () => (
    <div className="card">
      <div className="card-header">
        <h5>🏪 Thông tin Shop</h5>
      </div>
      <div className="card-body">
        <div className="row">
          {/* Tên Shop */}
          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label">Tên Shop *</label>
              <input
                type="text"
                className="form-control"
                value={formData.name}
                onChange={(e) => handleBasicChange('name', e.target.value)}
                placeholder="Tên shop"
                maxLength={30}
                required
              />
              <small className="text-muted">{formData.name.length}/30</small>
            </div>
            </div>

        </div>

        {/* Địa chỉ lấy hàng */}
        <div className="mb-3">
          <label className="form-label">Địa chỉ lấy hàng</label>
          <div className="d-flex align-items-center gap-2 mb-2">
            <span className="text-muted">

              {addresses.length > 0
                ? `${addresses.length} địa chỉ đã thêm`
                : 'Chưa có địa chỉ'}
            </span>
            <button
              type="button"
              className="btn btn-outline-primary btn-sm"
              onClick={() => setShowAddressModal(true)}
            >
              + Thêm
            </button>
          </div>

          {/* Hiển thị địa chỉ mặc định */}
          {addresses.length > 0 && (
            <div className="border rounded p-3 bg-light">
              {(() => {

                const defaultAddress = addresses.find(
                  (addr) => addr.is_default
                );
                if (!defaultAddress) return null;
                return (
                  <div className="bg-white rounded p-3 border">
                    <div className="d-flex justify-content-between align-items-start">
                      <div className="flex-grow-1">
                        <div className="fw-bold text-primary mb-1">
                          📍 {defaultAddress.recipient_name}
                        </div>
                        <div className="text-muted small mb-1">
                          📞 {defaultAddress.phone}
                        </div>
                        <div className="mb-1">
                          {defaultAddress.street}, {defaultAddress.city},{' '}
                          {defaultAddress.province}
                          {defaultAddress.postal_code &&
                            ` - ${defaultAddress.postal_code}`}
                        </div>
                        {defaultAddress.detail && (
                          <div className="text-muted small mb-2">
                            💬 {defaultAddress.detail}
                          </div>
                        )}
                        <span className="badge bg-success">
                          Địa chỉ mặc định
                        </span>
                      </div>
                      <div className="d-flex gap-1">
                        <button
                          type="button"
                          className="btn btn-outline-success btn-sm"
                          onClick={() => handleEditAddress(defaultAddress)}
                          title="Chỉnh sửa địa chỉ"
                        >
                          ✏️ Cập nhật
                        </button>
                        {addresses.length > 1 && (

                          <button
                            type="button"
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => setShowSelectAddressModal(true)}
                            title="Thay đổi địa chỉ mặc định"
                          >
                            🔄 Thay đổi
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => {
                            const filteredAddresses = addresses.filter(
                              (addr) => addr.id !== defaultAddress.id
                            );
                            setAddresses(filteredAddresses);

                            if (filteredAddresses.length > 0) {
                              // Set first remaining address as default
                              const newDefault = {
                                ...filteredAddresses[0],
                                is_default: true,
                              };
                              setAddresses((prev) =>
                                prev.map((addr) =>
                                  addr.id === newDefault.id
                                    ? newDefault
                                    : { ...addr, is_default: false }
                                )
                              );
                              setFormData((prev) => ({
                                ...prev,
                                store_address: newDefault,
                              }));
                            } else {
                              // Reset formData if no addresses left
                              setFormData((prev) => ({
                                ...prev,
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
                                  // Removed is_draft
                                },
                              }));
                            }
                          }}
                          title="Xóa địa chỉ"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Email */}
            <div className="mb-3">

          <label className="form-label">Email</label>
          <input
            type="email"
            className="form-control"
            value={formData.email || ''}
            onChange={(e) => handleBasicChange('email', e.target.value)}
            placeholder="Nhập vào"
          />
        </div>

        {/* Số điện thoại */}
        <div className="row">
          <div className="col-md-6">
            <label className="form-label">Số điện thoại *</label>
            <div className="input-group">
              <span className="input-group-text">+84</span>
              <input
                type="tel"
                className="form-control"
                value={formData.phone || ''}
                onChange={(e) => handleBasicChange('phone', e.target.value)}
                placeholder="367"
                required
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="card">
      <div className="card-header">
        <h5>📋 Thông tin thuế </h5>
      </div>
      <div className="card-body">
        <div className="alert alert-info">
          <i className="bi bi-info-circle"></i>
          <strong>
            Việc thu thập Thông Tin Thuế và Thông Tin Định Danh là bắt buộc theo
            quy định. Người bán chịu trách nhiệm về tính chính xác của thông
            tin.
          </strong>
        </div>

        {/* Loại hình kinh doanh */}
        <div className="mb-4">
          <h6>Loại hình kinh doanh</h6>
          <div className="form-check">
            <input
              className="form-check-input"
              type="radio"
              name="businessType"
              value="company"
              checked={formData.store_information.type === 'company'}
              onChange={(e) =>
                handleInputChange('store_information', 'type', e.target.value)
              }
            />

            <label className="form-check-label">Hộ kinh doanh / Công ty</label>
          </div>
        </div>

        {/* Tên công ty */}
        <div className="row">
          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label">Tên công ty *</label>
              <input
                type="text"
                className="form-control"
                value={formData.store_information.name}
                onChange={(e) =>
                  handleInputChange('store_information', 'name', e.target.value)
                }
                placeholder="Nhập vào"
                maxLength={255}
                required
              />
              <small className="text-muted">0/255</small>
            </div>
          </div>
        </div>

        {/* Địa chỉ đăng ký KD */}
        <div className="mb-3">
          <label className="form-label">Địa chỉ đăng ký kinh doanh</label>
          <input
            type="text"
            className="form-control"
            value={formData.store_information.addresses || ''}
            onChange={(e) =>

              handleInputChange(
                'store_information',
                'addresses',
                e.target.value
              )
            }
            placeholder="An Giang / Huyện An Phú / Thị Trấn An Phú"
          />
        </div>

        {/* Email hóa đơn */}
        <div className="mb-3">
          <label className="form-label">Email nhận hóa đơn điện tử</label>
          <input
            type="email"
            className="form-control"
            value={formData.store_information_email?.email || ''}
            onChange={(e) =>
              handleInputChange('store_information_email', 'email', e.target.value)

            }
            placeholder="testing111@yopmail.com"
            maxLength={100}
          />
          <small className="text-muted">22/100</small>
          <div className="mt-2">
            <button type="button" className="btn btn-link p-0">
              + Thêm Email (1/5)
            </button>
            <p className="small text-muted mt-1">
              Hóa đơn điện tử sẽ được gửi đến email này
            </p>
          </div>
        </div>

        {/* Mã số thuế */}
        <div className="row">
          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label">Mã số thuế</label>
              <input
                type="text"
                className="form-control"
                value={formData.store_information.tax_code || ''}
                onChange={(e) =>
                  handleInputChange(
                    'store_information',
                    'tax_code',
                    e.target.value
                  )
                }
                placeholder="Nhập vào"
                maxLength={14}
              />
              <small className="text-muted">0/14</small>
            </div>
          </div>
        </div>

        {/* Giấy phép */}
        <div className="mb-3">
          <label className="form-label">Giấy phép đăng ký kinh doanh</label>
          <div className="border rounded p-3 text-center">
            <i className="bi bi-cloud-upload fs-1 text-muted"></i>
            <p className="text-muted">Upload</p>
          </div>
        </div>
      </div>
    </div>
  );
  const renderStep3 = () => (
    <div className="card">
      <div className="card-header">
        <h5>🪪 Thông tin định danh</h5>
      </div>
      <div className="card-body">

        {/* Định danh */}
        <div className="mb-4">
          <h6>Thông tin định danh</h6>
          <div className="mb-3">
            <label className="form-label">Loại giấy tờ *</label>
            <select
              className="form-select"
              value={formData.store_identification.type}
              onChange={(e) =>
                handleInputChange(
                  'store_identification',
                  'type',
                  e.target.value
                )
              }
              required
            >
              <option value="CCCD">Căn cước công dân</option>
              <option value="CMND">Chứng minh nhân dân</option>
              <option value="Passport">Hộ chiếu</option>
              <option value="GPKD">Giấy phép kinh doanh</option>
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label">Họ tên đầy đủ *</label>
            <input
              type="text"
              className="form-control"
              value={formData.store_identification.full_name}
              onChange={(e) =>
                handleInputChange(
                  'store_identification',
                  'full_name',
                  e.target.value
                )
              }
              placeholder="Nhập họ tên đầy đủ"
              required
            />
          </div>
        </div>

        {/* Ngân hàng */}
        <div className="mb-4">
          <h6>Thông tin tài khoản ngân hàng</h6>
          <div className="row">
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label">Tên ngân hàng *</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.bank_account.bank_name}
                  onChange={(e) =>
                    handleInputChange(
                      'bank_account',
                      'bank_name',
                      e.target.value
                    )
                  }
                  placeholder="Vietcombank"
                  required
                />
              </div>
            </div>
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label">Số tài khoản *</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.bank_account.account_number}
                  onChange={(e) =>
                    handleInputChange(
                      'bank_account',
                      'account_number',
                      e.target.value
                    )
                  }
                  placeholder="1234567890"
                  required
                />
              </div>
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Chủ tài khoản *</label>
            <input
              type="text"
              className="form-control"
              value={formData.bank_account.account_holder}
              onChange={(e) =>
                handleInputChange(
                  'bank_account',
                  'account_holder',
                  e.target.value
                )
              }
              placeholder="Nguyễn Văn A"
              required
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="card">
      <div className="card-header">
        <h5>✅ Hoàn tất đăng ký</h5>
      </div>
      <div className="card-body text-center">
        <h4>Xác nhận thông tin đăng ký</h4>
        <p className="text-muted">
          Vui lòng kiểm tra lại thông tin trước khi hoàn tất đăng ký
        </p>

        <div className="text-start mt-4">
          <h6>Thông tin Shop:</h6>
          <ul>
            <li>Tên shop: {formData.name}</li>
            <li>Email: {formData.email}</li>
            <li>Số điện thoại: {formData.phone}</li>
          </ul>

          <h6>Thông tin kinh doanh:</h6>
          <ul>
            <li>
              Loại hình:{' '}
              {formData.store_information.type === 'individual'
                ? 'Cá nhân'
                : 'Công ty'}
            </li>
            <li>Tên: {formData.store_information.name}</li>
            <li>Mã số thuế: {formData.store_information.tax_code}</li>
          </ul>

          <h6>Thông tin ngân hàng:</h6>
          <ul>
            <li>Ngân hàng: {formData.bank_account.bank_name}</li>
            <li>Số tài khoản: {formData.bank_account.account_number}</li>
            <li>Chủ tài khoản: {formData.bank_account.account_holder}</li>
          </ul>
        </div>

        <div className="d-flex gap-3 justify-content-center mt-4">
          <button
            className="btn btn-success btn-lg"
            onClick={handleFinalSubmit}
            disabled={loading}
          >
            {loading ? 'Đang xử lý...' : '✅ Hoàn tất đăng ký'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container mt-4">
      {/* Progress Steps */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex align-items-center justify-content-center">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="text-center">
                  <div
                    className={`rounded-circle d-flex align-items-center justify-content-center ${
                      currentStep >= step.id
                        ? 'bg-danger text-white'
                        : 'bg-light text-muted'
                    }`}
                    style={{ width: '40px', height: '40px' }}
                  >
                    {step.id}
                  </div>
                  <div className="mt-2">
                    <small className="fw-bold">{step.title}</small>
                    <br />
                    <small className="text-muted">{step.description}</small>
                  </div>
                </div>

                {index < steps.length - 1 && (
                  <div
                    className={`mx-4 ${
                      currentStep > step.id ? 'bg-danger' : 'bg-light'
                    }`}
                    style={{ height: '2px', width: '100px' }}
                  ></div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="row justify-content-center">
        <div className="col-md-10">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}

          {/* Navigation Buttons */}
          <div className="d-flex justify-content-between align-items-center mt-4">
            <button
              className="btn btn-outline-secondary"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              Quay lại
            </button>

            <div className="d-flex gap-2">
              {/* Nút Clear Form */}
              <button
                className="btn btn-outline-danger btn-sm"
                onClick={() => {
                  if (
                    window.confirm(
                      'Bạn có chắc muốn xóa tất cả dữ liệu đã nhập?'
                    )
                  ) {
                    clearSavedData();
                    setFormData(defaultSellerFormData);
                    setAddresses([]);
                    setCurrentStep(1);
                    setMessage('✅ Đã xóa dữ liệu form');
                  }
                }}
                title="Xóa tất cả dữ liệu đã nhập"
              >
                🗑️ Clear
              </button>

              {/* Nút Lưu nháp ở giữa - chỉ hiện từ Step 1-3 */}
              {currentStep < steps.length && (
                <button
                  className="btn btn-outline-warning"
                  onClick={handleSaveDraft}
                  disabled={loading}
                >
                  {loading ? 'Đang lưu...' : `📝 Lưu Step ${currentStep}`}
                </button>
              )}
            </div>

            {currentStep < steps.length && (
              <button
                className="btn btn-danger"
                onClick={nextStep}
                disabled={currentStep === steps.length}
              >
                Tiếp theo
              </button>
            )}
          </div>

          {/* Message */}
          {message && (
            <div
              className={`alert mt-3 ${
                message.includes('thành công')
                  ? 'alert-success'
                  : 'alert-danger'
              }`}
            >
              {message}
            </div>
          )}
        </div>
      </div>

      {/* Address Modal */}
      {showAddressModal && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >

          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingAddress
                    ? '✏️ Chỉnh sửa địa chỉ lấy hàng'
                    : '📍 Thêm địa chỉ lấy hàng'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowAddressModal(false);
                    setEditingAddress(null);
                    setAddressFormData({
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
                      // Removed is_draft
                    });
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <form>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Tên người nhận *</label>
                        <input
                          type="text"
                          className="form-control"
                          value={addressFormData.recipient_name}

                          onChange={(e) =>
                            handleAddressInputChange(
                              'recipient_name',
                              e.target.value
                            )
                          }
                          placeholder="Nguyễn Văn A"
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Số điện thoại *</label>
                        <input
                          type="tel"
                          className="form-control"
                          value={addressFormData.phone}

                          onChange={(e) =>
                            handleAddressInputChange('phone', e.target.value)
                          }
                          placeholder="0123456789"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Địa chỉ đường phố *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={addressFormData.street}
                      onChange={(e) =>
                        handleAddressInputChange('street', e.target.value)
                      }
                      placeholder="123 Nguyễn Văn Linh"
                      required
                    />
                  </div>

                  <div className="row">
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Tỉnh/Thành phố *</label>
                        <input
                          type="text"
                          className="form-control"
                          value={addressFormData.province}
                          onChange={(e) =>
                            handleAddressInputChange('province', e.target.value)
                          }
                          placeholder="TP. Hồ Chí Minh"
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Quận/Huyện *</label>
                        <input
                          type="text"
                          className="form-control"
                          value={addressFormData.city}
                          onChange={(e) =>
                            handleAddressInputChange('city', e.target.value)
                          }
                          placeholder="Quận 1"
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Mã bưu điện *</label>
                        <input
                          type="text"
                          className="form-control"
                          value={addressFormData.postal_code}

                          onChange={(e) =>
                            handleAddressInputChange(
                              'postal_code',
                              e.target.value
                            )
                          }
                          placeholder="700000"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Chi tiết thêm</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      value={addressFormData.detail}
                      onChange={(e) =>
                        handleAddressInputChange('detail', e.target.value)
                      }
                      placeholder="Ghi chú thêm về địa chỉ..."
                    ></textarea>
                  </div>
                </form>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddressModal(false)}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleAddAddress}
                >
                  {editingAddress ? 'Cập nhật địa chỉ' : 'Thêm địa chỉ'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Select Address Modal */}
      {showSelectAddressModal && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">🏠 Chọn địa chỉ mặc định</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowSelectAddressModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <p className="text-muted mb-3">
                  Chọn địa chỉ bạn muốn đặt làm mặc định:
                </p>
                <div className="d-grid gap-2">
                  {addresses.map((address) => (
                    <div
                      key={address.id}
                      className={`card ${
                        address.is_default ? 'border-success' : 'border-light'
                      }`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        handleSetDefaultAddress(address.id);
                        setShowSelectAddressModal(false);
                        setMessage('✅ Đã thay đổi địa chỉ mặc định');
                      }}
                    >
                      <div className="card-body p-3">
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="flex-grow-1">
                            <div className="fw-bold text-primary">
                              📍 {address.recipient_name}
                            </div>
                            <div className="text-muted small">
                              📞 {address.phone}
                            </div>
                            <div className="mt-1">
                              {address.street}, {address.city},{' '}
                              {address.province}
                              {address.postal_code &&
                                ` - ${address.postal_code}`}
                            </div>
                            {address.detail && (
                              <div className="text-muted small mt-1">
                                💬 {address.detail}
                              </div>
                            )}
                          </div>
                          <div>
                            {address.is_default ? (
                              <span className="badge bg-success">
                                Đang sử dụng
                              </span>
                            ) : (
                              <span className="badge bg-outline-secondary">
                                Chọn làm mặc định
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowSelectAddressModal(false)}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
