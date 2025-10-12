'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, ChevronDown, Loader2 } from 'lucide-react';
import { mentorsAPI } from '@/lib/api';
import MentorCard from '@/components/MentorCard';
import Navbar from '@/components/Navbar';
import { MentorCard as MentorCardType } from '@/types';

export default function MentorsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [domain, setDomain] = useState('');
  const [tier, setTier] = useState('');
  const [minPrice, setMinPrice] = useState<number | undefined>();
  const [maxPrice, setMaxPrice] = useState<number | undefined>();
  const [sort, setSort] = useState('rating');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const { data: mentorsResponse, isLoading, error } = useQuery({
    queryKey: ['mentors', searchQuery, domain, tier, minPrice, maxPrice, sort, page],
    queryFn: () => mentorsAPI.getMentors({
      q: searchQuery || undefined,
      domain: domain || undefined,
      tier: tier || undefined,
      minPrice,
      maxPrice,
      sort,
      page,
      limit: 12
    }),
  });

  const mentors = mentorsResponse?.data.data.mentors || [];
  const pagination = mentorsResponse?.data.data.pagination;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setDomain('');
    setTier('');
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setSort('rating');
    setPage(1);
  };

  const transformMentorData = (mentor: any): MentorCardType => {
    console.log('Transforming mentor data:', JSON.stringify(mentor));
    
    // Handle different mentor data structures
    const mentorUser = mentor.user || mentor;
    
    return {
      id: mentor.id || mentor._id,
      name: mentorUser.name || mentor.name || 'Unknown Mentor',
      avatar: mentorUser.avatar || mentor.avatar || '/default-avatar.png',
      bio: mentor.bio || 'No bio available',
      expertise: mentor.expertise || [],
      experience: mentor.experience || 0,
      tier: mentor.tier || 'TIER3',
      pricePerHour: mentor.pricePerHour || mentor.hourlyRate || 0,
      rating: mentor.rating || 0,
      totalReviews: mentor.totalReviews || mentor.reviewCount || 0,
      isAvailable: mentor.isAvailable !== undefined ? mentor.isAvailable : true
    };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Your Perfect Mentor</h1>
          <p className="text-lg text-gray-600">
            Discover expert mentors who can guide you to success
          </p>
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            {/* Search Bar */}
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name, skills, or expertise..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input pl-10 w-full"
                />
              </div>
              <button type="submit" className="btn btn-primary px-6">
                Search
              </button>
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="btn btn-secondary px-4 flex items-center space-x-2"
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Domain</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tier</label>
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price Range (₹/hour)</label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={minPrice || ''}
                      onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : undefined)}
                      className="input w-full"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={maxPrice || ''}
                      onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : undefined)}
                      className="input w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="input w-full"
                  >
                    <option value="rating">Highest Rated</option>
                    <option value="price">Price: Low to High</option>
                    <option value="-price">Price: High to Low</option>
                    <option value="experience">Most Experienced</option>
                    <option value="reviews">Most Reviews</option>
                  </select>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex items-center justify-between pt-2">
              <div className="text-sm text-gray-500">
                {mentorsResponse && (
                  <>Showing {pagination?.count || 0} of {pagination?.totalCount || 0} mentors</>
                )}
              </div>
              <button
                type="button"
                onClick={resetFilters}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Reset Filters
              </button>
            </div>
          </form>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Finding mentors...</span>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">Failed to load mentors</p>
            <button 
              onClick={() => window.location.reload()} 
              className="btn btn-primary"
            >
              Try Again
            </button>
          </div>
        ) : mentors.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">No mentors found matching your criteria</p>
            <button onClick={resetFilters} className="btn btn-primary">
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            {/* Mentors Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {mentors.map((mentor: any) => (
                <MentorCard 
                  key={mentor.id} 
                  mentor={transformMentorData(mentor)}
                />
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                <div className="flex space-x-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(pagination.totalPages - 4, page - 2)) + i;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`px-3 py-2 text-sm rounded-lg ${
                          pageNum === page
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === pagination.totalPages}
                  className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}