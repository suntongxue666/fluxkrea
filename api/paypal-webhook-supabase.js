// PayPal Webhook处理器 - 直接使用Supabase
const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const SUPABASE_URL = 'https://gdcjvqaqgvcxzufmessy.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'your_service_key_here';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// PayPal配置
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_ENVIRONMENT = process.env.PAYPAL_ENVIRONMENT || 'sandbox';

// 计划详情
const PLAN_DETAILS = {
  'P-5ML4271244454362WXNWU5NI': { name: 'Pro Plan', credits: 1000, price: 9.99 },
  'P-3NJ78684DS796242VNCJBKQQ': { name: 'Max Plan', credits: 5000, price: 19.99 }
};

/**
 * 处理订阅激活事件
 */
async function handleSubscriptionActivated(eventData) {
  const subscription = eventData.resource;
  console.log('Processing subscription activation:', subscription.id);
  
  try {
    const planId = subscription.plan_id;
    const planDetails = PLAN_DETAILS[planId];
    const userId = subscription.custom_id;
    
    if (!planDetails) {
      throw new Error(`Unknown plan ID: ${planId}`);
    }
    
    if (!userId) {
      throw new Error('No user ID found in subscription');
    }
    
    console.log('Plan details:', planDetails);
    console.log('User ID:', userId);
    
    // 1. 保存订阅记录
    const { data: subscriptionRecord, error: subError } = await supabase
      .from('subscriptions')
      .insert({
        user_uuid: userId,
        paypal_subscription_id: subscription.id,
        paypal_plan_id: planId,
        plan_name: planDetails.name,
        status: 'ACTIVE',
        credits_per_month: planDetails.credits,
        price: planDetails.price,
        currency: 'USD',
        billing_cycle: 'monthly',
        start_date: new Date().toISOString(),
        next_billing_date: subscription.billing_info?.next_billing_time || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single();
    
    if (subError) {
      console.error('Error saving subscription:', subError);
      throw subError;
    }
    
    console.log('Subscription saved:', subscriptionRecord);
    
    // 2. 获取当前用户积分
    const { data: user, error: getUserError } = await supabase
      .from('users')
      .select('credits')
      .eq('uuid', userId)
      .single();
    
    if (getUserError) {
      console.error('Error fetching user:', getUserError);
      throw getUserError;
    }
    
    const currentCredits = user.credits || 0;
    const newCredits = currentCredits + planDetails.credits;
    
    // 3. 更新用户积分和订阅状态
    const { error: updateError } = await supabase
      .from('users')
      .update({
        credits: newCredits,
        subscription_status: 'ACTIVE',
        current_subscription_id: subscriptionRecord.id,
        subscription_credits_remaining: planDetails.credits,
        subscription_renewal_date: subscriptionRecord.next_billing_date,
        updated_at: new Date().toISOString()
      })
      .eq('uuid', userId);
    
    if (updateError) {
      console.error('Error updating user:', updateError);
      throw updateError;
    }
    
    // 4. 记录积分交易
    const { error: transError } = await supabase
      .from('credit_transactions')
      .insert({
        user_uuid: userId,
        transaction_type: 'SUBSCRIPTION_PURCHASE',
        amount: planDetails.credits,
        balance_after: newCredits,
        description: `${planDetails.name}订阅激活 - 获得${planDetails.credits}积分`,
        source: 'paypal_subscription',
        reference_id: subscription.id,
        subscription_id: subscriptionRecord.id
      });
    
    if (transError) {
      console.error('Error recording transaction:', transError);
      // 不抛出错误，因为积分已经更新成功
    }
    
    // 5. 保存支付记录
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        subscription_id: subscriptionRecord.id,
        user_uuid: userId,
        paypal_payment_id: subscription.id,
        amount: planDetails.price,
        currency: 'USD',
        status: 'COMPLETED',
        credits_awarded: planDetails.credits,
        paid_at: new Date().toISOString()
      });
    
    if (paymentError) {
      console.error('Error saving payment record:', paymentError);
      // 不抛出错误，因为主要功能已完成
    }
    
    console.log(`✅ Subscription activated successfully! User ${userId} received ${planDetails.credits} credits.`);
    
    return {
      status: 'success',
      message: 'Subscription activated and credits awarded',
      user_id: userId,
      credits_added: planDetails.credits,
      new_balance: newCredits
    };
    
  } catch (error) {
    console.error('Error processing subscription activation:', error);
    return {
      status: 'error',
      message: error.message,
      subscription_id: subscription.id
    };
  }
}

/**
 * 主要的Webhook处理函数
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body;
    console.log('PayPal webhook received:', body.event_type);

    let result;

    switch (body.event_type) {
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
        result = await handleSubscriptionActivated(body);
        break;
        
      case 'BILLING.SUBSCRIPTION.CREATED':
        console.log('Subscription created:', body.resource.id);
        result = { status: 'acknowledged', message: 'Subscription created, waiting for activation' };
        break;
        
      default:
        console.log('Unhandled event type:', body.event_type);
        result = { status: 'ignored', message: 'Event type not handled' };
    }

    res.status(200).json({
      received: true,
      event_type: body.event_type,
      ...result
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({
      error: 'Webhook processing failed',
      message: error.message
    });
  }
}

// 如果在Node.js环境中直接运行
if (require.main === module) {
  console.log('PayPal Webhook handler ready');
  console.log('Supported events: BILLING.SUBSCRIPTION.ACTIVATED, BILLING.SUBSCRIPTION.CREATED');
}