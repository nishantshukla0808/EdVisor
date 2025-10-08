import express from 'express';
import Razorpay from 'razorpay';
import { prisma } from '../server';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

// Mock Razorpay instance (replace with real keys in production)
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'mock_secret'
});

// Create Razorpay order
router.post('/create-order', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { bookingId } = req.body;

    if (req.user!.role !== 'STUDENT') {
      return res.status(403).json({ error: 'Only students can create payment orders' });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { 
        payment: true,
        student: true 
      }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.student.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Not authorized for this booking' });
    }

    if (!booking.payment) {
      return res.status(404).json({ error: 'Payment record not found' });
    }

    if (booking.payment.status === 'COMPLETED') {
      return res.status(400).json({ error: 'Payment already completed' });
    }

    // Mock Razorpay order creation
    const mockOrder = {
      id: `order_${Date.now()}`,
      entity: 'order',
      amount: booking.payment.amount,
      amount_paid: 0,
      amount_due: booking.payment.amount,
      currency: booking.payment.currency,
      receipt: `receipt_${booking.id}`,
      status: 'created',
      created_at: Math.floor(Date.now() / 1000)
    };

    // Update payment with Razorpay order ID
    await prisma.payment.update({
      where: { id: booking.payment.id },
      data: { razorpayOrderId: mockOrder.id }
    });

    res.json({
      message: 'Payment order created successfully',
      order: mockOrder,
      key: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock'
    });
  } catch (error) {
    next(error);
  }
});

// Verify payment (mock implementation)
router.post('/verify', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      bookingId 
    } = req.body;

    if (req.user!.role !== 'STUDENT') {
      return res.status(403).json({ error: 'Only students can verify payments' });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { 
        payment: true,
        student: true 
      }
    });

    if (!booking || !booking.payment) {
      return res.status(404).json({ error: 'Booking or payment not found' });
    }

    if (booking.student.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Not authorized for this booking' });
    }

    // Mock verification (in real implementation, verify with Razorpay)
    const isValidSignature = true; // Mock successful verification
    
    if (!isValidSignature) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    // Update payment status
    const updatedPayment = await prisma.payment.update({
      where: { id: booking.payment.id },
      data: {
        status: 'COMPLETED',
        razorpayId: razorpay_payment_id
      }
    });

    // Update booking status
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'CONFIRMED' }
    });

    res.json({
      message: 'Payment verified successfully',
      payment: updatedPayment
    });
  } catch (error) {
    next(error);
  }
});

// Get payment status
router.get('/:paymentId/status', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { paymentId } = req.params;

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        booking: {
          include: {
            student: true,
            mentor: {
              include: {
                user: { select: { name: true } }
              }
            }
          }
        }
      }
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Check permissions
    const canAccess = (
      (req.user!.role === 'STUDENT' && payment.booking.student.userId === req.user!.id) ||
      (req.user!.role === 'MENTOR' && payment.booking.mentor.userId === req.user!.id)
    );

    if (!canAccess) {
      return res.status(403).json({ error: 'Not authorized to view this payment' });
    }

    res.json({ payment });
  } catch (error) {
    next(error);
  }
});

// Get user's payment history
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    
    const where: any = {};
    if (status) where.status = status;

    if (req.user!.role === 'STUDENT') {
      const student = await prisma.student.findUnique({
        where: { userId: req.user!.id }
      });
      
      if (!student) {
        return res.status(404).json({ error: 'Student profile not found' });
      }
      
      where.studentId = student.id;
    } else {
      return res.status(403).json({ error: 'Only students can view payment history' });
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        booking: {
          include: {
            mentor: {
              include: {
                user: { select: { name: true, avatar: true } }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: Number(limit)
    });

    res.json({ payments });
  } catch (error) {
    next(error);
  }
});

export default router;