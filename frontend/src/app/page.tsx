import { HeroSection } from '@/components/home/HeroSection';
import { FeaturesSection } from '@/components/home/FeaturesSection';
import { MentorsSection } from '@/components/home/MentorsSection';
import { StatsSection } from '@/components/home/StatsSection';

export default function Home() {
  return (
    <div className="space-y-16">
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <MentorsSection />
    </div>
  );
}