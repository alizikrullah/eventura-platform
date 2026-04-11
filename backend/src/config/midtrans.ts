// @ts-ignore - midtrans-client doesn't have type definitions
import midtransClient from 'midtrans-client';
import crypto from 'crypto';

/**
 * Midtrans Snap Configuration
 * 
 * Sandbox Mode: For testing only, no real money
 * Production: Switch isProduction to true and use production keys
 */

// Initialize Snap API client
export const snap = new midtransClient.Snap({
  isProduction: false, // Sandbox mode
  serverKey: process.env.MIDTRANS_SERVER_KEY!,
  clientKey: process.env.MIDTRANS_CLIENT_KEY!
});

/**
 * Verify Midtrans webhook signature
 * 
 * Security: Always verify signature to ensure webhook is from Midtrans
 * Formula: SHA512(order_id + status_code + gross_amount + server_key)
 * 
 * @param orderId - Invoice number (e.g., INV-20260408-1234)
 * @param statusCode - Midtrans status code (e.g., "200")
 * @param grossAmount - Total amount (e.g., "724000.00")
 * @param signatureKey - Signature from Midtrans webhook
 * @returns true if signature is valid
 */
export const verifySignature = (
  orderId: string,
  statusCode: string,
  grossAmount: string,
  signatureKey: string
): boolean => {
  const serverKey = process.env.MIDTRANS_SERVER_KEY!;
  
  // Create hash from order details
  const hash = crypto
    .createHash('sha512')
    .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
    .digest('hex');
  
  return hash === signatureKey;
};

/**
 * Create Midtrans Snap transaction
 * 
 * @param params - Transaction parameters
 * @returns Promise with snap token and redirect URL
 */
export const createSnapTransaction = async (params: {
  orderId: string;
  amount: number;
  customerDetails: {
    firstName: string;
    email: string;
    phone?: string;
  };
  itemDetails: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
}) => {
  try {
    // Transform to Midtrans format
    const parameter = {
      transaction_details: {
        order_id: params.orderId,
        gross_amount: params.amount
      },
      customer_details: {
        first_name: params.customerDetails.firstName,
        email: params.customerDetails.email,
        phone: params.customerDetails.phone || ''
      },
      item_details: params.itemDetails
    };

    const transaction = await snap.createTransaction(parameter);
    return {
      token: transaction.token,
      redirect_url: transaction.redirect_url
    };
  } catch (error: any) {
    console.error('Midtrans Snap API Error:', error);
    throw new Error(`Failed to create Midtrans transaction: ${error.message}`);
  }
};

export default snap;