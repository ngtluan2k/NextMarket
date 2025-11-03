import React, { useState } from "react";
import { Modal, Input, message } from "antd";

interface AddMemberModalProps {
  isVisible: boolean;
  onClose: () => void;
  onAddMember: (userId: number) => Promise<void> | void;
}

const AddMemberModal: React.FC<AddMemberModalProps> = ({ isVisible, onClose, onAddMember }) => {
  const [userIdInput, setUserIdInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleAddMember = async () => {
    const trimmed = userIdInput.trim();
    const userIdNum = Number(trimmed);

    // Validate: phải là số nguyên dương
    if (!trimmed || !Number.isFinite(userIdNum) || !Number.isInteger(userIdNum) || userIdNum <= 0) {
      message.error("User ID không hợp lệ");
      return;
    }

    try {
      setSubmitting(true);
      await onAddMember(userIdNum);        // <-- truyền number
      message.success("Đã thêm thành viên!");
      setUserIdInput("");
      onClose();
    } catch (e: any) {
      message.error(e?.message || "Không thể thêm thành viên");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="Thêm Thành Viên"
      open={isVisible}               
      onCancel={() => {
        if (!submitting) onClose();
      }}
      onOk={handleAddMember}
      okButtonProps={{ loading: submitting, disabled: submitting }}
      destroyOnClose
      maskClosable={!submitting}
    >
      <Input
        value={userIdInput}
        onChange={(e) => setUserIdInput(e.target.value)}
        placeholder="Nhập User ID"
        inputMode="numeric"
      />
    </Modal>
  );
};

export default AddMemberModal;
