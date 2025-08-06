const crypto = require('crypto');

// PayPal webhook configuration
const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID;
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_ENVIRONMENT = process.env.PAYPAL_ENVIRONMENT || 'sandbox'; // 'sandbox' or 'live'

// PayPal API URLs
const PAYPAL_API_BASE = PAYPAL_ENVIRONMENT === 'live' 
  ? 'https://api-m.paypal.com' 
  : 'https://api-m.sandbox.paypal.com';

/**
 * Verify PayPal webhook signature
 */
async function verifyWebhookSignature(headers, body, webhookId) {
  const authAlgo = headers['paypal-auth-algo'];
  const transmission_id = headers['paypal-transmission-id'];
  const cert_id = headers['paypal-cert-id'];
  const transmission_sig = headers['paypal-transmission-sig'];
  const transmission_time = headers['paypal-transmission-time'];
  
  if (!authAlgo || !transmission_id || !cert_id || !transmission_sig || !transmission_time) {
    return false;
  }

  try {
    // Get access token
    const token = await getPayPalAccessToken();
    
    // Prepare verification payload
    const verification_payload = {
      auth_algo: authAlgo,
      cert_id: cert_id,
      transmission_id: transmission_id,
      transmission_sig: transmission_sig,
      transmission_time: transmission_time,
      webhook_id: webhookId,
      webhook_event: body
    };

    // Verify with PayPal
    const response = await fetch(`${PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(verification_payload)
    });

    const result = await response.json();
    return result.verification_status === 'SUCCESS';
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return false;
  }
}

/**
 * Get PayPal access token
 */
async function getPayPalAccessToken() {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  
  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  const data = await response.json();
  return data.access_token;
}

/**
 * Handle subscription created event
 */
async function handleSubscriptionCreated(eventData) {
  const subscription = eventData.resource;
  console.log('Subscription created:', subscription.id);
  
  try {
    // Call Flask backend to save subscription
    const response = await fetch(`${process.env.BACKEND_URL || 'http://localhost:5000'}/api/save-subscription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscriptionId: subscription.id,
        planType: subscription.plan_id === 'P-5ML4271244454362WXNWU5NI' ? 'pro' : 'max',
        userId: subscription.custom_id,
        userEmail: subscription.subscriber?.email_address,
        status: 'created'
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to save subscription: ${response.statusText}`);
    }
    
    return { status: 'processed', action: 'subscription_created' };
  } catch (error) {
    console.error('Error saving subscription:', error);
    return { status: 'error', action: 'subscription_created', error: error.message };
  }
}

/**
 * Handle subscription activated event
 */
async function handleSubscriptionActivated(eventData) {
  const subscription = eventData.resource;
  console.log('Subscription activated:', subscription.id);
  
  try {
    // Update subscription status to active
    const response = await fetch(`${process.env.BACKEND_URL || 'http://localhost:5000'}/api/update-subscription-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription_id: subscription.id,
        status: 'active'
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to activate subscription: ${response.statusText}`);
    }
    
    // Grant user premium access
    await grantUserPremiumAccess(subscription.custom_id, subscription.plan_id);
    
    return { status: 'processed', action: 'subscription_activated' };
  } catch (error) {
    console.error('Error activating subscription:', error);
    return { status: 'error', action: 'subscription_activated', error: error.message };
  }
}

/**
 * Handle subscription cancelled event
 */
async function handleSubscriptionCancelled(eventData) {
  const subscription = eventData.resource;
  console.log('Subscription cancelled:', subscription.id);
  
  try {
    // Update subscription status to cancelled
    const response = await fetch(`${process.env.BACKEND_URL || 'http://localhost:5000'}/api/update-subscription-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription_id: subscription.id,
        status: 'cancelled'
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to cancel subscription: ${response.statusText}`);
    }
    
    // Revoke user premium access (but allow to finish current billing period)
    await revokeUserPremiumAccess(subscription.custom_id, false);
    
    return { status: 'processed', action: 'subscription_cancelled' };
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return { status: 'error', action: 'subscription_cancelled', error: error.message };
  }
}

/**
 * Handle payment completed event
 */
async function handlePaymentCompleted(eventData) {
  const payment = eventData.resource;
  console.log('Payment completed:', payment.id);
  
  try {
    // If this is a subscription payment, reset user's credits
    if (payment.billing_agreement_id) {
      await resetUserCredits(payment.custom_id || payment.billing_agreement_id);
    }
    
    // Log payment for tracking
    await logPayment(payment.id, payment.amount.value, 'completed');
    
    return { status: 'processed', action: 'payment_completed' };
  } catch (error) {
    console.error('Error processing payment:', error);
    return { status: 'error', action: 'payment_completed', error: error.message };
  }
}

/**
 * Handle payment failed event
 */
async function handlePaymentFailed(eventData) {
  const payment = eventData.resource;
  console.log('Payment failed:', payment.id);
  
  try {
    // Update subscription status if this is a recurring payment failure
    if (payment.billing_agreement_id) {
      const response = await fetch(`${process.env.BACKEND_URL || 'http://localhost:5000'}/api/update-subscription-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription_id: payment.billing_agreement_id,
          status: 'payment_failed'
        })
      });
    }
    
    // Notify user of payment failure
    await notifyPaymentFailure(payment.custom_id, payment.id);
    
    return { status: 'processed', action: 'payment_failed' };
  } catch (error) {
    console.error('Error handling payment failure:', error);
    return { status: 'error', action: 'payment_failed', error: error.message };
  }
}

/**
 * Handle payment order created event
 */
async function handlePaymentOrderCreated(eventData) {
  const order = eventData.resource;
  console.log('Payment order created:', order.id);
  
  // TODO: Log order creation for tracking
  // Example: await logOrderCreation(order.id, order.purchase_units);
  
  return { status: 'processed', action: 'payment_order_created' };
}

/**
 * Handle payment order cancelled event
 */
async function handlePaymentOrderCancelled(eventData) {
  const order = eventData.resource;
  console.log('Payment order cancelled:', order.id);
  
  // TODO: Handle order cancellation
  // Example: await handleOrderCancellation(order.id);
  
  return { status: 'processed', action: 'payment_order_cancelled' };
}

/**
 * Handle payment sale refund event
 */
async function handlePaymentSaleRefund(eventData) {
  const refund = eventData.resource;
  console.log('Payment sale refunded:', refund.id);
  
  // TODO: Process refund - deduct credits or cancel subscription
  // Example: await processRefund(refund.parent_payment, refund.amount.value);
  
  return { status: 'processed', action: 'payment_sale_refunded' };
}

/**
 * Handle payment sale reversed event
 */
async function handlePaymentSaleReversed(eventData) {
  const reversal = eventData.resource;
  console.log('Payment sale reversed:', reversal.id);
  
  // TODO: Handle payment reversal - similar to refund
  // Example: await processReversal(reversal.parent_payment, reversal.amount.value);
  
  return { status: 'processed', action: 'payment_sale_reversed' };
}

/**
 * Main webhook handler
 */
export default async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const headers = req.headers;
    const body = req.body;

    // Log incoming webhook for debugging
    console.log('PayPal webhook received:', {
      event_type: body.event_type,
      summary: body.summary,
      resource_type: body.resource_type
    });

    // Verify webhook signature
    if (PAYPAL_WEBHOOK_ID) {
      const isValid = await verifyWebhookSignature(headers, body, PAYPAL_WEBHOOK_ID);
      if (!isValid) {
        console.error('Invalid webhook signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    let result;

    // Handle different event types
    switch (body.event_type) {
      case 'BILLING.SUBSCRIPTION.CREATED':
        result = await handleSubscriptionCreated(body);
        break;
        
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
        result = await handleSubscriptionActivated(body);
        break;
        
      case 'BILLING.SUBSCRIPTION.CANCELLED':
        result = await handleSubscriptionCancelled(body);
        break;
        
      case 'PAYMENT.ORDER.CREATED':
        result = await handlePaymentOrderCreated(body);
        break;
        
      case 'PAYMENT.ORDER.CANCELLED':
        result = await handlePaymentOrderCancelled(body);
        break;
        
      case 'PAYMENT.SALE.COMPLETED':
        result = await handlePaymentCompleted(body);
        break;
        
      case 'PAYMENT.SALE.REFUND':
        result = await handlePaymentSaleRefund(body);
        break;
        
      case 'PAYMENT.SALE.REVERSED':
        result = await handlePaymentSaleReversed(body);
        break;
        
      case 'PAYMENT.SALE.DENIED':
      case 'PAYMENT.SALE.FAILED':
        result = await handlePaymentFailed(body);
        break;
        
      default:
        console.log('Unhandled event type:', body.event_type);
        result = { status: 'ignored', action: 'unhandled_event' };
    }

    // Return success response
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

/**
 * Helper functions for user management
 */

// Grant user premium access
async function grantUserPremiumAccess(userId, planId) {
  try {
    const credits = planId === 'P-5ML4271244454362WXNWU5NI' ? 1000 : 5000;
    
    const response = await fetch(`${process.env.BACKEND_URL || 'http://localhost:5000'}/api/user-credits/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'reset',
        credits: credits
      })
    });
    
    console.log(`Granted ${credits} credits to user ${userId}`);
  } catch (error) {
    console.error('Error granting premium access:', error);
  }
}

// Revoke user premium access
async function revokeUserPremiumAccess(userId, immediate = false) {
  try {
    console.log(`Revoking premium access for user ${userId}, immediate: ${immediate}`);
    
    if (immediate) {
      // Immediately revoke access
      const response = await fetch(`${process.env.BACKEND_URL || 'http://localhost:5000'}/api/user-credits/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'revoke'
        })
      });
    }
    // If not immediate, let current billing period expire naturally
    
  } catch (error) {
    console.error('Error revoking premium access:', error);
  }
}

// Reset user credits (monthly renewal)
async function resetUserCredits(subscriptionId) {
  try {
    console.log(`Resetting credits for subscription ${subscriptionId}`);
    
    const response = await fetch(`${process.env.BACKEND_URL || 'http://localhost:5000'}/api/reset-credits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription_id: subscriptionId
      })
    });
    
  } catch (error) {
    console.error('Error resetting user credits:', error);
  }
}

// Log payment for tracking
async function logPayment(paymentId, amount, status) {
  try {
    console.log(`Logging payment: ${paymentId}, amount: ${amount}, status: ${status}`);
    
    const response = await fetch(`${process.env.BACKEND_URL || 'http://localhost:5000'}/api/log-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payment_id: paymentId,
        amount: amount,
        status: status,
        timestamp: new Date().toISOString()
      })
    });
    
  } catch (error) {
    console.error('Error logging payment:', error);
  }
}

// Notify user of payment failure
async function notifyPaymentFailure(userId, paymentId) {
  try {
    console.log(`Notifying user ${userId} of payment failure: ${paymentId}`);
    
    // TODO: Implement email notification or in-app notification
    // For now, just log the notification
    
  } catch (error) {
    console.error('Error notifying payment failure:', error);
  }
}