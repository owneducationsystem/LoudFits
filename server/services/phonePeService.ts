import crypto from 'crypto';
import axios from 'axios';

// Constants for PhonePe integration
const PHONEPE_HOST = 'https://api.phonepe.com/apis/hermes';
const PRODUCTION_HOST = 'https://api.phonepe.com/apis/hermes';
const UAT_HOST = 'https://api-preprod.phonepe.com/apis/pg-sandbox';

// Use UAT for testing and PRODUCTION for live payments
const BASE_URL = process.env.NODE_ENV === 'production' ? PRODUCTION_HOST : UAT_HOST;

const MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID || '';
const SALT_KEY = process.env.PHONEPE_SALT_KEY || '';
const SALT_INDEX = process.env.PHONEPE_SALT_INDEX || '1';

if (!process.env.PHONEPE_MERCHANT_ID || !process.env.PHONEPE_SALT_KEY || !process.env.PHONEPE_SALT_INDEX) {
  console.error('PhonePe credentials are missing. Please check your environment variables.');
}

interface PhonePePaymentOptions {
  amount: number;
  orderId: string;
  customerEmail: string;
  customerPhone: string;
  customerName: string;
  redirectUrl: string;
  callbackUrl: string;
  merchantOrderId?: string;
}

interface PaymentResponse {
  success: boolean;
  instrumentResponse?: {
    redirectInfo: {
      url: string;
    };
  };
  error?: string;
  errorMessage?: string;
  transactionId?: string;
}

/**
 * PhonePe payment service for handling payment operations
 */
export const PhonePeService = {
  /**
   * Initiates a payment through PhonePe
   * @param options Payment options
   */
  async initiatePayment(options: PhonePePaymentOptions): Promise<PaymentResponse> {
    try {
      console.log('Initiating PhonePe payment with options:', options);
      
      // Constructing the PhonePe payment payload
      const payload = {
        merchantId: MERCHANT_ID,
        merchantTransactionId: options.orderId,
        amount: options.amount * 100, // Convert to paisa (lowest denomination)
        merchantUserId: options.customerEmail.split('@')[0], // Use prefix of email as merchant user ID
        redirectUrl: options.redirectUrl,
        redirectMode: 'POST',
        callbackUrl: options.callbackUrl,
        mobileNumber: options.customerPhone,
        paymentInstrument: {
          type: 'PAY_PAGE'
        }
      };

      const payloadString = JSON.stringify(payload);
      const payloadBase64 = Buffer.from(payloadString).toString('base64');
      
      // Generate checksum for request verification
      const string = `${payloadBase64}/pg/v1/pay${SALT_KEY}`;
      const sha256 = crypto.createHash('sha256').update(string).digest('hex');
      const checksum = `${sha256}###${SALT_INDEX}`;
      
      // Prepare the API request
      const response = await axios.post(
        `${BASE_URL}/pg/v1/pay`,
        {
          request: payloadBase64
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-VERIFY': checksum,
            'Accept': 'application/json'
          }
        }
      );
      
      console.log('PhonePe payment initiated, response:', response.data);
      
      if (response.data.success) {
        return {
          success: true,
          instrumentResponse: response.data.data.instrumentResponse,
          transactionId: response.data.data.transactionId
        };
      } else {
        return {
          success: false,
          error: response.data.code,
          errorMessage: response.data.message
        };
      }
    } catch (error: any) {
      console.error('Error initiating PhonePe payment:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.code || 'PAYMENT_ERROR',
        errorMessage: error.response?.data?.message || 'Failed to process payment'
      };
    }
  },

  /**
   * Verify the payment status with PhonePe
   * @param merchantTransactionId The order ID used during payment initiation
   */
  async checkPaymentStatus(merchantTransactionId: string): Promise<any> {
    try {
      // Generate checksum for request verification
      const string = `/pg/v1/status/${MERCHANT_ID}/${merchantTransactionId}${SALT_KEY}`;
      const sha256 = crypto.createHash('sha256').update(string).digest('hex');
      const checksum = `${sha256}###${SALT_INDEX}`;
      
      // Make the API request to check status
      const response = await axios.get(
        `${BASE_URL}/pg/v1/status/${MERCHANT_ID}/${merchantTransactionId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-VERIFY': checksum,
            'X-MERCHANT-ID': MERCHANT_ID,
            'Accept': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error: any) {
      console.error('Error checking PhonePe payment status:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to check payment status');
    }
  },

  /**
   * Verify the callback/webhook data from PhonePe
   * @param data The data received in the callback/webhook
   * @param xVerify The X-VERIFY header from the request
   */
  verifyWebhook(data: any, xVerify: string): boolean {
    try {
      // Extract parts of the X-VERIFY header
      const [receivedSha256, saltIndex] = xVerify.split('###');
      
      // Create the string to hash
      const payload = typeof data === 'string' ? data : JSON.stringify(data);
      const string = `${payload}${SALT_KEY}`;
      
      // Generate and compare checksums
      const calculatedSha256 = crypto.createHash('sha256').update(string).digest('hex');
      
      return calculatedSha256 === receivedSha256 && parseInt(saltIndex, 10) === parseInt(SALT_INDEX, 10);
    } catch (error) {
      console.error('Error verifying PhonePe webhook:', error);
      return false;
    }
  }
};