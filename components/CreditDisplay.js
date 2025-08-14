/**
 * 积分显示组件 - 单一功能组件
 * 显示用户积分余额
 */
import React from 'react';
import { useAuth } from './AuthContext';

const CreditDisplay = ({ className = '' }) => {
  const { credits, isLoggedIn } = useAuth();

  return (
    <div className={`credit-display ${className}`}>
      <div className="credit-info">
        <span className="credit-icon">⚡</span>
        <span className="credit-amount">{credits}</span>
        <span className="credit-label">积分</span>
      </div>
      {!isLoggedIn && (
        <div className="credit-hint">
          <small>登录后可领取</small>
        </div>
      )}
    </div>
  );
};

export default CreditDisplay;