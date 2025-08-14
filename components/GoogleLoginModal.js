/**
 * Google登录弹窗组件 - 功能组件
 * 处理Google登录逻辑
 */
import React, { useState } from 'react';
import { useAuth } from './AuthContext';

const GoogleLoginModal = ({ isOpen, onClose, onSuccess }) => {
  const { handleGoogleLogin, isLoading } = useAuth();
  const [error, setError] = useState('');

  const handleLogin = async () => {
    try {
      setError('');
      
      // 使用Google Identity Services
      if (window.google) {
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // 如果自动弹窗失败，显示手动登录按钮
            showManualLogin();
          }
        });
      } else {
        setError('Google登录服务未加载');
      }
    } catch (error) {
      setError('登录失败，请重试');
    }
  };

  const showManualLogin = () => {
    if (window.google) {
      window.google.accounts.id.renderButton(
        document.getElementById('google-login-button'),
        {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          width: 300
        }
      );
    }
  };

  // 处理Google登录回调
  const handleCredentialResponse = async (response) => {
    try {
      // 解析JWT token
      const payload = JSON.parse(atob(response.credential.split('.')[1]));
      
      const result = await handleGoogleLogin({
        sub: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture
      });

      if (result.success) {
        onSuccess && onSuccess(result.user);
        onClose();
      } else {
        setError(result.error || '登录失败');
      }
    } catch (error) {
      setError('登录处理失败');
    }
  };

  // 初始化Google登录
  React.useEffect(() => {
    if (isOpen && window.google) {
      window.google.accounts.id.initialize({
        client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>登录领取20积分</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="login-benefits">
            <div className="benefit-item">
              <span className="benefit-icon">⚡</span>
              <span>首次登录获得20积分</span>
            </div>
            <div className="benefit-item">
              <span className="benefit-icon">🎨</span>
              <span>每次生图消耗10积分</span>
            </div>
            <div className="benefit-item">
              <span className="benefit-icon">💎</span>
              <span>订阅获得更多积分</span>
            </div>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="login-actions">
            <div id="google-login-button"></div>
            <button 
              className="google-login-btn"
              onClick={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? '登录中...' : '使用Google登录'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoogleLoginModal;