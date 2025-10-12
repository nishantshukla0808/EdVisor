import express from 'express';
import Joi from 'joi';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { prisma, slotLocks } from '../../server';
import { authenticateToken, requireStudent, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// Validation schemas
const initiatePaymentSchema = Joi.object({
  bookingId: Joi.string().required()
});

const webhookSchema = Joi.object({
  razorpay_order_id: Joi.string().required(),
  razorpay_payment_id: Joi.string().required(),
  razorpay_signature: Joi.string().required(),
  bookingId: Joi.string().required()
});

/**
 * POST /api/v1/payments/initiate
 * Mock payment initiation (simulate success)
 */
router.post('/initiate', authenticateToken, requireStudent, async (req: AuthenticatedRequest, res, next) => {
  try {
    console.log('=== PAYMENT INITIATE DEBUG ===');
    console.log('User:', req.user);
    console.log('Request body:', req.body);
    console.log('==============================');
    
    const { error, value } = initiatePaymentSchema.validate(req.body);
    if (error) {
      console.log('Validation error:', error.details[0].message);
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details[0].message
      });
    }

    const { bookingId } = value;
    console.log('Looking for booking:', bookingId);

    // Find booking with payment
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        payment: true,
        student: true,
        mentor: { include: { user: { select: { name: true } } } }
      }
    });

    console.log('Booking found:', !!booking);
    if (booking) {
      console.log('Booking student userId:', booking.student.userId);
      console.log('Request user id:', req.user!.id);
      console.log('User IDs match:', booking.student.userId === req.user!.id);
    }

    if (!booking) {
      console.log('ERROR: Booking not found');
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Verify student ownership
    if (booking.student.userId !== req.user!.id) {
      console.log('ERROR: Access denied - user ID mismatch');
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!booking.payment) {
      return res.status(404).json({ error: 'Payment record not found' });
    }

    if (booking.payment.status === 'COMPLETED') {
      return res.status(400).json({ error: 'Payment already completed' });
    }

    // Create real Razorpay order
    const razorpayOrderOptions = {
      amount: booking.payment.amount, // Amount in paise
      currency: booking.payment.currency,
      receipt: `receipt_${booking.id}`,
      notes: {
        bookingId: booking.id,
        mentorId: booking.mentorId,
        studentId: booking.studentId
      }
    };

    console.log('Creating Razorpay order with options:', razorpayOrderOptions);
    const razorpayOrder = await razorpay.orders.create(razorpayOrderOptions);
    console.log('Razorpay order created:', razorpayOrder);
    
    // Update payment with order ID
    await prisma.payment.update({
      where: { id: booking.payment.id },
      data: { razorpayOrderId: razorpayOrder.id }
    });

    // Prepare payment response
    const paymentResponse = {
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      receipt: razorpayOrder.receipt,
      status: razorpayOrder.status,
      description: `Mentorship session with ${booking.mentor.user.name}`,
      notes: razorpayOrder.notes
    };

    res.json({
      success: true,
      message: 'Payment initiated successfully',
      data: {
        payment: paymentResponse
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/payments/webhook
 * Handle payment webhook (mock Razorpay webhook)
 */
router.post('/webhook', async (req, res, next) => {
  try {
    const { error, value } = webhookSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Invalid webhook payload',
        details: error.details[0].message
      });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = value;

    // Verify Razorpay signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');
    
    const isValidSignature = expectedSignature === razorpay_signature;
    console.log('Signature verification:', {
      expected: expectedSignature,
      received: razorpay_signature,
      isValid: isValidSignature
    });

    if (!isValidSignature) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    await processPaymentSuccess({
      bookingId,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id
    });

    res.json({
      success: true,
      message: 'Payment processed successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Helper function to process successful payment
 */
async function processPaymentSuccess({
  bookingId,
  razorpayOrderId,
  razorpayPaymentId
}: {
  bookingId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
}) {
  // Use transaction to ensure data consistency
  await prisma.$transaction(async (tx) => {
    // Update payment status
    await tx.payment.update({
      where: { bookingId },
      data: {
        status: 'COMPLETED',
        razorpayId: razorpayPaymentId,
        razorpayOrderId
      }
    });

    // Update booking status and clear slot lock
    const booking = await tx.booking.update({
      where: { id: bookingId },
      data: { 
        status: 'CONFIRMED',
        meetingLink: `https://zoom.us/j/${Math.random().toString().substr(2, 10)}`
      },
      include: {
        mentor: { include: { user: { select: { name: true } } } }
      }
    });

    // Remove slot lock
    const slotKey = `${booking.mentorId}-${booking.startTime.toISOString()}`;
    slotLocks.delete(slotKey);

    console.log(`Payment successful for booking ${bookingId}`);
  });
}

export default router;