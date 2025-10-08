export function StatsSection() {
  const stats = [
    { label: 'Expert Mentors', value: '50+' },
    { label: 'Students Mentored', value: '500+' },
    { label: 'Average Rating', value: '4.9/5' },
    { label: 'Success Stories', value: '100+' },
  ];

  return (
    <section className="bg-white py-12 rounded-xl shadow-lg">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map((stat, index) => (
          <div key={index} className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">
              {stat.value}
            </div>
            <div className="text-gray-600 font-medium">{stat.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}