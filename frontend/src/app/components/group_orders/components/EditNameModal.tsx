import React, { useState } from "react";
import { Modal, Input, message } from "antd";

interface EditNameModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: (newName: string) => void;
  defaultName: string;
}

const EditNameModal: React.FC<EditNameModalProps> = ({ isVisible, onClose, onSave, defaultName }) => {
  const [newName, setNewName] = useState(defaultName);

  const handleSave = () => {
    if (newName) {
      onSave(newName); // Gọi phương thức onSave từ component cha
    } else {
      message.error("Tên nhóm không thể trống");
    }
  };

  return (
    <Modal
      title="Sửa Tên Nhóm"
      visible={isVisible} // Hiển thị modal khi isVisible là true
      onCancel={onClose} // Đóng modal khi click ngoài
      onOk={handleSave} // Lưu khi bấm nút "OK"
    >
    <Input
    value={newName}
    onChange={(e) => setNewName(e.target.value)}
    placeholder="Nhập tên nhóm mới"
    />
    </Modal>
  );
};

export default EditNameModal;
