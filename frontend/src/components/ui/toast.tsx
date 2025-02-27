import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  let bgColor = 'bg-green-500';
  if (type === 'error') bgColor = 'bg-red-500';
  else if (type === 'info') bgColor = 'bg-blue-500';

  return (
    <div className={`fixed top-5 right-5 ${bgColor} text-white px-4 py-2 rounded shadow-lg z-50`}>
      {message}
    </div>
  );
};

export default Toast;
