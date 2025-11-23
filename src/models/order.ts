import { Schema, model, models } from 'mongoose';

const PaymentOrderSchema = new Schema(
    {
        merchantOid: String,
        email: String,
        userName: String,
        userPhone: String,
        userAddress: String,
        paymentAmount: Number, // in kuruş
        totalAmount: Number, // actual amount collected (may differ due to installments)
        currency: String,
        status: { type: String, enum: ['pending', 'paid', 'failed', 'cancelled'], default: 'pending' },
        paymentType: { type: String, enum: ['card', 'eft'], default: 'card' },
        failureReason: String,
        failureCode: String,
        testMode: Boolean,
        basket: [
            {
                name: String,
                price: String,
                quantity: Number,
            }
        ],
        planId: String,
        planName: String,
        createdAt: Date,
        paidAt: Date,
        updatedAt: Date,
    },
    { 
        versionKey: false,
        collection: 'orders',
    }
)

export const PaymentOrderModel =
  models.PaymentOrder || model('PaymentOrder', PaymentOrderSchema);
