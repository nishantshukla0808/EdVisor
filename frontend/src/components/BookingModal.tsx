'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Calendar, Clock, CreditCard, User, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { bookingsAPI, paymentsAPI } from '@/lib/api';
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
    onSuccess: (response) => {
      const booking = response.data.data.booking;
      toast.success('Booking created successfully!');
      
      // Initiate payment
      initiatePayment(booking.id);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create booking');
    },
  });

  const paymentMutation = useMutation({
    mutationFn: paymentsAPI.initiatePayment,
    onSuccess: () => {
      toast.success('Payment initiated! Redirecting...');
      // In real app, would redirect to payment gateway
      setTimeout(() => {
        // Simulate payment success
        toast.success('Payment successful! Booking confirmed.');
        queryClient.invalidateQueries({ queryKey: ['bookings'] });
        onClose();
      }, 2000);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Payment initiation failed');
    },
  });

  const initiatePayment = (bookingId: string) => {
    paymentMutation.mutate({ bookingId });
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
    const startTime = new Date(`${formData.selectedDate}T${formData.selectedTime}:00`);
    const priceTotal = mentor.hourlyRate * (formData.duration / 60);
    
    const preQuestions = formData.preQuestions.filter(q => q.trim());
    
    createBookingMutation.mutate({
      mentorId: mentor.id,
      startTime: startTime.toISOString(),
      durationMin: formData.duration,
      preQuestions: preQuestions.length > 0 ? preQuestions : undefined,
      priceTotal: Math.round(priceTotal)
    });
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
    return Math.round(mentor.hourlyRate * (duration / 60));
  };

  const totalPrice = getDurationPrice(formData.duration);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              {mentor.user.avatar ? (
                <img 
                  src={mentor.user.avatar} 
                  alt={mentor.user.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <User className="w-5 h-5 text-blue-600" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Book Session</h2>
              <p className="text-sm text-gray-500">with {mentor.user.name}</p>
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
                          ₹{getDurationPrice(option.value)}
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
                        {new Date(`${formData.selectedDate}T${formData.selectedTime}`).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Rate:</span>
                      <span className="font-medium">₹{mentor.hourlyRate}/hour</span>
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
                disabled={createBookingMutation.isPending || paymentMutation.isPending}
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
                ₹{totalPrice}
              </div>
            ) : null}
            
            <button
              onClick={handleNext}
              disabled={createBookingMutation.isPending || paymentMutation.isPending}
              className="btn btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createBookingMutation.isPending || paymentMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>{paymentMutation.isPending ? 'Processing Payment...' : 'Creating Booking...'}</span>
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