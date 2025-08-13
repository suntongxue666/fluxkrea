/**
 * 订阅功能完整流程测试脚本
 * 此脚本测试从用户登录到订阅完成的整个流程
 */

// 测试配置
const TEST_CONFIG = {
  // 测试环境
  environment: 'development', // 'development' 或 'production'
  
  // API端点
  apiEndpoints: {
    subscription: '/api/simple-paypal-subscription',
    handleSubscription: '/api/handle-subscription'
  },
  
  // 测试用户
  testUser: {
    email: 'test@example.com',
    password: 'testpassword123'
  },
  
  // 测试订阅计划
  testPlan: 'pro',
  
  // 测试超时（毫秒）
  timeout: 30000
};

// 测试状态
const TEST_STATE = {
  user: null,
  subscriptionId: null,
  approvalUrl: null,
  testResults: {
    login: false,
    createSubscription: false,
    handleSubscription: false,
    verifySubscription: false
  }
};

/**
 * 初始化测试环境
 */
function initTestEnvironment() {
  console.log('🚀 初始化测试环境...');
  
  // 设置测试环境变量
  if (typeof process !== 'undefined' && process.env) {
    process.env.NODE_ENV = TEST_CONFIG.environment;
    process.env.TEST_MODE = 'true';
  }
  
  // 在浏览器环境中设置localStorage标志
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('test_mode', 'true');
  }
  
  console.log(`✅ 测试环境已设置为: ${TEST_CONFIG.environment}`);
}

/**
 * 测试Supabase连接
 */
async function testSupabaseConnection() {
  console.log('🧪 测试Supabase连接...');
  
  try {
    // 检查是否有Supabase客户端
    let supabase;
    
    if (typeof window !== 'undefined' && window.supabase) {
      supabase = window.supabase;
      console.log('✅ 使用全局Supabase客户端');
    } else if (typeof supabaseClient !== 'undefined') {
      supabase = supabaseClient;
      console.log('✅ 使用导入的Supabase客户端');
    } else {
      console.error('❌ 未找到Supabase客户端');
      return false;
    }
    
    // 测试连接
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    
    if (error) {
      console.error('❌ Supabase连接测试失败:', error);
      return false;
    }
    
    console.log('✅ Supabase连接测试成功');
    return true;
  } catch (error) {
    console.error('❌ 测试Supabase连接时发生错误:', error);
    return false;
  }
}

/**
 * 测试用户登录
 */
async function testUserLogin() {
  console.log('🧪 测试用户登录...');
  
  try {
    // 检查是否有Supabase客户端
    let supabase;
    
    if (typeof window !== 'undefined' && window.supabase) {
      supabase = window.supabase;
    } else if (typeof supabaseClient !== 'undefined') {
      supabase = supabaseClient;
    } else {
      console.error('❌ 未找到Supabase客户端');
      return false;
    }
    
    // 尝试登录
    const { data: user, error } = await supabase.auth.signInWithPassword({
      email: TEST_CONFIG.testUser.email,
      password: TEST_CONFIG.testUser.password
    });
    
    if (error) {
      console.error('❌ 用户登录失败:', error);
      
      // 尝试注册
      console.log('🔄 尝试注册测试用户...');
      
      const { data: newUser, error: signUpError } = await supabase.auth.signUp({
        email: TEST_CONFIG.testUser.email,
        password: TEST_CONFIG.testUser.password
      });
      
      if (signUpError) {
        console.error('❌ 用户注册失败:', signUpError);
        return false;
      }
      
      console.log('✅ 测试用户注册成功');
      TEST_STATE.user = newUser.user;
    } else {
      console.log('✅ 用户登录成功');
      TEST_STATE.user = user.user;
    }
    
    // 保存测试结果
    TEST_STATE.testResults.login = true;
    
    return true;
  } catch (error) {
    console.error('❌ 测试用户登录时发生错误:', error);
    return false;
  }
}

/**
 * 测试创建订阅
 */
async function testCreateSubscription() {
  console.log('🧪 测试创建订阅...');
  
  try {
    // 检查用户是否已登录
    if (!TEST_STATE.user) {
      console.error('❌ 用户未登录，无法创建订阅');
      return false;
    }
    
    // 准备订阅参数
    const subscriptionParams = {
      planType: TEST_CONFIG.testPlan,
      user_id: TEST_STATE.user.id,
      email: TEST_STATE.user.email
    };
    
    console.log('📝 订阅参数:', subscriptionParams);
    
    // 调用订阅API
    const response = await fetch(TEST_CONFIG.apiEndpoints.subscription, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(subscriptionParams)
    });
    
    // 检查响应状态
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ 创建订阅失败: ${response.status} ${response.statusText}`, errorText);
      return false;
    }
    
    // 解析响应
    const responseData = await response.json();
    console.log('📝 API响应:', responseData);
    
    if (!responseData.success || !responseData.id) {
      console.error('❌ 创建订阅失败:', responseData.message || '未知错误');
      return false;
    }
    
    // 保存订阅ID和批准URL
    TEST_STATE.subscriptionId = responseData.id;
    
    // 查找批准链接
    const approveLink = responseData.links.find(link => link.rel === 'approve');
    if (approveLink) {
      TEST_STATE.approvalUrl = approveLink.href;
      console.log('🔗 PayPal批准链接:', TEST_STATE.approvalUrl);
    } else {
      console.error('❌ 未找到PayPal批准链接');
      return false;
    }
    
    // 保存测试结果
    TEST_STATE.testResults.createSubscription = true;
    
    console.log('✅ 成功创建订阅ID:', TEST_STATE.subscriptionId);
    return true;
  } catch (error) {
    console.error('❌ 测试创建订阅时发生错误:', error);
    return false;
  }
}

/**
 * 测试处理订阅
 */
async function testHandleSubscription() {
  console.log('🧪 测试处理订阅...');
  
  try {
    // 检查订阅ID是否存在
    if (!TEST_STATE.subscriptionId) {
      console.error('❌ 订阅ID不存在，无法处理订阅');
      return false;
    }
    
    // 准备处理参数
    const handleParams = {
      subscription_id: TEST_STATE.subscriptionId,
      user_id: TEST_STATE.user.id,
      status: 'APPROVED'
    };
    
    console.log('📝 处理参数:', handleParams);
    
    // 调用处理API
    const response = await fetch(TEST_CONFIG.apiEndpoints.handleSubscription, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(handleParams)
    });
    
    // 检查响应状态
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ 处理订阅失败: ${response.status} ${response.statusText}`, errorText);
      return false;
    }
    
    // 解析响应
    const responseData = await response.json();
    console.log('📝 API响应:', responseData);
    
    if (!responseData.success) {
      console.error('❌ 处理订阅失败:', responseData.message || '未知错误');
      return false;
    }
    
    // 保存测试结果
    TEST_STATE.testResults.handleSubscription = true;
    
    console.log('✅ 成功处理订阅');
    return true;
  } catch (error) {
    console.error('❌ 测试处理订阅时发生错误:', error);
    return false;
  }
}

/**
 * 测试验证订阅状态
 */
async function testVerifySubscription() {
  console.log('🧪 测试验证订阅状态...');
  
  try {
    // 检查用户是否已登录
    if (!TEST_STATE.user) {
      console.error('❌ 用户未登录，无法验证订阅');
      return false;
    }
    
    // 检查是否有Supabase客户端
    let supabase;
    
    if (typeof window !== 'undefined' && window.supabase) {
      supabase = window.supabase;
    } else if (typeof supabaseClient !== 'undefined') {
      supabase = supabaseClient;
    } else {
      console.error('❌ 未找到Supabase客户端');
      return false;
    }
    
    // 查询用户订阅状态
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', TEST_STATE.user.id)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (error) {
      console.error('❌ 查询订阅状态失败:', error);
      return false;
    }
    
    if (!data || data.length === 0) {
      console.error('❌ 未找到用户订阅记录');
      return false;
    }
    
    // 检查订阅状态
    const subscription = data[0];
    console.log('📝 订阅记录:', subscription);
    
    if (subscription.status !== 'active') {
      console.error(`❌ 订阅状态不是active: ${subscription.status}`);
      return false;
    }
    
    // 保存测试结果
    TEST_STATE.testResults.verifySubscription = true;
    
    console.log('✅ 订阅状态验证成功');
    return true;
  } catch (error) {
    console.error('❌ 测试验证订阅状态时发生错误:', error);
    return false;
  }
}

/**
 * 生成测试报告
 */
function generateTestReport() {
  console.log('\n📊 订阅功能测试报告');
  console.log('====================');
  
  // 测试结果摘要
  console.log('📝 测试结果摘要:');
  console.log(`- 用户登录: ${TEST_STATE.testResults.login ? '✅ 通过' : '❌ 失败'}`);
  console.log(`- 创建订阅: ${TEST_STATE.testResults.createSubscription ? '✅ 通过' : '❌ 失败'}`);
  console.log(`- 处理订阅: ${TEST_STATE.testResults.handleSubscription ? '✅ 通过' : '❌ 失败'}`);
  console.log(`- 验证订阅: ${TEST_STATE.testResults.verifySubscription ? '✅ 通过' : '❌ 失败'}`);
  
  // 计算总体结果
  const totalTests = Object.keys(TEST_STATE.testResults).length;
  const passedTests = Object.values(TEST_STATE.testResults).filter(result => result).length;
  const successRate = Math.round((passedTests / totalTests) * 100);
  
  console.log('\n📊 总体结果:');
  console.log(`- 测试总数: ${totalTests}`);
  console.log(`- 通过测试: ${passedTests}`);
  console.log(`- 失败测试: ${totalTests - passedTests}`);
  console.log(`- 成功率: ${successRate}%`);
  
  // 测试详情
  console.log('\n📝 测试详情:');
  console.log(`- 测试环境: ${TEST_CONFIG.environment}`);
  console.log(`- 测试用户: ${TEST_CONFIG.testUser.email}`);
  console.log(`- 测试计划: ${TEST_CONFIG.testPlan}`);
  
  if (TEST_STATE.user) {
    console.log(`- 用户ID: ${TEST_STATE.user.id}`);
  }
  
  if (TEST_STATE.subscriptionId) {
    console.log(`- 订阅ID: ${TEST_STATE.subscriptionId}`);
  }
  
  if (TEST_STATE.approvalUrl) {
    console.log(`- 批准URL: ${TEST_STATE.approvalUrl}`);
  }
  
  // 建议
  console.log('\n💡 建议:');
  
  if (!TEST_STATE.testResults.login) {
    console.log('- 检查用户认证系统，确保登录功能正常工作');
  }
  
  if (!TEST_STATE.testResults.createSubscription) {
    console.log('- 检查PayPal API凭证和订阅API实现');
  }
  
  if (!TEST_STATE.testResults.handleSubscription) {
    console.log('- 检查订阅处理API实现和数据库操作');
  }
  
  if (!TEST_STATE.testResults.verifySubscription) {
    console.log('- 检查订阅记录是否正确保存到数据库');
  }
  
  if (successRate === 100) {
    console.log('- 所有测试通过，订阅功能工作正常');
  } else if (successRate >= 75) {
    console.log('- 大部分测试通过，但仍有一些问题需要解决');
  } else if (successRate >= 50) {
    console.log('- 只有一半测试通过，需要进一步调查问题');
  } else {
    console.log('- 大多数测试失败，订阅功能存在严重问题，需要全面检查');
  }
  
  console.log('\n====================');
}

/**
 * 运行所有测试
 */
async function runAllTests() {
  console.log('🚀 开始订阅功能完整流程测试...');
  
  // 初始化测试环境
  initTestEnvironment();
  
  // 设置测试超时
  const testTimeout = setTimeout(() => {
    console.error('❌ 测试超时，未能在指定时间内完成');
    generateTestReport();
  }, TEST_CONFIG.timeout);
  
  try {
    // 测试Supabase连接
    await testSupabaseConnection();
    
    // 测试用户登录
    const loginSuccess = await testUserLogin();
    if (!loginSuccess) {
      console.error('❌ 用户登录测试失败，中止后续测试');
      clearTimeout(testTimeout);
      generateTestReport();
      return;
    }
    
    // 测试创建订阅
    const createSuccess = await testCreateSubscription();
    if (!createSuccess) {
      console.error('❌ 创建订阅测试失败，中止后续测试');
      clearTimeout(testTimeout);
      generateTestReport();
      return;
    }
    
    // 测试处理订阅
    const handleSuccess = await testHandleSubscription();
    if (!handleSuccess) {
      console.error('❌ 处理订阅测试失败，中止后续测试');
      clearTimeout(testTimeout);
      generateTestReport();
      return;
    }
    
    // 测试验证订阅状态
    await testVerifySubscription();
    
    // 清除超时
    clearTimeout(testTimeout);
    
    // 生成测试报告
    generateTestReport();
    
    console.log('✅ 订阅功能完整流程测试完成');
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
    clearTimeout(testTimeout);
    generateTestReport();
  }
}

/**
 * 主函数
 */
async function main() {
  // 运行所有测试
  await runAllTests();
}

// 如果在Node.js环境中，导出函数
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    TEST_CONFIG,
    TEST_STATE,
    testSupabaseConnection,
    testUserLogin,
    testCreateSubscription,
    testHandleSubscription,
    testVerifySubscription,
    generateTestReport,
    runAllTests,
    main
  };
  
  // 如果直接运行脚本，执行主函数
  if (require.main === module) {
    main().catch(error => {
      console.error('❌ 主函数执行过程中发生错误:', error);
      process.exit(1);
    });
  }
} else if (typeof window !== 'undefined') {
  // 如果在浏览器环境中，添加到全局对象
  window.subscriptionTester = {
    TEST_CONFIG,
    TEST_STATE,
    testSupabaseConnection,
    testUserLogin,
    testCreateSubscription,
    testHandleSubscription,
    testVerifySubscription,
    generateTestReport,
    runAllTests,
    main
  };
}