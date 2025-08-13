/**
 * 修复订阅功能问题的脚本
 * 此脚本用于修复前端订阅相关的常见问题
 */

// 导入统一状态同步模块（如果可用）
let unifiedStateSync;
try {
  if (typeof require !== 'undefined') {
    unifiedStateSync = require('./public/js/modules/unified-state-sync.js');
  } else if (typeof import !== 'undefined') {
    import('./public/js/modules/unified-state-sync.js').then(module => {
      unifiedStateSync = module.default || module;
    });
  } else {
    console.warn('⚠️ 无法导入统一状态同步模块，将使用内联版本');
    // 内联版本的状态同步功能
    unifiedStateSync = {
      getCurrentUser: async () => {
        // 尝试从localStorage获取用户信息
        try {
          const userStr = localStorage.getItem('supabase.auth.token');
          if (userStr) {
            const userData = JSON.parse(userStr);
            return userData.currentSession?.user || null;
          }
        } catch (e) {
          console.error('获取用户信息失败:', e);
        }
        return null;
      },
      
      checkSubscriptionStatus: async (userId) => {
        console.log('检查用户订阅状态:', userId);
        // 这里应该实现实际的订阅检查逻辑
        return { active: false, plan: null, expiresAt: null };
      }
    };
  }
} catch (e) {
  console.error('导入统一状态同步模块失败:', e);
}

/**
 * 修复本地存储中的用户数据
 */
function fixLocalStorageUserData() {
  console.log('🔧 修复本地存储中的用户数据...');
  
  try {
    // 检查Supabase认证令牌
    const authToken = localStorage.getItem('supabase.auth.token');
    if (!authToken) {
      console.log('⚠️ 未找到Supabase认证令牌，用户可能未登录');
      return false;
    }
    
    // 解析令牌
    let tokenData;
    try {
      tokenData = JSON.parse(authToken);
      console.log('✅ 成功解析认证令牌');
    } catch (e) {
      console.error('❌ 解析认证令牌失败:', e);
      return false;
    }
    
    // 检查令牌结构
    if (!tokenData.currentSession || !tokenData.currentSession.user) {
      console.log('⚠️ 认证令牌结构不完整，缺少用户信息');
      return false;
    }
    
    const user = tokenData.currentSession.user;
    console.log('📝 用户ID:', user.id);
    console.log('📝 用户邮箱:', user.email);
    
    // 确保用户元数据存在
    if (!user.user_metadata) {
      user.user_metadata = {};
      console.log('✅ 已添加缺失的用户元数据对象');
    }
    
    // 保存回本地存储
    localStorage.setItem('supabase.auth.token', JSON.stringify(tokenData));
    console.log('✅ 已更新本地存储中的用户数据');
    
    return true;
  } catch (error) {
    console.error('❌ 修复本地存储中的用户数据时发生错误:', error);
    return false;
  }
}

/**
 * 修复订阅状态缓存
 */
function fixSubscriptionCache() {
  console.log('🔧 修复订阅状态缓存...');
  
  try {
    // 清除可能损坏的缓存
    localStorage.removeItem('subscription_status');
    localStorage.removeItem('subscription_check_time');
    console.log('✅ 已清除订阅状态缓存');
    
    return true;
  } catch (error) {
    console.error('❌ 修复订阅状态缓存时发生错误:', error);
    return false;
  }
}

/**
 * 修复订阅UI元素
 */
function fixSubscriptionUI() {
  console.log('🔧 修复订阅UI元素...');
  
  try {
    // 查找所有订阅相关的UI元素
    const subscriptionButtons = document.querySelectorAll('[data-subscription-action]');
    console.log(`📝 找到 ${subscriptionButtons.length} 个订阅按钮`);
    
    // 重新绑定事件处理程序
    subscriptionButtons.forEach(button => {
      const action = button.getAttribute('data-subscription-action');
      console.log(`📝 重新绑定按钮事件: ${action}`);
      
      // 移除旧的事件监听器
      button.replaceWith(button.cloneNode(true));
      
      // 获取新的按钮引用
      const newButton = document.querySelector(`[data-subscription-action="${action}"]`);
      if (newButton) {
        // 添加新的事件监听器
        newButton.addEventListener('click', async (e) => {
          e.preventDefault();
          console.log(`🖱️ 订阅按钮点击: ${action}`);
          
          // 根据操作类型执行不同的操作
          switch (action) {
            case 'subscribe':
              window.location.href = '/pricing.html';
              break;
            case 'manage':
              // 实现订阅管理逻辑
              alert('订阅管理功能即将推出');
              break;
            default:
              console.warn(`⚠️ 未知的订阅操作: ${action}`);
          }
        });
        
        console.log(`✅ 已重新绑定按钮事件: ${action}`);
      }
    });
    
    // 更新订阅状态显示
    const subscriptionStatusElements = document.querySelectorAll('[data-subscription-status]');
    console.log(`📝 找到 ${subscriptionStatusElements.length} 个订阅状态元素`);
    
    subscriptionStatusElements.forEach(element => {
      // 临时显示加载状态
      element.textContent = '正在检查订阅状态...';
      element.classList.add('loading');
    });
    
    // 异步更新订阅状态
    setTimeout(async () => {
      try {
        // 获取当前用户
        const user = await unifiedStateSync?.getCurrentUser();
        
        if (user) {
          // 检查订阅状态
          const subscriptionStatus = await unifiedStateSync?.checkSubscriptionStatus(user.id);
          
          // 更新UI
          subscriptionStatusElements.forEach(element => {
            element.classList.remove('loading');
            
            if (subscriptionStatus && subscriptionStatus.active) {
              element.textContent = `已订阅 ${subscriptionStatus.plan || 'Pro'} 计划`;
              element.classList.add('active');
              element.classList.remove('inactive');
            } else {
              element.textContent = '未订阅';
              element.classList.add('inactive');
              element.classList.remove('active');
            }
          });
          
          console.log('✅ 已更新订阅状态显示');
        } else {
          // 用户未登录
          subscriptionStatusElements.forEach(element => {
            element.textContent = '请登录以查看订阅状态';
            element.classList.remove('loading');
          });
        }
      } catch (error) {
        console.error('❌ 更新订阅状态显示时发生错误:', error);
        
        // 显示错误状态
        subscriptionStatusElements.forEach(element => {
          element.textContent = '无法加载订阅状态';
          element.classList.remove('loading');
          element.classList.add('error');
        });
      }
    }, 1000);
    
    return true;
  } catch (error) {
    console.error('❌ 修复订阅UI元素时发生错误:', error);
    return false;
  }
}

/**
 * 修复PayPal按钮集成
 */
function fixPayPalButtons() {
  console.log('🔧 修复PayPal按钮集成...');
  
  try {
    // 查找所有PayPal按钮容器
    const paypalButtonContainers = document.querySelectorAll('[data-paypal-button]');
    console.log(`📝 找到 ${paypalButtonContainers.length} 个PayPal按钮容器`);
    
    if (paypalButtonContainers.length === 0) {
      console.log('⚠️ 未找到PayPal按钮容器，可能不在订阅页面');
      return false;
    }
    
    // 检查PayPal SDK是否已加载
    if (!window.paypal) {
      console.log('⚠️ PayPal SDK未加载，尝试加载...');
      
      // 创建脚本元素
      const script = document.createElement('script');
      script.src = 'https://www.paypal.com/sdk/js?client-id=AeiqNbUf4z7-oudEQf2oSL3-rf_xP_dHmED4pvoei4B2eH8TdPK2ajLWXiQSy78Uh3ekjxx14wZEsX-8&vault=true&intent=subscription';
      script.dataset.sdkIntegrationSource = 'button-factory';
      
      // 添加加载事件监听器
      script.addEventListener('load', () => {
        console.log('✅ PayPal SDK已加载，正在渲染按钮...');
        renderPayPalButtons();
      });
      
      // 添加错误事件监听器
      script.addEventListener('error', () => {
        console.error('❌ PayPal SDK加载失败');
      });
      
      // 添加到文档
      document.body.appendChild(script);
    } else {
      console.log('✅ PayPal SDK已加载，正在渲染按钮...');
      renderPayPalButtons();
    }
    
    return true;
  } catch (error) {
    console.error('❌ 修复PayPal按钮集成时发生错误:', error);
    return false;
  }
}

/**
 * 渲染PayPal按钮
 */
function renderPayPalButtons() {
  try {
    // 查找所有PayPal按钮容器
    const paypalButtonContainers = document.querySelectorAll('[data-paypal-button]');
    
    // 为每个容器渲染按钮
    paypalButtonContainers.forEach(container => {
      const planType = container.getAttribute('data-plan-type') || 'pro';
      console.log(`📝 为计划类型 ${planType} 渲染PayPal按钮`);
      
      // 清空容器
      container.innerHTML = '';
      
      // 渲染按钮
      window.paypal.Buttons({
        style: {
          shape: 'rect',
          color: 'gold',
          layout: 'vertical',
          label: 'subscribe'
        },
        createSubscription: async function(data, actions) {
          console.log('🔄 创建订阅...');
          
          try {
            // 获取当前用户
            const user = await unifiedStateSync?.getCurrentUser();
            
            if (!user) {
              console.error('❌ 用户未登录，无法创建订阅');
              alert('请先登录再订阅');
              return;
            }
            
            // 准备订阅参数
            const subscriptionParams = {
              planType: planType,
              user_id: user.id,
              email: user.email
            };
            
            console.log('📝 订阅参数:', subscriptionParams);
            
            // 调用订阅API
            const response = await fetch('/api/simple-paypal-subscription', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(subscriptionParams)
            });
            
            // 解析响应
            const responseData = await response.json();
            console.log('📝 API响应:', responseData);
            
            if (!responseData.success || !responseData.id) {
              console.error('❌ 创建订阅失败:', responseData.message || '未知错误');
              alert('创建订阅失败: ' + (responseData.message || '未知错误'));
              return;
            }
            
            console.log('✅ 成功创建订阅ID:', responseData.id);
            return responseData.id;
          } catch (error) {
            console.error('❌ 创建订阅时发生错误:', error);
            alert('创建订阅时发生错误: ' + error.message);
          }
        },
        onApprove: function(data, actions) {
          console.log('✅ 订阅已批准:', data);
          
          // 显示成功消息
          alert('订阅成功! 感谢您的支持。');
          
          // 刷新页面以更新订阅状态
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        },
        onError: function(err) {
          console.error('❌ PayPal错误:', err);
          alert('订阅过程中发生错误: ' + err);
        }
      }).render(container);
      
      console.log(`✅ 已为计划类型 ${planType} 渲染PayPal按钮`);
    });
  } catch (error) {
    console.error('❌ 渲染PayPal按钮时发生错误:', error);
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 开始修复订阅功能问题...');
  
  // 修复本地存储中的用户数据
  const userDataFixed = fixLocalStorageUserData();
  console.log(userDataFixed ? '✅ 用户数据修复成功' : '⚠️ 用户数据修复失败或不需要修复');
  
  // 修复订阅状态缓存
  const subscriptionCacheFixed = fixSubscriptionCache();
  console.log(subscriptionCacheFixed ? '✅ 订阅状态缓存修复成功' : '⚠️ 订阅状态缓存修复失败');
  
  // 检查是否在浏览器环境中
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    // 等待DOM加载完成
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        // 修复订阅UI元素
        fixSubscriptionUI();
        
        // 修复PayPal按钮集成
        fixPayPalButtons();
      });
    } else {
      // DOM已加载完成
      fixSubscriptionUI();
      fixPayPalButtons();
    }
  } else {
    console.log('⚠️ 不在浏览器环境中，跳过UI修复');
  }
  
  console.log('✅ 订阅功能问题修复完成');
}

// 如果在Node.js环境中，导出函数
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    fixLocalStorageUserData,
    fixSubscriptionCache,
    fixSubscriptionUI,
    fixPayPalButtons,
    main
  };
} else if (typeof window !== 'undefined') {
  // 如果在浏览器环境中，添加到全局对象
  window.subscriptionFixer = {
    fixLocalStorageUserData,
    fixSubscriptionCache,
    fixSubscriptionUI,
    fixPayPalButtons,
    main
  };
  
  // 自动执行主函数
  main().catch(error => {
    console.error('❌ 修复过程中发生错误:', error);
  });
}