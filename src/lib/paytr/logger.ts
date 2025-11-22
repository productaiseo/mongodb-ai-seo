export class PayTRLogger {
  static logCallback(data: {
    merchantOid: string;
    status: string;
    amount: string;
    timestamp: Date;
  }) {
    console.log('📝 PayTR Callback Log:', {
      ...data,
      timestamp: data.timestamp.toISOString(),
    });

    // TODO: Store in database or external logging service
    // This helps with debugging and auditing
  }

  static logError(error: Error, context: string) {
    console.error(`❌ PayTR Error [${context}]:`, error);
    
    // TODO: Send to error tracking service (e.g., Sentry)
  }
}