import Link from 'next/link';
import { Star, ArrowRight } from 'lucide-react';

export function MentorsSection() {
  // Mock mentor data - in real app this would come from API
  const featuredMentors = [
    {
      id: '1',
      name: 'Sarah Chen',
      expertise: ['React', 'Node.js', 'System Design'],
      rating: 4.9,
      totalReviews: 45,
      tier: 'TIER1',
      hourlyRate: 8000, // in cents
    },
    {
      id: '2',
      name: 'Marcus Johnson',
      expertise: ['Python', 'Machine Learning', 'Data Science'],
      rating: 4.8,
      totalReviews: 32,
      tier: 'TIER2',
      hourlyRate: 6000,
    },
    {
      id: '3',
      name: 'Elena Rodriguez',
      expertise: ['Product Management', 'Strategy', 'Leadership'],
      rating: 5.0,
      totalReviews: 28,
      tier: 'TIER1',
      hourlyRate: 9000,
    },
  ];

  return (
    <section className="py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
          Meet Our Top Mentors
        </h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Learn from industry experts who have helped hundreds of students achieve their goals
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        {featuredMentors.map((mentor) => (
          <div key={mentor.id} className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {mentor.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-semibold text-gray-800">{mentor.name}</h3>
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="text-sm text-gray-600 ml-1">
                    {mentor.rating} ({mentor.totalReviews} reviews)
                  </span>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                {mentor.expertise.slice(0, 3).map((skill) => (
                  <span
                    key={skill}
                    className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div>
                <span className="text-lg font-bold text-gray-800">
                  ₹{mentor.hourlyRate / 100}
                </span>
                <span className="text-sm text-gray-600">/hour</span>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${
                mentor.tier === 'TIER1' 
                  ? 'bg-yellow-100 text-yellow-800' 
                  : mentor.tier === 'TIER2'
                  ? 'bg-gray-100 text-gray-800'
                  : 'bg-orange-100 text-orange-800'
              }`}>
                {mentor.tier}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center">
        <Link 
          href="/mentors"
          className="bg-primary-600 text-white px-8 py-3 rounded-lg hover:bg-primary-700 transition-all duration-200 font-semibold inline-flex items-center gap-2 group"
        >
          View All Mentors
          <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </section>
  );
}