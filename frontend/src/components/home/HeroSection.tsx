import Link from 'next/link';
import { ArrowRight, Users, Star, BookOpen } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="text-center py-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-800 mb-6">
          Learn from the{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-600">
            Best Mentors
          </span>
        </h1>
        
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Connect with industry experts and accelerate your learning journey. 
          Get personalized guidance, expert insights, and career advice from top-tier mentors.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link 
            href="/mentors"
            className="bg-primary-600 text-white px-8 py-3 rounded-lg hover:bg-primary-700 transition-all duration-200 font-semibold flex items-center justify-center gap-2 group"
          >
            Find Your Mentor
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          
          <Link 
            href="/auth/register"
            className="border-2 border-primary-600 text-primary-600 px-8 py-3 rounded-lg hover:bg-primary-600 hover:text-white transition-all duration-200 font-semibold"
          >
            Become a Mentor
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
          <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-lg">
            <div className="bg-primary-100 p-3 rounded-full mb-4">
              <Users className="h-6 w-6 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Expert Mentors</h3>
            <p className="text-gray-600 text-center">
              Learn from industry professionals with years of experience
            </p>
          </div>

          <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-lg">
            <div className="bg-secondary-100 p-3 rounded-full mb-4">
              <Star className="h-6 w-6 text-secondary-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Quality Guaranteed</h3>
            <p className="text-gray-600 text-center">
              All mentors are verified and rated by our community
            </p>
          </div>

          <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-lg">
            <div className="bg-purple-100 p-3 rounded-full mb-4">
              <BookOpen className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Personalized Learning</h3>
            <p className="text-gray-600 text-center">
              Get customized guidance tailored to your goals and needs
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}