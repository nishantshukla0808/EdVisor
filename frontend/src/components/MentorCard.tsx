import Link from 'next/link';
import { Star, User, Badge, ArrowRight } from 'lucide-react';
import { MentorCard as MentorCardType } from '@/types';

interface MentorCardProps {
  mentor: MentorCardType;
}

export default function MentorCard({ mentor }: MentorCardProps) {
  // Convert expertise string to array for display
  const expertiseList = mentor.expertise.split(',').map(skill => skill.trim());
  
  // Get tier color
  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'TIER1':
        return 'badge-success';
      case 'TIER2':
        return 'badge-primary';
      case 'TIER3':
        return 'badge-warning';
      default:
        return 'badge-primary';
    }
  };

  return (
    <div className="card p-6 hover:shadow-md transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            {mentor.avatar ? (
              <img 
                src={mentor.avatar} 
                alt={mentor.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <User className="w-6 h-6 text-blue-600" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{mentor.name}</h3>
            <p className="text-sm text-gray-500">{mentor.experience} years experience</p>
          </div>
        </div>
        
        <div className={`badge ${getTierColor(mentor.tier)}`}>
          {mentor.tier}
        </div>
      </div>

      {/* Bio */}
      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
        {mentor.bio}
      </p>

      {/* Expertise */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          {expertiseList.slice(0, 3).map((skill, index) => (
            <span 
              key={index}
              className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
            >
              {skill}
            </span>
          ))}
          {expertiseList.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
              +{expertiseList.length - 3} more
            </span>
          )}
        </div>
      </div>

      {/* Rating & Reviews */}
      <div className="flex items-center space-x-1 mb-4">
        <div className="flex items-center">
          {[...Array(5)].map((_, i) => (
            <Star 
              key={i}
              className={`w-4 h-4 ${
                i < Math.floor(mentor.rating) 
                  ? 'text-yellow-400 fill-current' 
                  : 'text-gray-300'
              }`}
            />
          ))}
        </div>
        <span className="text-sm font-medium text-gray-900">{mentor.rating}</span>
        <span className="text-sm text-gray-500">({mentor.totalReviews} reviews)</span>
      </div>

      {/* Price & CTA */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-2xl font-bold text-gray-900">₹{mentor.pricePerHour}</span>
          <span className="text-sm text-gray-500">/hour</span>
        </div>
        
        <Link
          href={`/mentors/${mentor.id}`}
          className="btn btn-primary flex items-center space-x-2"
        >
          <span>View Profile</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Availability indicator */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${mentor.isAvailable ? 'bg-green-400' : 'bg-red-400'}`} />
          <span className="text-xs text-gray-500">
            {mentor.isAvailable ? 'Available now' : 'Unavailable'}
          </span>
        </div>
      </div>
    </div>
  );
}