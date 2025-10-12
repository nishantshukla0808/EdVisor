'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Calendar, Clock, CreditCard, User, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { bookingsAPI } from '@/lib/api';
import { initiateRazorpayPayment } from '@/lib/razorpay';
import toast from 'react-hot-toast';

interface BookingModalProps {
  mentor: any;
  onClose: () => void;
}

const DURATION_OPTIONS = [
  { value: 30, label: '30 minutes', price: 0.5 },
  { value: 60, label: '1 hour', price: 1 },
  { value: 90, label: '1.5 hours', price: 1.5 },
  { value: 120, label: '2 hours', price: 2 },
];

export default function BookingModal({ mentor, onClose }: BookingModalProps) {
  // Early validation - ensure mentor exists and has required fields
  if (!mentor) {
    toast.error('Mentor information not available');
    onClose();
    return null;
  }
  
  // Check authentication
  const token = typeof window !== 'undefined' ? localStorage.getItem('edvisor_token') : null;
  const user = typeof window !== 'undefined' ? localStorage.getItem('edvisor_user') : null;
  console.log('=== AUTH DEBUG ===');
  console.log('Auth token present:', !!token);
  console.log('Token preview:', token?.substring(0, 20) + '...');
  console.log('User data present:', !!user);
  console.log('User data:', user ? JSON.parse(user) : null);
  console.log('Token length:', token?.length);
  console.log('==================');
  
  if (!token) {
    console.log('No token found, redirecting to login');
    toast.error('Please log in to book a session');
    window.location.href = '/auth/login';
    return null;
  }
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    duration: 60,
    selectedDate: '',
    selectedTime: '',
    preQuestions: [''],
    notes: ''
  });

  const queryClient = useQueryClient();

  // Generate available time slots for next 7 days
  const getAvailableSlots = () => {
    const slots = [];
    const today = new Date();
    
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Skip weekends for now
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      
      const dateStr = date.toISOString().split('T')[0];
      
      // Generate time slots (9 AM to 6 PM)
      const times = [];
      for (let hour = 9; hour <= 17; hour++) {
        times.push(`${hour.toString().padStart(2, '0')}:00`);
        if (hour < 17) {
          times.push(`${hour.toString().padStart(2, '0')}:30`);
        }
      }
      
      slots.push({
        date: dateStr,
        dateLabel: date.toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        }),
        times
      });
    }
    
    return slots;
  };

  const availableSlots = getAvailableSlots();

  const createBookingMutation = useMutation({
    mutationFn: bookingsAPI.createBooking,
    onSuccess: async (response) => {
      const booking = response.data.data.booking;
      toast.success('Booking created successfully!');
      
      // Get user info for payment
      let user = {};
      try {
        const userData = localStorage.getItem('edvisor_user');
        user = userData ? JSON.parse(userData) : {};
        console.log('User data for payment:', user);
      } catch (error) {
        console.error('Failed to parse user data:', error);
        toast.error('User data error. Please log in again.');
        return;
      }
      
      // Initiate Razorpay payment
      await initiatePayment(booking.id, user);
    },
    onError: (error: any) => {
      console.error('=== BOOKING ERROR DEBUG ===');
      console.error('Full error object:', error);
      console.error('Error message:', error.message);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      console.error('Error response status:', error.response?.status);
      console.error('Error response headers:', error.response?.headers);
      console.error('Error config:', error.config);
      console.error('Request headers:', error.config?.headers);
      console.error('==========================');
      
      if (error.response?.status === 401) {
        console.log('401 Unauthorized - Redirecting to login');
        toast.error('Please log in to book a session');
        localStorage.removeItem('edvisor_token');
        localStorage.removeItem('edvisor_user');
        window.location.href = '/auth/login';
        return;
      }
      
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to create booking';
      toast.error(errorMessage);
    },
  });

  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const initiatePayment = async (bookingId: string, user: any) => {
    try {
      console.log('=== PAYMENT INITIATION DEBUG ===');
      console.log('Booking ID:', bookingId);
      console.log('User data:', user);
      console.log('Total price:', totalPrice);
      console.log('================================');
      
      setIsProcessingPayment(true);
      
      const mentorName = mentor.user?.name || mentor.name || 'Unknown Mentor';
      
      await initiateRazorpayPayment({
        bookingId,
        amount: totalPrice,
        mentorName,
        studentName: user.name,
        studentEmail: user.email,
      });
      
      // Close modal after successful payment initiation
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      onClose();
      
    } catch (error: any) {
      console.error('=== PAYMENT INITIATION ERROR ===');
      console.error('Error:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('================================');
      
      // Don't show another error toast if the error is already handled by Razorpay utility
      if (!error.message?.includes('Payment initiation failed')) {
        toast.error('Payment setup failed. Please try again.');
      }
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleNext = () => {
    if (step === 1 && !formData.duration) {
      toast.error('Please select a duration');
      return;
    }
    if (step === 2 && (!formData.selectedDate || !formData.selectedTime)) {
      toast.error('Please select a date and time');
      return;
    }
    
    // Additional validation for step 2
    if (step === 2) {
      const testDate = new Date(`${formData.selectedDate}T${formData.selectedTime}:00`);
      if (isNaN(testDate.getTime())) {
        toast.error('Invalid date or time format');
        return;
      }
      if (testDate < new Date()) {
        toast.error('Cannot book sessions in the past');
        return;
      }
    }
    
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleBooking();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleBooking = () => {
    console.log('=== BOOKING STARTED ===');
    console.log('Form data:', JSON.stringify(formData, null, 2));
    console.log('Mentor object keys:', Object.keys(mentor));
    console.log('Full mentor object:', JSON.stringify(mentor, null, 2));
    
    const startTime = new Date(`${formData.selectedDate}T${formData.selectedTime}:00`);
    const hourlyRate = mentor.pricePerHour || mentor.hourlyRate || mentor.hourly_rate || 500; // Fallback rate
    const priceTotal = Number(hourlyRate) * (formData.duration / 60);
    
    console.log('Mentor data debug:');
    console.log('  - mentor.pricePerHour:', mentor.pricePerHour);
    console.log('  - mentor.hourlyRate:', mentor.hourlyRate);
    console.log('  - mentor.hourly_rate:', mentor.hourly_rate);
    
    console.log('Initial calculations:');
    console.log('  Start time string:', `${formData.selectedDate}T${formData.selectedTime}:00`);
    console.log('  Start time object:', startTime);
    console.log('  Hourly rate found:', hourlyRate);
    console.log('  Price calculation:', hourlyRate, 'x', (formData.duration / 60), '=', priceTotal);
    
    const preQuestions = formData.preQuestions.filter(q => q.trim());
    
    // Validation with debugging
    console.log('=== VALIDATION CHECKS ===');
    
    console.log('1. Checking start time:', startTime, 'isValid:', !isNaN(startTime.getTime()));
    if (!startTime || isNaN(startTime.getTime())) {
      console.error('VALIDATION FAILED: Invalid date/time');
      toast.error('Invalid date/time selected');
      return;
    }
    
    console.log('2. Checking price:', priceTotal, 'isNaN:', isNaN(priceTotal), 'isPositive:', priceTotal > 0);
    if (isNaN(priceTotal)) {
      console.error('VALIDATION FAILED: Price is NaN');
      toast.error('Invalid price calculation - price is not a number');
      return;
    }
    
    if (priceTotal <= 0) {
      console.error('VALIDATION FAILED: Price is not positive:', priceTotal);
      toast.error('Invalid price calculation - price must be positive');
      return;
    }
    
    const mentorId = mentor.id || mentor.mentorId;
    console.log('3. Checking mentor ID:', mentorId);
    if (!mentorId) {
      console.error('VALIDATION FAILED: Mentor ID not found');
      console.log('Mentor object:', JSON.stringify(mentor, null, 2));
      toast.error('Mentor ID not found');
      return;
    }
    
    console.log('4. Checking duration:', formData.duration);
    if (!formData.duration || formData.duration < 30 || formData.duration > 180) {
      console.error('VALIDATION FAILED: Invalid duration:', formData.duration);
      toast.error('Duration must be between 30 and 180 minutes');
      return;
    }
    
    console.log('✅ All validations passed!');
    console.log('==========================');
    
    const payload = {
      mentorId: mentorId, // Use the validated mentor ID
      startTime: startTime.toISOString(),
      durationMin: formData.duration,
      preQuestions: preQuestions.length > 0 ? preQuestions : [],
      priceTotal: Math.round(priceTotal)
    };
    
    console.log('=== BOOKING DEBUG INFO ===');
    console.log('Mentor object:', JSON.stringify(mentor, null, 2));
    console.log('Mentor ID:', mentor.id);
    console.log('Mentor hourlyRate:', mentor.hourlyRate);
    console.log('Start time object:', startTime?.toISOString());
    console.log('Start time ISO:', startTime?.toISOString());
    console.log('Duration:', formData.duration);
    console.log('Price calculation:', hourlyRate, 'x', (formData.duration / 60), '=', priceTotal);
    console.log('Pre questions:', JSON.stringify(preQuestions));
    console.log('Final payload:', JSON.stringify(payload, null, 2));
    console.log('Payload validation:');
    console.log('  - mentorId type:', typeof payload.mentorId, 'value:', payload.mentorId);
    console.log('  - startTime type:', typeof payload.startTime, 'value:', payload.startTime);
    console.log('  - durationMin type:', typeof payload.durationMin, 'value:', payload.durationMin);
    console.log('  - preQuestions type:', typeof payload.preQuestions, 'value:', payload.preQuestions);
    console.log('  - priceTotal type:', typeof payload.priceTotal, 'value:', payload.priceTotal);
    console.log('========================');
    
    createBookingMutation.mutate(payload);
  };

  const addPreQuestion = () => {
    setFormData({
      ...formData,
      preQuestions: [...formData.preQuestions, '']
    });
  };

  const updatePreQuestion = (index: number, value: string) => {
    const newQuestions = [...formData.preQuestions];
    newQuestions[index] = value;
    setFormData({
      ...formData,
      preQuestions: newQuestions
    });
  };

  const removePreQuestion = (index: number) => {
    const newQuestions = formData.preQuestions.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      preQuestions: newQuestions.length > 0 ? newQuestions : ['']
    });
  };

  const getDurationPrice = (duration: number) => {
    try {
      // Debug logging
      console.log('Mentor object in BookingModal:', JSON.stringify(mentor, null, 2));
      console.log('Mentor.pricePerHour:', mentor.pricePerHour);
      console.log('Mentor.hourlyRate:', mentor.hourlyRate);
      console.log('Mentor.hourly_rate:', mentor.hourly_rate);
      
      const hourlyRate = mentor.pricePerHour || mentor.hourlyRate || mentor.hourly_rate || 500; // Fallback to 500 if not found
      console.log('Final hourlyRate used:', hourlyRate);
      if (isNaN(hourlyRate) || !duration) return 0;
      const price = Math.round(Number(hourlyRate) * (duration / 60));
      return isNaN(price) ? 0 : price;
    } catch (error) {
      console.error('Error in getDurationPrice:', error);
      return 0;
    }
  };

  const totalPrice = getDurationPrice(formData.duration || 60); // Default to 60 if somehow 0

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              {(mentor.user?.avatar || mentor.avatar) ? (
                <img 
                  src={mentor.user?.avatar || mentor.avatar} 
                  alt={mentor.user?.name || mentor.name || 'Mentor'}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <User className="w-5 h-5 text-blue-600" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Book Session</h2>
              <p className="text-sm text-gray-500">with {mentor.user?.name || mentor.name || 'Unknown Mentor'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  stepNum === step
                    ? 'bg-blue-600 text-white'
                    : stepNum < step
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {stepNum < step ? <Check className="w-4 h-4" /> : stepNum}
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  stepNum === step ? 'text-blue-600' : stepNum < step ? 'text-green-600' : 'text-gray-500'
                }`}>
                  {stepNum === 1 ? 'Duration' : stepNum === 2 ? 'Schedule' : 'Details'}
                </span>
                {stepNum < 3 && <ArrowRight className="w-4 h-4 text-gray-300 ml-4" />}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Duration Selection */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Duration</h3>
                <div className="grid grid-cols-2 gap-4">
                  {DURATION_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setFormData({ ...formData, duration: option.value })}
                      className={`p-4 border-2 rounded-lg text-left transition-colors ${
                        formData.duration === option.value
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">{option.label}</div>
                          <div className="text-sm text-gray-500">
                            Perfect for {option.value === 30 ? 'quick questions' : 
                                       option.value === 60 ? 'focused discussion' :
                                       option.value === 90 ? 'deep dive session' : 'comprehensive review'}
                          </div>
                        </div>
                        <div className="text-lg font-bold text-green-600">
                          ₹{getDurationPrice(option.value) || 0}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Schedule Selection */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Date & Time</h3>
                
                {/* Date Selection */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Available Dates</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot.date}
                        onClick={() => setFormData({ ...formData, selectedDate: slot.date, selectedTime: '' })}
                        className={`p-3 text-sm rounded-lg border text-center ${
                          formData.selectedDate === slot.date
                            ? 'border-blue-600 bg-blue-50 text-blue-600'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {slot.dateLabel}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time Selection */}
                {formData.selectedDate && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Available Times</h4>
                    <div className="grid grid-cols-4 gap-2">
                      {availableSlots
                        .find(slot => slot.date === formData.selectedDate)
                        ?.times.map((time) => (
                          <button
                            key={time}
                            onClick={() => setFormData({ ...formData, selectedTime: time })}
                            className={`p-2 text-sm rounded border ${
                              formData.selectedTime === time
                                ? 'border-blue-600 bg-blue-50 text-blue-600'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            {time}
                          </button>
                        ))
                      }
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Pre-questions and Confirmation */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Details</h3>
                
                {/* Booking Summary */}
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Booking Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-medium">{formData.duration} minutes</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date & Time:</span>
                      <span className="font-medium">
                        {formData.selectedDate && formData.selectedTime ? 
                          new Date(`${formData.selectedDate}T${formData.selectedTime}`).toLocaleString() : 
                          'Not selected'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Rate:</span>
                      <span className="font-medium">₹{mentor.pricePerHour || mentor.hourlyRate || mentor.hourly_rate || 500}/hour</span>
                    </div>
                    <div className="flex justify-between font-semibold border-t border-gray-200 pt-2">
                      <span>Total:</span>
                      <span>₹{totalPrice}</span>
                    </div>
                  </div>
                </div>

                {/* Pre-questions */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">
                    Questions for the Mentor (Optional)
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Help your mentor prepare better by sharing what you'd like to discuss
                  </p>
                  
                  <div className="space-y-3">
                    {formData.preQuestions.map((question, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <input
                          type="text"
                          value={question}
                          onChange={(e) => updatePreQuestion(index, e.target.value)}
                          placeholder={`Question ${index + 1}`}
                          className="input flex-1"
                        />
                        {formData.preQuestions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removePreQuestion(index)}
                            className="text-red-600 hover:text-red-700 p-2"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {formData.preQuestions.length < 5 && (
                    <button
                      type="button"
                      onClick={addPreQuestion}
                      className="mt-3 text-sm text-blue-600 hover:text-blue-700"
                    >
                      + Add another question
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {step > 1 && (
              <button
                onClick={handleBack}
                disabled={createBookingMutation.isPending || isProcessingPayment}
                className="btn btn-secondary flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {step < 3 ? (
              <div className="text-lg font-semibold text-green-600">
                ₹{totalPrice || 0}
              </div>
            ) : null}
            
            <button
              onClick={handleNext}
              disabled={createBookingMutation.isPending || isProcessingPayment}
              className="btn btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createBookingMutation.isPending || isProcessingPayment ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>{isProcessingPayment ? 'Processing Payment...' : 'Creating Booking...'}</span>
                </>
              ) : (
                <>
                  <span>{step === 3 ? 'Book & Pay' : 'Next'}</span>
                  {step < 3 && <ArrowRight className="w-4 h-4" />}
                  {step === 3 && <CreditCard className="w-4 h-4" />}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}