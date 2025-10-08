import { Video, Calendar, CreditCard, Award } from 'lucide-react';

export function FeaturesSection() {
  const features = [
    {
      icon: Video,
      title: 'Live Sessions',
      description: 'Engage in real-time video sessions with your mentors for interactive learning.',
    },
    {
      icon: Calendar,
      title: 'Flexible Scheduling',
      description: 'Book sessions at your convenience with our easy-to-use scheduling system.',
    },
    {
      icon: CreditCard,
      title: 'Secure Payments',
      description: 'Safe and secure payment processing with multiple payment options.',
    },
    {
      icon: Award,
      title: 'Verified Mentors',
      description: 'All mentors are thoroughly vetted and have proven track records.',
    },
  ];

  return (
    <section className="py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
          Why Choose EdVisor?
        </h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          We provide everything you need for a successful mentorship experience
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div key={index} className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="bg-gradient-to-r from-primary-500 to-secondary-500 p-3 rounded-full w-fit mb-4">
                <Icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}