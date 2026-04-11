// Type definitions for midtrans-client
declare module 'midtrans-client' {
  export class Snap {
    constructor(config: {
      isProduction: boolean;
      serverKey: string;
      clientKey: string;
    });

    createTransaction(parameter: {
      transaction_details: {
        order_id: string;
        gross_amount: number;
      };
      customer_details?: {
        first_name: string;
        email: string;
        phone?: string;
      };
      item_details?: Array<{
        id: string;
        name: string;
        price: number;
        quantity: number;
      }>;
      callbacks?: {
        finish?: string;
        error?: string;
        pending?: string;
      };
    }): Promise<{
      token: string;
      redirect_url: string;
    }>;
  }

  export class CoreApi {
    constructor(config: {
      isProduction: boolean;
      serverKey: string;
      clientKey: string;
    });

    transaction: {
      status(orderId: string): Promise<any>;
      cancel(orderId: string): Promise<any>;
    };
  }
}
