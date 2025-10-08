import express from 'express';
import Joi from 'joi';
import crypto from 'crypto';
import { prisma, slotLocks } from '../../server';
import { authenticateToken, requireStudent, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

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
    const { error, value } = initiatePaymentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details[0].message
      });
    }

    const { bookingId } = value;

    // Find booking with payment
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        payment: true,
        student: true,
        mentor: { include: { user: { select: { name: true } } } }
      }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Verify student ownership
    if (booking.student.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!booking.payment) {
      return res.status(404).json({ error: 'Payment record not found' });
    }

    if (booking.payment.status === 'COMPLETED') {
      return res.status(400).json({ error: 'Payment already completed' });
    }

    // Mock Razorpay order creation
    const mockOrderId = `order_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Update payment with order ID
    await prisma.payment.update({
      where: { id: booking.payment.id },
      data: { razorpayOrderId: mockOrderId }
    });

    // Mock successful payment response
    const mockPaymentResponse = {
      orderId: mockOrderId,
      amount: booking.payment.amount,
      currency: booking.payment.currency,
      receipt: `receipt_${booking.id}`,
      status: 'created',
      description: `Mentorship session with ${booking.mentor.user.name}`,
      notes: {
        bookingId: booking.id,
        mentorId: booking.mentorId,
        studentId: booking.studentId
      }
    };

    // Simulate immediate payment success (in real app, this would be async via webhook)
    setTimeout(async () => {
      try {
        // Auto-trigger webhook simulation after 2 seconds
        const mockPaymentId = `pay_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        await processPaymentSuccess({
          bookingId,
          razorpayOrderId: mockOrderId,
          razorpayPaymentId: mockPaymentId
        });
      } catch (error) {
        console.error('Mock payment webhook error:', error);
      }
    }, 2000);

    res.json({
      success: true,
      message: 'Payment initiated successfully',
      data: {
        payment: mockPaymentResponse,
        mockNote: 'This is a mock payment. It will auto-complete in 2 seconds.'
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

    // Mock signature verification (in real app, verify with Razorpay secret)
    const isValidSignature = true;

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