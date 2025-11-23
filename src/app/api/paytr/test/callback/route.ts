import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { OrderManager } from '@/lib/paytr/order-manager';

// PayTR credentials - should match Step 1
const MERCHANT_KEY = process.env.PAYTR_MERCHANT_KEY;
const MERCHANT_SALT = process.env.PAYTR_MERCHANT_SALT;

// Store processed orders to handle duplicate notifications
const processedOrders = new Set<string>();

// Disable body parsing to handle form data manually
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Parse form data from PayTR
    const formData = await request.formData();
    
    const merchantOid = formData.get('merchant_oid') as string;
    const status = formData.get('status') as string;
    const totalAmount = formData.get('total_amount') as string;
    const hash = formData.get('hash') as string;
    const failedReasonCode = formData.get('failed_reason_code') as string;
    const failedReasonMsg = formData.get('failed_reason_msg') as string;
    const testMode = formData.get('test_mode') as string;
    const paymentType = formData.get('payment_type') as string;
    const currency = formData.get('currency') as string;
    const paymentAmount = formData.get('payment_amount') as string;

    console.log('PayTR Callback Received:', {
      merchantOid,
      status,
      totalAmount,
      testMode,
      paymentType,
      currency,
    });

    // CRITICAL: Validate hash to ensure request is from PayTR and data is intact
    const paytrToken = merchantOid + MERCHANT_SALT + status + totalAmount;
    const calculatedHash = crypto
      .createHmac('sha256', MERCHANT_KEY as string)
      .update(paytrToken)
      .digest('base64');

    if (calculatedHash !== hash) {
      console.error('PAYTR notification failed: bad hash', {
        received: hash,
        calculated: calculatedHash,
      });
      
      // Still return OK to prevent PayTR from retrying with invalid data
      return new NextResponse('OK', { status: 200 });
    }

    // Check if this order has already been processed (handle duplicate notifications)
    const isProcessed = await OrderManager.isOrderProcessed(merchantOid);
    if (isProcessed) {
      console.log(`Order ${merchantOid} already processed, returning OK`);
      return new NextResponse('OK', { status: 200 });
    }

    // Process the payment based on status
    if (status === 'success') {
      console.log(`✅ Payment SUCCESS for order ${merchantOid}`);

      // Update order status in database
      try {
        await OrderManager.updateOrderToPaid(merchantOid, {
          totalAmount: parseInt(totalAmount),
          paymentType: paymentType || 'card',
          currency: currency || 'TL',
        });
      } catch (dbError) {
        console.error('Failed to update order in database:', dbError);
      }

      // TODO: Send confirmation email to customer
      // await sendOrderConfirmationEmail(merchantOid);

      // TODO: Trigger order fulfillment process
      // await fulfillOrder(merchantOid);

      // Mark order as processed
      processedOrders.add(merchantOid);

    } else {
      console.log(`❌ Payment FAILED for order ${merchantOid}`);
      console.log(`Reason Code: ${failedReasonCode}`);
      console.log(`Reason Message: ${failedReasonMsg}`);
      
        // Update order status in database
      try {
        await OrderManager.updateOrderToFailed(merchantOid, {
          failureCode: failedReasonCode || '0',
          failureReason: failedReasonMsg || 'Unknown error',
        });
      } catch (dbError) {
        console.error('Failed to update order in database:', dbError);
      }

      // TODO: Send payment failure notification to customer
      // await sendPaymentFailureEmail(merchantOid, failedReasonMsg);

      // Mark order as processed (even failures should be tracked)
      processedOrders.add(merchantOid);
    }

    // Log for debugging in test mode
    if (testMode === '1') {
      console.log('⚠️ TEST MODE payment callback');
    }

    // CRITICAL: Must return plain text "OK" - NO HTML, NO JSON
    return new NextResponse('OK', { 
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
    });

  } catch (error) {
    console.error('PayTR Callback Error:', error);
    
    // Even on error, return OK to prevent PayTR from retrying indefinitely
    // Log the error for investigation
    return new NextResponse('OK', { 
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }
}
