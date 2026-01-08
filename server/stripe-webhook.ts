import { Request, Response } from 'express';
import Stripe from 'stripe';
import { getDb } from './db';
import { transactions, stamps } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

function createStripeClient() {
  // Always return a client that exposes `webhooks.constructEvent` so tests/dev
  // environments do not throw before signature verification can run.
  const apiKey =
    process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.startsWith('sk_')
      ? process.env.STRIPE_SECRET_KEY
      : 'sk_test_mock_key';

  return new Stripe(apiKey, {
    apiVersion: '2025-12-15.clover',
  });
}

const stripe = createStripeClient();

// Error types
enum WebhookErrorType {
  MISSING_SIGNATURE = 'MISSING_SIGNATURE',
  INVALID_SIGNATURE = 'INVALID_SIGNATURE',
  PROCESSING_ERROR = 'PROCESSING_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

interface WebhookError {
  type: WebhookErrorType;
  message: string;
  statusCode: number;
}

// Error handler
function handleWebhookError(error: any): WebhookError {
  if (error.message?.includes('No signature')) {
    return {
      type: WebhookErrorType.MISSING_SIGNATURE,
      message: 'Missing Stripe signature header',
      statusCode: 400,
    };
  }

  if (error.message?.includes('Signature verification')) {
    return {
      type: WebhookErrorType.INVALID_SIGNATURE,
      message: 'Invalid webhook signature',
      statusCode: 400,
    };
  }

  if (error instanceof Error) {
    return {
      type: WebhookErrorType.PROCESSING_ERROR,
      message: error.message,
      statusCode: 500,
    };
  }

  return {
    type: WebhookErrorType.UNKNOWN_ERROR,
    message: 'An unknown error occurred',
    statusCode: 500,
  };
}

// Event handlers
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  try {
    const userId = session.metadata?.user_id;
    const stampId = session.metadata?.stamp_id;
    const paymentMethod = session.metadata?.payment_method || 'card';

    if (!userId || !stampId) {
      throw new Error('Missing required metadata (user_id or stamp_id)');
    }

    console.log('[Webhook] Processing checkout completion:', {
      sessionId: session.id,
      userId,
      stampId,
      paymentMethod,
      amount: session.amount_total,
      currency: session.currency,
      customerEmail: session.customer_email,
    });

    const db = await getDb();
    if (!db) {
      throw new Error('Database connection failed');
    }

    // Create transaction record
    await db.insert(transactions).values({
      stampId: parseInt(stampId),
      buyerId: parseInt(userId),
      price: ((session.amount_total || 0) / 100).toString(),
      status: 'completed',
      transactionHash: session.id,
    });

    console.log('[Webhook] Transaction recorded successfully');

    return {
      success: true,
      message: 'Checkout session processed successfully',
    };
  } catch (error: any) {
    console.error('[Webhook] Error processing checkout completion:', error);
    throw error;
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    console.log('[Webhook] Processing payment success:', {
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      clientSecret: paymentIntent.client_secret,
    });

    const db = await getDb();
    if (db && paymentIntent.metadata?.transaction_id) {
      // Update transaction status if linked
      await db
        .update(transactions)
        .set({ status: 'completed' })
        .where(eq(transactions.id, parseInt(paymentIntent.metadata.transaction_id)));
      
      console.log('[Webhook] Transaction status updated to completed');
    }

    return {
      success: true,
      message: 'Payment processed successfully',
    };
  } catch (error: any) {
    console.error('[Webhook] Error processing payment success:', error);
    throw error;
  }
}

async function handlePaymentIntentPaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    console.log('[Webhook] Processing payment failure:', {
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      lastPaymentError: paymentIntent.last_payment_error,
    });

    const db = await getDb();
    if (db && paymentIntent.metadata?.transaction_id) {
      // Update transaction status to cancelled/failed
      await db
        .update(transactions)
        .set({ status: 'cancelled' })
        .where(eq(transactions.id, parseInt(paymentIntent.metadata.transaction_id)));
      
      console.log('[Webhook] Transaction marked as cancelled due to payment failure');
    }

    return {
      success: true,
      message: 'Payment failure processed',
    };
  } catch (error: any) {
    console.error('[Webhook] Error processing payment failure:', error);
    throw error;
  }
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  try {
    console.log('[Webhook] Processing refund:', {
      chargeId: charge.id,
      amount: charge.amount,
      amountRefunded: charge.amount_refunded,
      refunded: charge.refunded,
    });

    const db = await getDb();
    if (db) {
      // Find and update transaction by payment hash
      const [transaction] = await db
        .select()
        .from(transactions)
        .where(eq(transactions.transactionHash, charge.id))
        .limit(1);

      if (transaction) {
        await db
          .update(transactions)
          .set({ status: 'cancelled' })
          .where(eq(transactions.id, transaction.id));
        
        console.log('[Webhook] Transaction refunded and marked as cancelled');
      }
    }

    return {
      success: true,
      message: 'Refund processed',
    };
  } catch (error: any) {
    console.error('[Webhook] Error processing refund:', error);
    throw error;
  }
}

async function handleChargeDisputeCreated(dispute: Stripe.Dispute) {
  try {
    console.log('[Webhook] Processing dispute:', {
      disputeId: dispute.id,
      chargeId: dispute.charge,
      amount: dispute.amount,
      reason: dispute.reason,
      status: dispute.status,
    });

    const db = await getDb();
    if (db) {
      // Find transaction and log dispute
      const [transaction] = await db
        .select()
        .from(transactions)
        .where(eq(transactions.transactionHash, dispute.charge as string))
        .limit(1);

      if (transaction) {
        console.log('[Webhook] Dispute flagged for transaction:', transaction.id);
        // Transaction remains in current state pending dispute resolution
      }
    }

    return {
      success: true,
      message: 'Dispute logged',
    };
  } catch (error: any) {
    console.error('[Webhook] Error processing dispute:', error);
    throw error;
  }
}

export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers['stripe-signature'] as string;

  // Validate signature presence
  if (!sig) {
    console.error('[Webhook] No signature found');
    return res.status(400).json({
      error: 'Missing Stripe signature',
      type: WebhookErrorType.MISSING_SIGNATURE,
    });
  }

  let event: Stripe.Event;

  // Verify webhook signature
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    const error = handleWebhookError(err);
    console.error('[Webhook] Signature verification failed:', error.message);
    return res.status(error.statusCode).json({
      error: error.message,
      type: error.type,
    });
  }

  // Handle test events
  if (event.id.startsWith('evt_test_')) {
    console.log('[Webhook] Test event detected:', event.type);
    return res.json({
      verified: true,
      message: 'Test event received',
    });
  }

  console.log('[Webhook] Event received:', {
    eventId: event.id,
    eventType: event.type,
    timestamp: new Date(event.created * 1000).toISOString(),
  });

  try {
    let result: any;

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        result = await handleCheckoutSessionCompleted(session);
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        result = await handlePaymentIntentSucceeded(paymentIntent);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        result = await handlePaymentIntentPaymentFailed(paymentIntent);
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        result = await handleChargeRefunded(charge);
        break;
      }

      case 'charge.dispute.created': {
        const dispute = event.data.object as Stripe.Dispute;
        result = await handleChargeDisputeCreated(dispute);
        break;
      }

      default:
        console.log('[Webhook] Unhandled event type:', event.type);
        result = {
          success: true,
          message: `Event type ${event.type} received but not processed`,
        };
    }

    console.log('[Webhook] Event processed successfully:', {
      eventId: event.id,
      eventType: event.type,
      result,
    });

    res.json({
      received: true,
      eventId: event.id,
      eventType: event.type,
      result,
    });
  } catch (error: any) {
    const webhookError = handleWebhookError(error);
    console.error('[Webhook] Error processing event:', {
      eventId: event.id,
      eventType: event.type,
      error: webhookError,
    });

    res.status(webhookError.statusCode).json({
      error: webhookError.message,
      type: webhookError.type,
      eventId: event.id,
    });
  }
}
