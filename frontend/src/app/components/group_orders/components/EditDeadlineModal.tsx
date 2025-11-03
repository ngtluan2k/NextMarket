import React, { useState } from "react";
import { Modal, DatePicker, message } from "antd";
import dayjs from "dayjs";

interface EditDeadlineModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: (newDeadline: string) => void;
  defaultDeadline: string | null;
}

const EditDeadlineModal: React.FC<EditDeadlineModalProps> = ({
  isVisible,
  onClose,
  onSave,
  defaultDeadline,
}) => {
  const [newDeadline, setNewDeadline] = useState(
    defaultDeadline ? dayjs(defaultDeadline) : null
  );

 
  const disabledDate = (current: dayjs.Dayjs) => {
    return current && current < dayjs().startOf('day'); 
  };

  const handleSave = () => {
    if (newDeadline) {

      const currentTime = dayjs();
      if (newDeadline.isBefore(currentTime, 'minute')) {
        message.error("Thời hạn không thể chọn trong quá khứ!");
        return;
      }

      onSave(newDeadline.format("YYYY-MM-DD HH:mm:ss")); 
    } else {
      message.error("Thời hạn không hợp lệ");
    }
  };

  return (
    <Modal
      title="Sửa Hạn Cuối"
      visible={isVisible}
      onCancel={onClose} 
      onOk={handleSave}
    >
      <DatePicker
        showTime
        value={newDeadline}
        format="YYYY-MM-DD HH:mm:ss"
        onChange={(date) => setNewDeadline(date)}
        placeholder="Chọn thời hạn"
        style={{ width: "100%" }}
        disabledDate={disabledDate} 
      />
    </Modal>
  );
};

export default EditDeadlineModal;
