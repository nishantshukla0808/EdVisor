'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Star, User, Send } from 'lucide-react';
import { reviewsAPI } from '@/lib/api';
import toast from 'react-hot-toast';

interface ReviewModalProps {
  booking: any;
  onClose: () => void;
}

export default function ReviewModal({ booking, onClose }: ReviewModalProps) {
  const [ratings, setRatings] = useState({
    rating: 0,
    clarity: 0,
    relevance: 0,
    roadmap: 0
  });
  const [comment, setComment] = useState('');
  const [hoveredRating, setHoveredRating] = useState<{[key: string]: number}>({});

  const queryClient = useQueryClient();

  const reviewMutation = useMutation({
    mutationFn: reviewsAPI.createReview,
    onSuccess: () => {
      toast.success('Review submitted successfully!');
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to submit review');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (ratings.rating === 0 || ratings.clarity === 0 || ratings.relevance === 0 || ratings.roadmap === 0) {
      toast.error('Please provide all ratings');
      return;
    }

    reviewMutation.mutate({
      bookingId: booking.id,
      ...ratings,
      comment: comment.trim() || undefined
    });
  };

  const setRating = (category: string, value: number) => {
    setRatings(prev => ({
      ...prev,
      [category]: value
    }));
  };

  const RatingStars = ({ 
    category, 
    value, 
    onChange,
    label,
    description 
  }: { 
    category: string;
    value: number;
    onChange: (value: number) => void;
    label: string;
    description: string;
  }) => {
    const hovered = hoveredRating[category] || 0;
    
    return (
      <div className="space-y-2">
        <div>
          <h4 className="font-medium text-gray-900">{label}</h4>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
        <div className="flex items-center space-x-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              onMouseEnter={() => setHoveredRating(prev => ({ ...prev, [category]: star }))}
              onMouseLeave={() => setHoveredRating(prev => ({ ...prev, [category]: 0 }))}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <Star
                className={`w-6 h-6 transition-colors ${
                  star <= (hovered || value)
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-300'
                }`}
              />
            </button>
          ))}
          <span className="ml-2 text-sm text-gray-600">
            {value > 0 && (
              <>
                {value}/5
                {value === 1 && ' - Poor'}
                {value === 2 && ' - Fair'}
                {value === 3 && ' - Good'}
                {value === 4 && ' - Very Good'}
                {value === 5 && ' - Excellent'}
              </>
            )}
          </span>
        </div>
      </div>
    );
  };

  const averageRating = Object.values(ratings).reduce((sum, rating) => sum + rating, 0) / 4;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              {booking.mentor?.avatar ? (
                <img 
                  src={booking.mentor.avatar} 
                  alt={booking.mentor.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <User className="w-5 h-5 text-blue-600" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Leave a Review</h2>
              <p className="text-sm text-gray-500">
                Session with {booking.mentor?.name || 'Mentor'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Session Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">
              <div className="flex justify-between mb-1">
                <span>Session Date:</span>
                <span className="font-medium">
                  {new Date(booking.startTime).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Duration:</span>
                <span className="font-medium">
                  {Math.round((new Date(booking.endTime).getTime() - new Date(booking.startTime).getTime()) / (1000 * 60))} minutes
                </span>
              </div>
            </div>
          </div>

          {/* Overall Rating */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">How was your session?</h3>
            {averageRating > 0 && (
              <div className="flex items-center justify-center space-x-2 mb-4">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-8 h-8 ${
                        star <= Math.round(averageRating)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xl font-semibold text-gray-900">
                  {averageRating.toFixed(1)}/5
                </span>
              </div>
            )}
          </div>

          {/* Detailed Ratings */}
          <div className="space-y-6">
            <RatingStars
              category="rating"
              value={ratings.rating}
              onChange={(value) => setRating('rating', value)}
              label="Overall Experience"
              description="How satisfied are you with the overall session?"
            />

            <RatingStars
              category="clarity"
              value={ratings.clarity}
              onChange={(value) => setRating('clarity', value)}
              label="Clarity of Explanation"
              description="How clear and understandable were the mentor's explanations?"
            />

            <RatingStars
              category="relevance"
              value={ratings.relevance}
              onChange={(value) => setRating('relevance', value)}
              label="Relevance to Goals"
              description="How relevant was the session content to your learning goals?"
            />

            <RatingStars
              category="roadmap"
              value={ratings.roadmap}
              onChange={(value) => setRating('roadmap', value)}
              label="Career Guidance"
              description="How helpful was the career guidance and roadmap provided?"
            />
          </div>

          {/* Written Review */}
          <div>
            <label htmlFor="comment" className="block font-medium text-gray-900 mb-2">
              Share your experience (optional)
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell others about your experience with this mentor..."
              rows={4}
              className="input w-full resize-none"
            />
            <p className="text-sm text-gray-500 mt-1">
              Your review will help other students make better decisions.
            </p>
          </div>

          {/* Quick Feedback Tags */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">What stood out? (Optional)</h4>
            <div className="flex flex-wrap gap-2">
              {[
                'Great communication',
                'Very knowledgeable',
                'Practical advice',
                'Patient & supportive',
                'Well prepared',
                'Industry insights',
                'Clear explanations',
                'Actionable feedback'
              ].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className="px-3 py-1 bg-gray-100 hover:bg-blue-50 hover:text-blue-600 text-gray-700 text-sm rounded-full transition-colors"
                  onClick={() => {
                    const tagText = `#${tag.replace(/ /g, '')} `;
                    if (!comment.includes(tagText)) {
                      setComment(prev => prev + tagText);
                    }
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={reviewMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={reviewMutation.isPending || Object.values(ratings).some(rating => rating === 0)}
              className="btn btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {reviewMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Review</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}