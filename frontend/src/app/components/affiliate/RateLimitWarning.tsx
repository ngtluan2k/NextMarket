import React, { useState, useEffect } from 'react';
import { Alert, Progress } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';

interface RateLimitWarningProps {
  currentRequests?: number;
  maxRequests?: number;
  windowSeconds?: number;
}


export const RateLimitWarning: React.FC<RateLimitWarningProps> = ({
  currentRequests = 0,
  maxRequests = 5,
  windowSeconds = 60,
}) => {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isLimited, setIsLimited] = useState(false);

  const percentage = Math.round((currentRequests / maxRequests) * 100);
  const isNearLimit = percentage >= 80; 
  const isAtLimit = currentRequests >= maxRequests;

  useEffect(() => {
    if (isAtLimit) {
      setIsLimited(true);
      setTimeRemaining(windowSeconds);
      
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsLimited(false);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isAtLimit, windowSeconds]);

  if (isLimited) {
    return (
      <Alert
        message="Đã đạt giới hạn tạo liên kết"
        description={`Bạn có thể tạo liên kết mới sau ${timeRemaining} giây`}
        type="error"
        icon={<ClockCircleOutlined />}
        showIcon
        style={{ marginBottom: 16 }}
      />
    );
  }

  if (isNearLimit) {
    return (
      <Alert
        message={`Sắp đạt giới hạn (${currentRequests}/${maxRequests})`}
        description={`Bạn có thể tạo thêm ${maxRequests - currentRequests} liên kết trong ${windowSeconds} giây tới`}
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
        action={
          <Progress
            percent={percentage}
            size="small"
            status={percentage >= 100 ? 'exception' : 'active'}
            style={{ width: 100 }}
          />
        }
      />
    );
  }

  return null;
};

export default RateLimitWarning;
