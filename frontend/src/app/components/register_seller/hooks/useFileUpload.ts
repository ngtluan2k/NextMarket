import { useState } from 'react';

export const useFileUpload = () => {
  const [selectedDocFile, setSelectedDocFile] = useState<File | null>(null);
  const [cccdFrontFile, setCccdFrontFile] = useState<File | null>(null);
  const [cccdBackFile, setCccdBackFile] = useState<File | null>(null);

  // Upload Business License
  const uploadBusinessLicense = async (onSuccess: (fileUrl: string) => void) => {
    if (!selectedDocFile) return;
    
    const token = localStorage.getItem('token');
    const form = new FormData();
    form.append('file', selectedDocFile);
    form.append('doc_type', 'BUSINESS_LICENSE');
    
    const res = await fetch('http://localhost:3000/store-documents/upload-file', {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${token}`,
        // Don't set Content-Type manually - let browser set it with boundary
      },
      body: form,
    });
    
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Upload giấy phép thất bại');
    
    onSuccess(data.file_url);
    // Don't reset selectedDocFile here - keep it for display
  };

  // Upload CCCD
  const uploadCCCD = async (storeId: number | null, onSuccess: (frontUrl: string, backUrl: string) => void) => {
    if (!cccdFrontFile && !cccdBackFile) return;

    const token = localStorage.getItem('token');
    const headers: any = token ? { Authorization: `Bearer ${token}` } : {};

    if (storeId) {
      let frontUrl = '';
      let backUrl = '';
      
      if (cccdFrontFile) {
        const fd = new FormData();
        fd.append('file', cccdFrontFile);
        const res = await fetch(`http://localhost:3000/store-identification/store/${storeId}/upload-front`, {
          method: 'POST',
          headers: {
            ...headers,
            // Don't set Content-Type manually - let browser set it with boundary
          },
          body: fd,
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData?.message || 'Upload CCCD mặt trước thất bại');
        }
        const data = await res.json();
        console.log('Upload front response:', data);
        frontUrl = data?.img_front || '';
      }
      
      if (cccdBackFile) {
        const fd = new FormData();
        fd.append('file', cccdBackFile);
        const res = await fetch(`http://localhost:3000/store-identification/store/${storeId}/upload-back`, {
          method: 'POST',
          headers: {
            ...headers,
            // Don't set Content-Type manually - let browser set it with boundary
          },
          body: fd,
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData?.message || 'Upload CCCD mặt sau thất bại');
        }
        const data = await res.json();
        console.log('Upload back response:', data);
        backUrl = data?.img_back || '';
      }
      
      onSuccess(frontUrl, backUrl);
      return;
    }

    // No storeId yet: temp uploads
    let frontUrl = '';
    let backUrl = '';
    
    if (cccdFrontFile) {
      const fd = new FormData();
      fd.append('file', cccdFrontFile);
      fd.append('side', 'front');
      const res = await fetch(`http://localhost:3000/store-identification/upload-image`, {
        method: 'POST',
        headers: {
          ...headers,
          // Don't set Content-Type manually - let browser set it with boundary
        },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Upload tạm mặt trước thất bại');
      frontUrl = data.file_url;
    }
    
    if (cccdBackFile) {
      const fd = new FormData();
      fd.append('file', cccdBackFile);
      fd.append('side', 'back');
      const res = await fetch(`http://localhost:3000/store-identification/upload-image`, {
        method: 'POST',
        headers: {
          ...headers,
          // Don't set Content-Type manually - let browser set it with boundary
        },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Upload tạm mặt sau thất bại');
      backUrl = data.file_url;
    }
    
    onSuccess(frontUrl, backUrl);
  };

  // Clear all file states
  const clearAllFiles = () => {
    setSelectedDocFile(null);
    setCccdFrontFile(null);
    setCccdBackFile(null);
  };

  // Clear specific file
  const clearBusinessLicense = () => setSelectedDocFile(null);
  const clearCCCDFiles = () => {
    setCccdFrontFile(null);
    setCccdBackFile(null);
  };

  return {
    selectedDocFile,
    setSelectedDocFile,
    cccdFrontFile,
    setCccdFrontFile,
    cccdBackFile,
    setCccdBackFile,
    uploadBusinessLicense,
    uploadCCCD,
    clearAllFiles,
    clearBusinessLicense,
    clearCCCDFiles,
  };
};
