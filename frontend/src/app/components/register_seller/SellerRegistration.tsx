import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SellerFormData, defaultSellerFormData } from '../types';
import { useSellerRegistration } from './hooks/useSellerRegistration';
import { useAddressManagement } from './hooks/useAddressManagement';
import { useEmailManagement } from './hooks/useEmailManagement';
import { useUnsavedChanges } from './hooks/useUnsavedChanges';
import { useFileUpload } from './hooks/useFileUpload';
import { useSaveDraft } from './hooks/useSaveDraft';

// Components
import Step1BasicInfo, { Step1BasicInfoHandle } from './components/Step1BasicInfo';
import Step2BusinessInfo, { Step2BusinessInfoHandle } from './components/Step2BusinessInfo';
import Step3Identification, { Step3IdentificationHandle } from './components/Step3Identification';
import Step4Confirmation from './components/Step4Confirmation';
import AddressModal from './components/AddressModal';
import EmailModal from './components/EmailModal';
import SaveBeforeExitModal from './components/SaveBeforeExitModal';
import UnsavedChangesBanner from './components/UnsavedChangesBanner';
import StepProgress from './components/StepProgress';
import StepNavigation from './components/StepNavigation';

// Utils
import {
  validateStep1,
  validateStep2,
  validateStep3,
} from './utils/validation';
import ClearConfirmModal from './components/ClearConfirmModal';

export const SellerRegistration: React.FC = () => {
  const navigate = useNavigate();
  
  const step1Ref = React.useRef<Step1BasicInfoHandle>(null);
  const step2Ref = React.useRef<Step2BusinessInfoHandle>(null);
  const step3Ref = React.useRef<Step3IdentificationHandle>(null);

  // Core form state
  const {
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
    setStoreInformationId,
    steps,
    handleInputChange,
    handleBasicChange,
    nextStep,
    prevStep,
    clearSavedData,
  } = useSellerRegistration();

  // Address state
  const {
    addresses,
    setAddresses,
    showAddressModal,
    setShowAddressModal,
    editingAddress,
    setEditingAddress,
    addressFormData,
    setAddressFormData,
    handleAddressInputChange,
    handleAddAddress,
    handleSetDefaultAddress,
    handleEditAddress,
    handleDeleteAddress,
  } = useAddressManagement();

  // Email state
  const {
    emails,
    setEmails,
    showEmailModal,
    setShowEmailModal,
    editingEmail,
    setEditingEmail,
    emailFormData,
    setEmailFormData,
    handleEmailInputChange,
    handleAddEmail,
    handleSetDefaultEmail,
    handleEditEmail,
    handleDeleteEmail,
  } = useEmailManagement();

  // Unsaved changes
  const { hasUnsavedChanges, markAsSaved } = useUnsavedChanges(
    formData,
    currentStep,
    addresses,
    emails
  );

  // Save-before-exit modal
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [pendingExit, setPendingExit] = useState(false);

  // File upload hook
  const {
    selectedDocFile,
    setSelectedDocFile,
    cccdFrontFile,
    setCccdFrontFile,
    cccdBackFile,
    setCccdBackFile,
    uploadBusinessLicense,
    uploadCCCD,
    clearAllFiles,
  } = useFileUpload();

  // Save draft hook
  const { loading: saveLoading, saveDraft } = useSaveDraft();

  // Init: load local + server draft
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setFormData(defaultSellerFormData);
          setCurrentStep(1);
          return;
        }

        const res = await fetch('http://localhost:3000/stores/my-store', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          if (data?.data?.id) {
            await loadFullDraftData(data.data.id, null, false);
            return;
          }
        }

        const savedFormData = localStorage.getItem('seller_registration_form_data');
        const savedStep = localStorage.getItem('seller_registration_current_step');
        const savedAddresses = localStorage.getItem('seller_registration_addresses');

        if (savedFormData) {
          const parsed = JSON.parse(savedFormData);
          setFormData({ ...defaultSellerFormData, ...parsed });
          setMessage('Đã tải thông tin đã lưu từ phiên trước');
          setMessageType('info');
        } else {
          setFormData(defaultSellerFormData);
        }

        if (savedStep) {
          setCurrentStep(parseInt(savedStep));
        } else {
          setCurrentStep(1);
        }

        if (savedAddresses) {
          setAddresses(JSON.parse(savedAddresses));
        }
      } catch (error) {
        console.error('Error loading saved data:', error);
        clearSavedData();
        setFormData(defaultSellerFormData);
        setCurrentStep(1);
      }
    };
    loadSavedData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [showClearModal, setShowClearModal] = useState(false);

  const performClearAll = () => {
    clearSavedData();
    setFormData(defaultSellerFormData);
    setAddresses([]);
    setEmails([]);
    setCurrentStep(1);
    clearAllFiles();
    setMessage('Đã xóa dữ liệu form');
    setMessageType('success');
    setShowClearModal(false);
  };

  // Load full draft from server
  const loadFullDraftData = async (
    sid: number,
    savedFormData: string | null,
    suppressMessage = false
  ) => {
    try {
      if (loading) return;
      setLoading(true);

      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/stores/${sid}/draft-data`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return;

      const result = await response.json();
      const draft = result.data;

      const mapped: SellerFormData = {
        name: draft.store?.name && draft.store.name !== 'undefined' ? draft.store.name : '',
        description: draft.store?.description || '',
        email: draft.store?.email || '',
        phone: draft.store?.phone || '',
        store_information: {
          type: draft.storeInformation?.type || 'individual',
          name: draft.storeInformation?.name || '',
          addresses: draft.storeInformation?.addresses || '',
          tax_code: draft.storeInformation?.tax_code || '',
        },
        store_identification: {
          type: draft.storeIdentification?.type || 'CCCD',
          full_name: draft.storeIdentification?.full_name || '',
          img_front: draft.storeIdentification?.img_front || '',
          img_back: draft.storeIdentification?.img_back || '',
        },
        bank_account: {
          bank_name: draft.bankAccount?.bank_name || '',
          account_number: draft.bankAccount?.account_number || '',
          account_holder: draft.bankAccount?.account_holder || '',
          is_default: draft.bankAccount?.is_default ?? true,
        },
        store_address: {
          recipient_name: draft.storeAddress?.recipient_name || '',
          phone: draft.storeAddress?.phone || '',
          street: draft.storeAddress?.street || '',
          city: (draft.storeAddress as any)?.district || draft.storeAddress?.city || '',
          province: draft.storeAddress?.province || '',
          country: draft.storeAddress?.country || 'Vietnam',
          postal_code: draft.storeAddress?.postal_code || '',
          type: draft.storeAddress?.type || 'pickup',
          detail: draft.storeAddress?.detail || '',
          is_default: draft.storeAddress?.is_default ?? true,
        },
        store_information_email: {
          email: draft.storeEmail?.email || '',
        },
        documents: draft.documents || [],
      };

      setStoreInformationId(draft.storeInformation?.id ?? null);
      setStoreId(draft.store?.id ?? null);

      if (draft.storeEmail?.email) {
        setEmails([
          {
            id: draft.storeEmail.id || Date.now(),
            email: draft.storeEmail.email,
            is_default: true,
            description: '',
          },
        ]);
      }

      if (draft.storeAddress) {
        setAddresses([
          {
            id: draft.storeAddress.id || Date.now(),
            recipient_name: draft.storeAddress.recipient_name || '',
            phone: draft.storeAddress.phone || '',
            street: draft.storeAddress.street || '',
            district: (draft.storeAddress as any).district || draft.storeAddress.city || '',
            province: draft.storeAddress.province || '',
            country: draft.storeAddress.country || 'Vietnam',
            ward: draft.storeAddress.ward || '',
            postal_code: draft.storeAddress.postal_code || '',
            type: draft.storeAddress.type || 'pickup',
            detail: draft.storeAddress.detail || '',
            is_default: true,
          },
        ]);
      }

      if (!savedFormData) {
        setFormData(mapped);
      } else {
        const local = JSON.parse(savedFormData);
        const hasLocal = local.name || local.phone || local.email;
        setFormData(hasLocal ? { ...mapped, ...local } : mapped);
      }

      let determinedStep = 1;
      if (mapped.name && mapped.email && mapped.phone && addresses.length > 0) {
        determinedStep = 2;
      }
      if (mapped.store_information?.name && mapped.store_information?.addresses && emails.length > 0) {
        determinedStep = 3;
      }
      if (mapped.store_identification?.full_name || mapped.bank_account?.bank_name) {
        determinedStep = 4;
      }
      setCurrentStep(determinedStep);

      if (!suppressMessage) {
        setMessage(`Đã tải đầy đủ thông tin bản nháp từ server! (Step ${determinedStep})`);
        setMessageType('info');
      }

      clearAllFiles();
    } catch {
      setMessage('Không thể tải bản nháp từ server');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  // Final submit (Option 2 flow)
  const handleFinalSubmit = async () => {
    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');

      const defaultAddress = addresses.find((a) => a.is_default);
      if (!formData.store_information_email.email) {
        setMessage('Vui lòng nhập email hóa đơn');
        setMessageType('error');
        setLoading(false);
        return;
      }
      if (!defaultAddress) {
        setMessage('Vui lòng thêm địa chỉ và chọn địa chỉ mặc định');
        setMessageType('error');
        setLoading(false);
        return;
      }

      const required = ['recipient_name', 'phone', 'street', 'province', 'postal_code'] as const;
      const missing = required.filter((k) => !(defaultAddress as any)[k]);
      if (missing.length) {
        setMessage(
          'Vui lòng điền đầy đủ địa chỉ: người nhận, điện thoại, đường, thành phố, tỉnh, mã bưu điện'
        );
        setMessageType('error');
        setLoading(false);
        return;
      }

      const stepData: any = {
        name: formData.name,
        description: formData.description,
        email: formData.email,
        phone: formData.phone,
        store_information: {
          type: formData.store_information.type,
          name: formData.store_information.name,
          addresses: formData.store_information.addresses,
          tax_code: formData.store_information.tax_code,
        },
        store_information_email: {
          email: formData.store_information_email.email,
        },
        ...(Array.isArray(formData.documents) &&
        formData.documents.filter((d) => d?.file_url && d?.doc_type).length > 0
          ? {
              documents: formData.documents
                .filter((d) => d?.file_url && d?.doc_type)
                .map((d) => ({ doc_type: d.doc_type, file_url: d.file_url })),
            }
          : {}),
        bank_account: {
          bank_name: formData.bank_account.bank_name,
          account_number: formData.bank_account.account_number,
          account_holder: formData.bank_account.account_holder,
          is_default: formData.bank_account.is_default ?? true,
        },
        store_address: {
          recipient_name: defaultAddress.recipient_name,
          phone: defaultAddress.phone,
          street: defaultAddress.street,
          district:
            (defaultAddress as any).district &&
            String((defaultAddress as any).district).trim()
              ? (defaultAddress as any).district
              : null,
          ward: (defaultAddress as any).ward || '',
          province: defaultAddress.province,
          country: defaultAddress.country,
          postal_code: defaultAddress.postal_code,
          type: defaultAddress.type,
          detail: defaultAddress.detail,
          is_default: true,
        },
        is_draft: false,
        ...(storeId ? { store_id: storeId } : {}),
      };

      const hasIdentificationData =
        !!formData.store_identification.full_name ||
        !!formData.store_identification.img_front ||
        !!formData.store_identification.img_back;

      if (hasIdentificationData) {
        if (!formData.store_identification.full_name) {
          setMessage('Vui lòng nhập Họ tên trong phần Thông tin định danh hoặc bỏ trống mục này.');
          setMessageType('error');
          setLoading(false);
          return;
        }
        stepData.store_identification = {
          type: formData.store_identification.type,
          full_name: formData.store_identification.full_name,
          img_front: formData.store_identification.img_front,
          img_back: formData.store_identification.img_back,
        };
      }

      if (storeId) {
        stepData.store_id = storeId;
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
        localStorage.removeItem('seller_registration_form_data');
        localStorage.removeItem('seller_registration_current_step');
        localStorage.removeItem('seller_registration_addresses');
        setMessage('Đăng ký thành công!');
        setMessageType('success');
        navigate('/myStores');
        return;
      } else {
        setMessage(`Lỗi đăng ký: ${data.message || 'Thất bại'}`);
        setMessageType('error');
      }
    } catch {
      setMessage('Lỗi kết nối');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  // ... trong SellerRegistration

const handleNextStep = async () => {
  setMessage('');
  setLoading(true);
  try {
    if (currentStep === 1) {
      const ok1 = step1Ref.current?.validateAll?.() ?? false;
      const list1 = validateStep1(formData, addresses);
      if (!ok1 || list1.length) { setLoading(false); return; }
    }

    if (currentStep === 2) {
      const ok2 = step2Ref.current?.validateAll?.() ?? false;
      const list2 = validateStep2(formData, emails, selectedDocFile);
      if (!ok2 || list2.length) { setLoading(false); return; }
      // upload giấy phép (nếu có) SAU khi đã hợp lệ
      if (selectedDocFile) {
        await uploadBusinessLicense((fileUrl) => {
          setFormData((prev) => ({
            ...prev,
            documents: [
              ...(prev.documents || []).filter((d) => d.doc_type !== 'BUSINESS_LICENSE'),
              { doc_type: 'BUSINESS_LICENSE', file_url: fileUrl },
            ],
          }));
        });
      }
    }

    if (currentStep === 3) {
      // ✅ chỉ validate 1 lần và TRUYỀN file vào validateStep3
      const ok3 = step3Ref.current?.validateAll?.() ?? false;
      const list3 = validateStep3(formData, { front: cccdFrontFile, back: cccdBackFile });
      if (!ok3 || list3.length) { setLoading(false); return; }

      // upload CCCD (nếu có chọn)
      if (cccdFrontFile || cccdBackFile) {
        await uploadCCCD(storeId, (frontUrl, backUrl) => {
          setFormData((prev) => ({
            ...prev,
            store_identification: {
              ...prev.store_identification,
              img_front: frontUrl || prev.store_identification.img_front,
              img_back:  backUrl  || prev.store_identification.img_back,
            },
          }));
        });
      }
    }

    const newStoreId = await saveDraft(
      currentStep, formData, addresses, emails, storeId,
      (m) => { setMessage(m); setMessageType('success'); markAsSaved(); },
      (m) => { setMessage(m); setMessageType('error'); }
    );
    if (newStoreId) setStoreId(newStoreId);

    nextStep();
  } catch (e: any) {
    setMessage(`❌ Lỗi: ${e.message || 'Có lỗi xảy ra'}`);
    setMessageType('error');
  } finally {
    setLoading(false);
  }
};


  // Enhanced beforeunload with save-before-exit modal
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'Bạn có muốn lưu bản nháp trước khi thoát không?';
        setShowSaveModal(true);
        setPendingExit(true);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Save-before-exit actions
  const handleSaveBeforeExit = async () => {
    try {
      setLoading(true);
      await saveDraft(
        currentStep,
        formData,
        addresses,
        emails,
        storeId,
        (message) => {
          setMessage(message);
          setMessageType('success');
          markAsSaved();
        },
        (message) => {
          setMessage(message);
          setMessageType('error');
        }
      );
      setShowSaveModal(false);
      setPendingExit(false);
      if (pendingExit) {
        clearSavedData();
        navigate('/');
      }
    } catch (error: any) {
      setMessage(`❌ Lỗi lưu nháp: ${error.message}`);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleDontSave = () => {
    setShowSaveModal(false);
    setPendingExit(false);
    clearSavedData();
    setFormData(defaultSellerFormData);
    setAddresses([]);
    setEmails([]);
    setCurrentStep(1);
    clearAllFiles();
    if (pendingExit) {
      navigate('/');
    }
  };

  const handleCancelExit = () => {
    setShowSaveModal(false);
    setPendingExit(false);
  };

  // Adapters for child components
  const handleStoreInformationChange = (field: string, value: any) => {
    handleInputChange('store_information', field, value);
  };
  const handleStoreIdentificationChange = (field: string, value: any) => {
    handleInputChange('store_identification', field, value);
  };
  const handleBankAccountChange = (field: string, value: any) => {
    handleInputChange('bank_account', field, value);
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1BasicInfo
            ref={step1Ref}
            formData={formData}
            addresses={addresses}
            onBasicChange={handleBasicChange}
            onAddressChange={setAddresses}
            onShowAddressModal={() => setShowAddressModal(true)}
            onShowSelectAddressModal={() => {}}
            onEditAddress={handleEditAddress}
            onSetDefaultAddress={handleSetDefaultAddress}
            onDeleteAddress={handleDeleteAddress}
          />
        );
      case 2:
        return (
          <Step2BusinessInfo
              ref={step2Ref}
              formData={formData}
              emails={emails}
              selectedDocFile={selectedDocFile}
              businessLicenseUrl={
                formData.documents?.find((d) => d.doc_type === 'BUSINESS_LICENSE')?.file_url || ''
              }
              onInputChange={handleStoreInformationChange}
              onShowEmailModal={() => setShowEmailModal(true)}
              onShowSelectEmailModal={() => {}}
              onEditEmail={handleEditEmail}
              onSetDefaultEmail={(id) =>
                handleSetDefaultEmail(id, (f, v) => handleBasicChange(f as any, v))
              }
              onDeleteEmail={(id) =>
                handleDeleteEmail(id, (f, v) => handleBasicChange(f as any, v))
              }
              onDocFileChange={setSelectedDocFile}
            />
        );
      case 3:
        return (
          <Step3Identification
          ref={step3Ref}
          formData={formData}
          onInputChange={handleStoreIdentificationChange}
          onBankAccountChange={handleBankAccountChange}
          onFileSelected={(side, file) => {
            if (side === 'front') setCccdFrontFile(file);
            else setCccdBackFile(file);
          }}
          frontFile={cccdFrontFile}
          backFile={cccdBackFile}
        />
        
        );
      case 4:
        return (
          <Step4Confirmation
            formData={formData}
            loading={loading}
            onFinalSubmit={handleFinalSubmit}
          />
        );
      default:
        return null;
    }
  };

  const messageColors =
    messageType === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
      : messageType === 'error'
      ? 'border-rose-200 bg-rose-50 text-rose-800'
      : messageType === 'warning'
      ? 'border-amber-200 bg-amber-50 text-amber-800'
      : 'border-sky-200 bg-sky-50 text-sky-800';

  return (
    <div className="container mx-auto mt-4 max-w-7xl px-4">
      <UnsavedChangesBanner
        hasUnsavedChanges={hasUnsavedChanges}
        loading={loading || saveLoading}
        onSaveDraft={async () => {
          await saveDraft(
            currentStep,
            formData,
            addresses,
            emails,
            storeId,
            (message) => {
              setMessage(message);
              setMessageType('success');
              markAsSaved();
            },
            (message) => {
              setMessage(message);
              setMessageType('error');
            }
          );
        }}
        onDiscardChanges={() => {
          setFormData(defaultSellerFormData);
          setAddresses([]);
          setEmails([]);
          setCurrentStep(1);
          clearAllFiles();
          setMessage('✅ Đã hủy thay đổi');
          setMessageType('success');
        }}
      />

      <StepProgress steps={steps} currentStep={currentStep} />

      {/* ⬇️ vùng nội dung rộng hơn */}
      <div className="mx-auto max-w-6xl">
        {renderCurrentStep()}

        <StepNavigation
          currentStep={currentStep}
          totalSteps={steps.length}
          loading={loading || saveLoading}
          onPrevStep={prevStep}
          onNextStep={handleNextStep}
          onClearData={() => setShowClearModal(true)} 
        />
      </div>

      <AddressModal
        show={showAddressModal}
        editingAddress={editingAddress}
        addressFormData={addressFormData}
        onClose={() => {
          setShowAddressModal(false);
          setEditingAddress(null);
          setAddressFormData({
            recipient_name: '',
            phone: '',
            street: '',
            district: '',
            province: '',
            ward: '',
            country: 'Vietnam',
            postal_code: '',
            type: 'pickup',
            detail: '',
            is_default: true,
          });
        }}
        onInputChange={handleAddressInputChange}
        onSave={(version) => {
          handleAddAddress(setMessage, version);
        }}
      />

      <EmailModal
        show={showEmailModal}
        editingEmail={editingEmail}
        emailFormData={emailFormData}
        onClose={() => {
          setShowEmailModal(false);
          setEditingEmail(null);
          setEmailFormData({ email: '', description: '', is_default: true });
        }}
        onInputChange={handleEmailInputChange}
        onSave={() =>
          handleAddEmail(setMessage, (field, value) => handleBasicChange(field as any, value))
        }
      />

      <SaveBeforeExitModal
        show={showSaveModal}
        onSave={handleSaveBeforeExit}
        onDontSave={handleDontSave}
        onCancel={handleCancelExit}
        loading={loading}
      />

       <ClearConfirmModal
        show={showClearModal}
        onCancel={() => setShowClearModal(false)}
        onConfirm={performClearAll}
      />
    </div>
  );
};
