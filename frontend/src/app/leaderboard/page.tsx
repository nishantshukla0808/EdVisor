'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Star, Medal, Award, Users, TrendingUp, Filter } from 'lucide-react';
import { leaderboardAPI } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

export default function LeaderboardPage() {
  const [domain, setDomain] = useState('');
  const [tier, setTier] = useState('');

  const { data: leaderboardResponse, isLoading } = useQuery({
    queryKey: ['leaderboard', domain, tier],
    queryFn: () => leaderboardAPI.getLeaderboard({
      domain: domain || undefined,
      tier: tier || undefined,
      limit: 50
    }),
  });

  const { data: statsResponse } = useQuery({
    queryKey: ['leaderboard', 'stats'],
    queryFn: leaderboardAPI.getStats,
  });

  const leaderboard = leaderboardResponse?.data.data.leaderboard || [];
  const stats = statsResponse?.data.data || {};

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-8 h-8 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-8 h-8 text-gray-400" />;
    if (rank === 3) return <Award className="w-8 h-8 text-amber-600" />;
    return (
      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
        <span className="text-sm font-bold text-gray-600">{rank}</span>
      </div>
    );
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'TIER1':
        return 'bg-green-100 text-green-800';
      case 'TIER2':
        return 'bg-blue-100 text-blue-800';
      case 'TIER3':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-gray-600';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-yellow-100 rounded-full">
              <Trophy className="w-12 h-12 text-yellow-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Mentor Leaderboard</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Celebrating our highest-rated mentors who consistently deliver exceptional guidance and support
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <Users className="w-8 h-8 text-blue-600 mx-auto mb-3" />
            <div className="text-2xl font-bold text-gray-900">{stats.totalMentors || 0}</div>
            <div className="text-gray-600">Total Mentors</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <Star className="w-8 h-8 text-yellow-500 mx-auto mb-3" />
            <div className="text-2xl font-bold text-gray-900">{stats.averageRating || 0}⭐</div>
            <div className="text-gray-600">Average Rating</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-3" />
            <div className="text-2xl font-bold text-gray-900">{stats.topRating || 0}⭐</div>
            <div className="text-gray-600">Highest Rating</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Filter className="w-5 h-5 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Domain</label>
              <select
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="input w-full"
              >
                <option value="">All Domains</option>
                <option value="Software Engineering">Software Engineering</option>
                <option value="Data Science">Data Science</option>
                <option value="Product Management">Product Management</option>
                <option value="Design">Design</option>
                <option value="Business">Business</option>
                <option value="Marketing">Marketing</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tier</label>
              <select
                value={tier}
                onChange={(e) => setTier(e.target.value)}
                className="input w-full"
              >
                <option value="">All Tiers</option>
                <option value="TIER1">Tier 1 (Premium)</option>
                <option value="TIER2">Tier 2 (Standard)</option>
                <option value="TIER3">Tier 3 (Basic)</option>
              </select>
            </div>
          </div>
          
          {(domain || tier) && (
            <div className="mt-4">
              <button
                onClick={() => {
                  setDomain('');
                  setTier('');
                }}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>

        {/* Leaderboard */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading leaderboard...</span>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No mentors found</h3>
            <p className="text-gray-600">Try adjusting your filters to see results.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Top 3 */}
            {leaderboard.slice(0, 3).map((mentor: any, index: number) => (
              <div 
                key={mentor.mentorId}
                className={`bg-white rounded-lg shadow-lg overflow-hidden border-l-4 ${
                  index === 0 ? 'border-yellow-500' :
                  index === 1 ? 'border-gray-400' : 'border-amber-600'
                }`}
              >
                <div className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {getRankIcon(mentor.rank)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-bold text-gray-900 truncate">
                          {mentor.name}
                        </h3>
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getTierColor(mentor.tier)}`}>
                          {mentor.tier}
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-400 mr-1 fill-current" />
                          <span className="font-medium">{mentor.rating}</span>
                          <span className="ml-1">({mentor.totalReviews} reviews)</span>
                        </div>
                        <div className="flex items-center">
                          <TrendingUp className="w-4 h-4 text-blue-600 mr-1" />
                          <span className="font-medium">Score: {mentor.score}</span>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <div className="flex flex-wrap gap-2">
                          {mentor.expertise.split(',').slice(0, 3).map((skill: string, skillIndex: number) => (
                            <span 
                              key={skillIndex}
                              className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
                            >
                              {skill.trim()}
                            </span>
                          ))}
                          {mentor.expertise.split(',').length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                              +{mentor.expertise.split(',').length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0">
                      <Link
                        href={`/mentors/${mentor.mentorId}`}
                        className="btn btn-primary"
                      >
                        View Profile
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Rest of the leaderboard */}
            {leaderboard.slice(3).map((mentor: any) => (
              <div key={mentor.mentorId} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="p-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {getRankIcon(mentor.rank)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {mentor.name}
                        </h3>
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTierColor(mentor.tier)}`}>
                          {mentor.tier}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-400 mr-1 fill-current" />
                          <span>{mentor.rating}</span>
                          <span className="ml-1">({mentor.totalReviews})</span>
                        </div>
                        <div className={`font-medium ${getScoreColor(mentor.score)}`}>
                          Score: {mentor.score}
                        </div>
                        <div className="text-xs text-gray-500">
                          Updated: {new Date(mentor.lastUpdated).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0">
                      <Link
                        href={`/mentors/${mentor.mentorId}`}
                        className="btn btn-secondary text-sm"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer Note */}
        <div className="mt-12 bg-blue-50 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">How Rankings Work</h3>
          <p className="text-blue-700 text-sm">
            Our ranking system considers multiple factors including average ratings, total reviews, 
            response time, session completion rate, and student feedback quality. Rankings are updated weekly 
            to ensure the most accurate representation of mentor performance.
          </p>
        </div>
      </div>
    </div>
  );
}