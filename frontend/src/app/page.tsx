'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Search, Star, Users, BookOpen, Trophy, CheckCircle } from 'lucide-react';
import { leaderboardAPI } from '@/lib/api';
import MentorCard from '@/components/MentorCard';
import Navbar from '@/components/Navbar';
import { MentorCard as MentorCardType } from '@/types';

export default function HomePage() {
  const { data: leaderboard } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => leaderboardAPI.getLeaderboard({ limit: 6 }),
  });

  const topMentors = leaderboard?.data.data.leaderboard || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Find Your Perfect
              <span className="text-blue-200"> Mentor</span>
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Connect with expert mentors for personalized learning, career guidance, 
              and skill development. Start your journey to success today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link
                href="/mentors"
                className="btn bg-white text-blue-600 hover:bg-blue-50 px-8 py-3 text-lg flex items-center justify-center space-x-2"
              >
                <Search className="w-5 h-5" />
                <span>Find Mentors</span>
              </Link>
              <Link
                href="/auth/login"
                className="btn border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-3 text-lg"
              >
                Student Login
              </Link>
            </div>
            
            {/* Role-based login links */}
            <div className="flex flex-wrap gap-2 justify-center text-sm">
              <Link
                href="/mentor/login"
                className="text-blue-200 hover:text-white underline"
              >
                Mentor Login
              </Link>
              <span className="text-blue-300">•</span>
              <Link
                href="/admin/login"
                className="text-blue-200 hover:text-white underline"
              >
                Admin Login
              </Link>
              <span className="text-blue-300">•</span>
              <Link
                href="/mentor/signup"
                className="text-blue-200 hover:text-white underline"
              >
                Become a Mentor
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get started with EdVisor in just three simple steps
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                1. Find Your Mentor
              </h3>
              <p className="text-gray-600">
                Browse through our curated list of expert mentors. Filter by domain, 
                experience, price, and ratings to find the perfect match.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <BookOpen className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                2. Book a Session
              </h3>
              <p className="text-gray-600">
                Schedule a session at your convenience. Choose from 1-on-1 mentoring, 
                group sessions, or project reviews based on your needs.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trophy className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                3. Achieve Your Goals
              </h3>
              <p className="text-gray-600">
                Learn from industry experts, get personalized guidance, and accelerate 
                your career growth with actionable insights.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Top Mentors Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Top-Rated Mentors
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Learn from the best in the industry
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {topMentors.map((mentor: any) => (
              <MentorCard 
                key={mentor.mentorId} 
                mentor={{
                  id: mentor.mentorId,
                  name: mentor.name,
                  bio: `Experienced ${mentor.expertise.split(',')[0]} expert with ${mentor.tier === 'TIER1' ? 'premium' : 'standard'} tier rating`,
                  expertise: mentor.expertise,
                  experience: 5 + mentor.rank,
                  tier: mentor.tier,
                  pricePerHour: mentor.tier === 'TIER1' ? 90 : mentor.tier === 'TIER2' ? 60 : 45,
                  rating: mentor.rating,
                  totalReviews: mentor.totalReviews,
                  isAvailable: true
                } as MentorCardType}
              />
            ))}
          </div>
          
          <div className="text-center">
            <Link
              href="/mentors"
              className="btn btn-primary px-8 py-3 text-lg inline-flex items-center space-x-2"
            >
              <span>View All Mentors</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">500+</div>
              <div className="text-blue-200">Expert Mentors</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">10K+</div>
              <div className="text-blue-200">Sessions Completed</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">4.8⭐</div>
              <div className="text-blue-200">Average Rating</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">50+</div>
              <div className="text-blue-200">Skill Domains</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Ready to Start Learning?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of students who are already learning from industry experts.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/signup"
              className="btn btn-primary px-8 py-3 text-lg"
            >
              Sign Up Free
            </Link>
            <Link
              href="/mentors"
              className="btn btn-secondary px-8 py-3 text-lg"
            >
              Browse Mentors
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">EdVisor</span>
              </div>
              <p className="text-gray-400">
                Connecting students with expert mentors for personalized learning.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">For Students</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/mentors" className="hover:text-white">Find Mentors</Link></li>
                <li><Link href="/leaderboard" className="hover:text-white">Top Mentors</Link></li>
                <li><Link href="/auth/signup" className="hover:text-white">Sign Up</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 EdVisor. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
