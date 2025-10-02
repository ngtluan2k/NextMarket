import { useState } from 'react';

interface Email {
  id: number;
  email: string;
  is_default: boolean;
  description?: string;
}

interface EmailFormData {
  email: string;
  description: string;
  is_default: boolean;
}

export const useEmailManagement = () => {
  const [emails, setEmails] = useState<Email[]>([]);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showSelectEmailModal, setShowSelectEmailModal] = useState(false);
  const [editingEmail, setEditingEmail] = useState<Email | null>(null);
  const [emailFormData, setEmailFormData] = useState<EmailFormData>({
    email: '',
    description: '',
    is_default: true,
  });

  const handleEmailInputChange = (field: string, value: any) => {
    setEmailFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddEmail = (
    onMessage: (msg: string, type: string) => void,
    onFormDataChange: (field: string, value: any) => void
  ) => {
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailFormData.email || !emailRegex.test(emailFormData.email)) {
      onMessage('❌ Vui lòng nhập email hợp lệ', 'error');
      return;
    }

    // Check duplicate
    const isDuplicate = emails.some(
      (email) => email.email === emailFormData.email &&
        (!editingEmail || email.id !== editingEmail.id)
    );
    if (isDuplicate) {
      onMessage('❌ Email này đã tồn tại', 'error');
      return;
    }

    if (emails.length >= 5 && !editingEmail) {
      onMessage('❌ Chỉ được thêm tối đa 5 email', 'error');
      return;
    }

    if (editingEmail) {
      // Update existing email
      setEmails((prev) =>
        prev.map((email) =>
          email.id === editingEmail.id
            ? {
              ...emailFormData,
              id: editingEmail.id,
              is_default: editingEmail.is_default,
            }
            : email
        )
      );

      // Update formData if editing default email
      if (editingEmail.is_default) {
        onFormDataChange('store_information_email', {
          email: emailFormData.email,
        });
      }

      onMessage('✅ Email đã được cập nhật thành công', 'success');
    } else {
      // Add new email
      const isFirstEmail = emails.length === 0;
      const newEmail = {
        ...emailFormData,
        id: Date.now(),
        is_default: isFirstEmail,
      };
      setEmails((prev) => [...prev, newEmail]);

      // Update formData for backend submission (always use default email)
      if (isFirstEmail) {
        onFormDataChange('store_information_email', {
          email: emailFormData.email,
        });
      }

      onMessage('✅ Email đã được thêm thành công', 'success');
    }

    // Reset form and close modal
    setEmailFormData({
      email: '',
      description: '',
      is_default: true,
    });
    setEditingEmail(null);
    setShowEmailModal(false);
  };

  const handleSetDefaultEmail = (
    emailId: number,
    onFormDataChange: (field: string, value: any) => void
  ) => {
    // Update emails array - set new default and unset others
    setEmails((prev) =>
      prev.map((email) => ({
        ...email,
        is_default: email.id === emailId,
      }))
    );

    // Update formData with new default email
    const newDefaultEmail = emails.find((email) => email.id === emailId);
    if (newDefaultEmail) {
      onFormDataChange('store_information_email', {
        email: newDefaultEmail.email,
      });
    }
  };

  const handleEditEmail = (email: Email) => {
    setEditingEmail(email);
    setEmailFormData({
      email: email.email,
      description: email.description || '',
      is_default: email.is_default,
    });
    setShowEmailModal(true);
  };

  const handleDeleteEmail = (
    emailId: number,
    onFormDataChange: (field: string, value: any) => void
  ) => {
    const filteredEmails = emails.filter((email) => email.id !== emailId);
    setEmails(filteredEmails);

    if (filteredEmails.length > 0) {
      // Set first remaining email as default
      const newDefault = {
        ...filteredEmails[0],
        is_default: true,
      };
      setEmails((prev) =>
        prev.map((email) =>
          email.id === newDefault.id
            ? newDefault
            : { ...email, is_default: false }
        )
      );
      onFormDataChange('store_information_email', {
        email: newDefault.email,
      });
    } else {
      // Reset formData if no emails left
      onFormDataChange('store_information_email', {
        email: '',
      });
    }
  };

  return {
    emails,
    setEmails,
    showEmailModal,
    setShowEmailModal,
    showSelectEmailModal,
    setShowSelectEmailModal,
    editingEmail,
    setEditingEmail,
    emailFormData,
    setEmailFormData,
    handleEmailInputChange,
    handleAddEmail,
    handleSetDefaultEmail,
    handleEditEmail,
    handleDeleteEmail,
  };
};
