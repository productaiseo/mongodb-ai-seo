import dbConnect from '@/lib/dbConnect';
import { PaymentOrderModel } from '@/models/order';
import { PaymentOrder } from '@/lib/models/order';


export class OrderManager {

  /**
  * Create a new order in the database
  */
  static async createOrder(orderData: Omit<PaymentOrder, 'createdAt' | 'updatedAt' | 'status'>) {

    console.log('Creating order:', orderData);
    try {
      await dbConnect();
      
      const order = await PaymentOrderModel.create({
        ...orderData,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log('✅ Order created successfully:', order.merchantOid);
      return order;
    } catch (error) {
      console.error('❌ Error creating order:', error);
      throw error;
    }
  }

  /**
  * Update order status to paid
  */
  static async updateOrderToPaid(
    merchantOid: string,
    paymentData: {
      totalAmount: number;
      paymentType: string;
      currency: string;
    }
  ) {
    // TODO: Implement database update
    console.log('Updating order to paid:', merchantOid, paymentData);
    
    try {
      await dbConnect();
      
      const order = await PaymentOrderModel.findOneAndUpdate(
        { merchantOid },
        { 
          $set: { 
            status: 'paid',
            totalAmount: paymentData.totalAmount,
            paymentType: paymentData.paymentType as 'card' | 'eft',
            currency: paymentData.currency,
            paidAt: new Date(),
            updatedAt: new Date(),
          } 
        },
        { new: true } // Return updated document
      );

      if (!order) {
        console.warn(`⚠️ Order not found: ${merchantOid}`);
        return null;
      }

      console.log('✅ Order updated to paid:', merchantOid);
      return order;
    } catch (error) {
      console.error('❌ Error updating order to paid:', error);
      throw error;
    }
  }


  /**
   * Update order status to failed
   */
  static async updateOrderToFailed(
    merchantOid: string,
    failureData: {
      failureCode: string;
      failureReason: string;
    }
  ) {
    // TODO: Implement database update
    console.log('Updating order to failed:', merchantOid, failureData);

    try {
      await dbConnect();
      
      const order = await PaymentOrderModel.findOneAndUpdate(
        { merchantOid },
        {
          $set: {
            status: 'failed',
            failureCode: failureData.failureCode,
            failureReason: failureData.failureReason,
            updatedAt: new Date(),
          } 
        },
        { new: true }
      );

      if (!order) {
        console.warn(`⚠️ Order not found: ${merchantOid}`);
        return null;
      }

      console.log('✅ Order updated to failed:', merchantOid);
      return order;
    } catch (error) {
      console.error('❌ Error updating order to failed:', error);
      throw error;
    }
  }

  /**
   * Get order by merchant order ID
   */
  static async getOrderByMerchantOid(merchantOid: string): Promise<PaymentOrder | null> {
    try {
      await dbConnect();
      
      const order = await PaymentOrderModel.findOne({ merchantOid }).lean();
      
      if (!order) {
        console.log(`Order not found: ${merchantOid}`);
        return null;
      }

      return order as any;
    } catch (error) {
      console.error('❌ Error getting order:', error);
      throw error;
    }
  }

  /**
   * Get all orders for a user by email
   */
  static async getOrdersByEmail(email: string): Promise<PaymentOrder[]> {
    try {
      await dbConnect();
      
      const orders = await PaymentOrderModel.find({ email })
        .sort({ createdAt: -1 })
        .lean();

      return orders as any;
    } catch (error) {
      console.error('❌ Error getting orders by email:', error);
      throw error;
    }
  }


  /**
   * Get order statistics
   */
  static async getOrderStats() {
    try {
      await dbConnect();
      
      const stats = await PaymentOrderModel.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$paymentAmount' },
          }
        }
      ]);

      return stats;
    } catch (error) {
      console.error('❌ Error getting order stats:', error);
      throw error;
    }
  }


  /**
   * Cancel an order (before payment)
   */
  static async cancelOrder(merchantOid: string) {
    try {
      await dbConnect();
      
      const order = await PaymentOrderModel.findOneAndUpdate(
        { merchantOid, status: 'pending' },
        { 
          $set: { 
            status: 'cancelled',
            updatedAt: new Date(),
          } 
        },
        { new: true }
      );

      if (!order) {
        console.warn(`⚠️ Order not found or already processed: ${merchantOid}`);
        return null;
      }

      console.log('✅ Order cancelled:', merchantOid);
      return order;
    } catch (error) {
      console.error('❌ Error cancelling order:', error);
      throw error;
    }
  }


  /**
   * Check if order has already been processed (to prevent duplicate processing)
   */
  static async isOrderProcessed(merchantOid: string): Promise<boolean> {
    try {
      await dbConnect();
      
      const order = await PaymentOrderModel.findOne({ 
        merchantOid,
        status: { $in: ['paid', 'failed'] }
      }).lean();

      return order !== null;
    } catch (error) {
      console.error('❌ Error checking order status:', error);
      throw error;
    }
  }

}
