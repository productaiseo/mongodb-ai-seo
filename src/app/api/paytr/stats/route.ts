import { NextResponse } from 'next/server';
import { OrderManager } from '@/lib/paytr/order-manager';


export async function GET() {
  try {
    const stats = await OrderManager.getOrderStats();
    
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching order stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order statistics' },
      { status: 500 }
    );
  }
}
