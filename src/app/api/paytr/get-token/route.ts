import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { OrderManager } from '@/lib/paytr/order-manager';

// PayTR credentials
const MERCHANT_ID = process.env.PAYTR_MERCHANT_ID;
const MERCHANT_KEY = process.env.PAYTR_MERCHANT_KEY;
const MERCHANT_SALT = process.env.PAYTR_MERCHANT_SALT;

 // test mode should be 1 for development, else 0 (for production)
const TestNode = process.env.NEXT_PUBLIC_PAYMENT_TEST_MODE || '1';

interface BasketItem {
  name: string;
  price: string;
  quantity: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!MERCHANT_ID || !MERCHANT_KEY || !MERCHANT_SALT) {
      return NextResponse.json({
        success: false,
        error: 'PayTR configuration is missing',
      }, { status: 500 });
    }

    // Get user's real IP address
    const userIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                   request.headers.get('x-real-ip') || 
                   '88.230.12.132'; // Fallback IP for development

    // Get basket from request or use default
    const basket: BasketItem[] = body.basket || [
      { name: 'Sample Product', price: (body.amount / 100).toFixed(2), quantity: 1 }
    ];

    // PayTR expects user_basket as base64-encoded JSON array of arrays: [name, price, quantity]
    const paytrBasket = basket.map(item => [item.name, item.price, item.quantity]);
    const userBasket = Buffer.from(JSON.stringify(paytrBasket)).toString('base64');

    // Generate unique merchant order ID
    const merchantOid = `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`;

    console.log("API Test Node:", TestNode);

    // Payment parameters with validation
    const paymentAmount = body.amount || 10000; // Amount in kuruş (multiply by 100)
    const email = body.email || 'customer@example.com';
    const userName = body.userName || 'Müşteri';
    const userAddress = body.userAddress || 'Türkiye';
    const userPhone = body.userPhone || '05555555555';
    const currency = body.currency || 'TL';
    const maxInstallment = body.maxInstallment || '0';
    const noInstallment = body.noInstallment || '0';
    const testMode = body.testMode || TestNode; // Set to 1 for testing

    console.log("Test Mode:", testMode);

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid email format',
      }, { status: 400 });
    }

    // Validate amount (minimum 100 kuruş = 1 TL)
    if (paymentAmount < 100) {
      return NextResponse.json({
        success: false,
        error: 'Payment amount must be at least 1 TL',
      }, { status: 400 });
    }

    // Success and fail URLs
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
    const merchantOkUrl = `${baseUrl}/payment/success`;
    const merchantFailUrl = `${baseUrl}/payment/failed`;

    // Generate paytr_token hash according to PayTR documentation
    const hashString = `${MERCHANT_ID}${userIp}${merchantOid}${email}${paymentAmount}${userBasket}${noInstallment}${maxInstallment}${currency}${testMode}`;
    const paytrToken = hashString + MERCHANT_SALT;
    const token = crypto
      .createHmac('sha256', MERCHANT_KEY as string)
      .update(paytrToken)
      .digest('base64');

    // Prepare form data for PayTR API
    const formData = new URLSearchParams({
      merchant_id: MERCHANT_ID,
      merchant_key: MERCHANT_KEY,
      merchant_salt: MERCHANT_SALT,
      email: email,
      payment_amount: paymentAmount.toString(),
      merchant_oid: merchantOid,
      user_name: userName,
      user_address: userAddress,
      user_phone: userPhone,
      merchant_ok_url: merchantOkUrl,
      merchant_fail_url: merchantFailUrl,
      user_basket: userBasket,
      user_ip: userIp,
      timeout_limit: '30',
      debug_on: TestNode, // Keep this 1 for debugging, set to 0 in production
      test_mode: testMode,
      lang: 'tr',
      no_installment: noInstallment,
      max_installment: maxInstallment,
      currency: currency,
      paytr_token: token,
    });

    console.log('Requesting PayTR token for order:', merchantOid);

    // Request iframe token from PayTR
    const response = await fetch('https://www.paytr.com/odeme/api/get-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const data = await response.json();
    console.log('PayTR API response:', data);

    if (data.status === 'success') {
      // Store order in database with 'pending' status
      try {
        await OrderManager.createOrder({
          merchantOid,
          email,
          userName,
          userPhone,
          userAddress,
          paymentAmount,
          currency,
          testMode,
          basket: basket,
          planId: body.planId || null,
          planName: body.planName || null,
        });
        console.log('Order created in database:', merchantOid);
      } catch (dbError) {
        console.error('Failed to create order in database:', dbError);
        // Continue even if DB fails - payment can still be processed
        // You might want to handle this differently in production
      }

      return NextResponse.json({
        success: true,
        iframeToken: data.token,
        merchantOid: merchantOid,
      });
    } else {
      console.error('PayTR token generation failed:', data);
      return NextResponse.json({
        success: false,
        error: data.reason || 'Token generation failed',
      }, { status: 400 });
    }

  } catch (error) {
    console.error('PayTR token generation error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
