import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { OrderManager } from '@/lib/paytr/order-manager';

// PayTR credentials
const MERCHANT_ID = process.env.PAYTR_MERCHANT_ID;
const MERCHANT_KEY = process.env.PAYTR_MERCHANT_KEY;
const MERCHANT_SALT = process.env.PAYTR_MERCHANT_SALT;


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Get user's real IP address
    const userIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                   request.headers.get('x-real-ip') || 
                   '88.230.12.132'; // Fallback IP

    // Prepare basket data (typed for OrderManager). For PayTR API we also build an array-of-arrays.
    const basket = [
      { name: 'Sample Product 1', price: '18.00', quantity: 1 },
      { name: 'Sample Product 2', price: '33.25', quantity: 2 },
      { name: 'Sample Product 3', price: '45.42', quantity: 1 },
    ];
    // PayTR expects user_basket as base64-encoded JSON array of arrays: [name,price,quantity]
    const paytrBasket = basket.map(item => [item.name, item.price, item.quantity]);
    const userBasket = Buffer.from(JSON.stringify(paytrBasket)).toString('base64');

    /*
    const basket = [
      ['Sample Product 1', '18.00', 1],
      ['Sample Product 2', '33.25', 2],
      ['Sample Product 3', '45.42', 1]
    ];
    const userBasket = Buffer.from(JSON.stringify(basket)).toString('base64');
    */

    // Generate unique merchant order ID
    const merchantOid = `IN${Date.now()}${Math.floor(Math.random() * 1000)}`;

    // Payment parameters
    const paymentAmount = body.amount || 100; // Amount in kuruş (multiply by 100)
    const email = body.email || 'eren@aiseoptimizer.com';
    const userName = body.userName || 'Eren Çöp';
    const userAddress = body.userAddress || 'Istanbul';
    const userPhone = body.userPhone || '05555555555';
    const currency = body.currency || 'TL';
    const maxInstallment = body.maxInstallment || '0';
    const noInstallment = body.noInstallment || '0';
    const testMode = body.testMode || '1'; // Set to 1 for testing

    // Success and fail URLs - Update these to your actual URLs
    const merchantOkUrl = `${process.env.NEXT_PUBLIC_URL}/payment/success`;
    const merchantFailUrl = `${process.env.NEXT_PUBLIC_URL}/payment/failed`;

    // Generate paytr_token hash
    const hashString = `${MERCHANT_ID}${userIp}${merchantOid}${email}${paymentAmount}${userBasket}${noInstallment}${maxInstallment}${currency}${testMode}`;
    const paytrToken = hashString + MERCHANT_SALT;
    const token = crypto
      .createHmac('sha256', MERCHANT_KEY as string)
      .update(paytrToken)
      .digest('base64');

    // Prepare form data for PayTR API
    const formData = new URLSearchParams({
      merchant_id: MERCHANT_ID as string,
      merchant_key: MERCHANT_KEY as string,
      merchant_salt: MERCHANT_SALT as string,
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
      debug_on: '1',
      test_mode: testMode,
      lang: 'tr',
      no_installment: noInstallment,
      max_installment: maxInstallment,
      currency: currency,
      paytr_token: token,
    });

    // Request iframe token from PayTR
    const response = await fetch('https://www.paytr.com/odeme/api/get-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const data = await response.json();

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
          testMode: testMode === '1',
          basket: basket,
        });
      } catch (dbError) {
        console.error('Failed to create order in database:', dbError);
        // Continue even if DB fails - payment can still be processed
      }

      return NextResponse.json({
        success: true,
        iframeToken: data.token,
        merchantOid: merchantOid,
      });
    } else {
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
