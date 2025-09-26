import React from 'react';
import { Button, message, Space } from 'antd';

interface MessageNotiProps {
  onAction?: (
    showMessage: (
      type: 'success' | 'error' | 'warning',
      content: string
    ) => void
  ) => void;
}

const MessageNoti: React.FC<MessageNotiProps> = ({ onAction }) => {
  const [messageApi, contextHolder] = message.useMessage();

  const showMessage = (
    type: 'success' | 'error' | 'warning',
    content: string
  ) => {
    messageApi.open({
      type,
      content,
    });
  };

  const handleAdd = () => {
    if (onAction) {
      onAction(showMessage);
    } else {
      showMessage('success', 'Item added successfully');
    }
  };

  const handleDelete = () => {
    if (onAction) {
      onAction(showMessage);
    } else {
      showMessage('error', 'Item deleted');
    }
  };

  console.log('dat da o day');
  return (
    <>
      {contextHolder}
      <Space>
        <Button onClick={handleAdd}>Add Item</Button>
        <Button onClick={handleDelete}>Delete Item</Button>
      </Space>
    </>
  );
};

export default MessageNoti;
