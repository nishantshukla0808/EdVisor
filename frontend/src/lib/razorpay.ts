// Razorpay integration utility
import { paymentsAPI } from './api';
import toast from 'react-hot-toast';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
}

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface PaymentData {
  bookingId: string;
  amount: number;
  mentorName: string;
  studentName?: string;
  studentEmail?: string;
}

// Load Razorpay script
export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

// Initialize Razorpay payment
export const initiateRazorpayPayment = async (paymentData: PaymentData): Promise<void> => {
  try {
    console.log('Starting Razorpay payment with data:', paymentData);

    // Load Razorpay script if not already loaded
    if (!window.Razorpay) {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load Razorpay script');
      }
    }

    // Get Razorpay key from environment
    const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    if (!razorpayKey) {
      throw new Error('Razorpay key not configured');
    }

    // Initiate payment on backend to get order ID
    console.log('Calling backend to initiate payment...');
    console.log('Payment data:', paymentData);
    
    let response;
    let paymentOrder;
    
    try {
      response = await paymentsAPI.initiatePayment({ bookingId: paymentData.bookingId });
      paymentOrder = response.data.data.payment;
      
      console.log('Backend payment initiation response:', paymentOrder);
    } catch (apiError: any) {
      console.error('=== PAYMENT API ERROR ===');
      console.error('API Error:', apiError);
      console.error('API Error Response:', apiError.response);
      console.error('API Error Status:', apiError.response?.status);
      console.error('API Error Data:', apiError.response?.data);
      console.error('========================');
      throw apiError;
    }

    // Configure Razorpay options
    const options: RazorpayOptions = {
      key: razorpayKey,
      amount: paymentOrder.amount, // Amount in paise (from backend)
      currency: paymentOrder.currency,
      name: 'EdVisor',
      description: paymentOrder.description,
      order_id: paymentOrder.orderId,
      prefill: {
        name: paymentData.studentName,
        email: paymentData.studentEmail,
      },
      theme: {
        color: '#2563eb', // Blue color matching the app theme
      },
      handler: async (response: RazorpayResponse) => {
        console.log('Razorpay payment successful:', response);
        toast.success('Payment successful! Processing booking...');
        
        try {
          // Send webhook data to backend for verification
          await paymentsAPI.webhook({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            bookingId: paymentData.bookingId,
          });
          
          toast.success('Booking confirmed! Check your email for details.');
          
          // Redirect to bookings page or dashboard
          setTimeout(() => {
            window.location.href = '/bookings';
          }, 2000);
          
        } catch (error: any) {
          console.error('Webhook processing failed:', error);
          toast.error('Payment successful but booking confirmation failed. Please contact support.');
        }
      },
      modal: {
        ondismiss: () => {
          console.log('Razorpay payment modal dismissed');
          toast.error('Payment cancelled');
        },
      },
    };

    console.log('Opening Razorpay with options:', options);
    
    // Open Razorpay payment modal
    const razorpay = new window.Razorpay(options);
    razorpay.open();

  } catch (error: any) {
    console.error('Razorpay payment initiation failed:', error);
    const errorMessage = error.response?.data?.error || error.message || 'Payment initiation failed';
    toast.error(errorMessage);
    throw error;
  }
};