import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import HeroSection from '@/components/home/HeroSection';
import WhySection from '@/components/home/WhySection';
import HowItWorks from '@/components/home/HowItWorks';
import PredictionTypes from '@/components/home/PredictionTypes';
import AccuracyProof from '@/components/home/AccuracyProof';
import TestimonialsPreview from '@/components/home/TestimonialsPreview';
import DownloadSection from '@/components/home/DownloadSection';
import CTASection from '@/components/home/CTASection';

export async function generateMetadata({ params }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'home' });
    const isTA = locale === 'ta';

    return {
        title: isTA
            ? 'S&B ஆஸ்ட்ரோ — வேத விளையாட்டு ஜோதிட கணிப்புகள்'
            : 'S&B Astro — Vedic Sports Astrology Predictions',
        description: isTA
            ? 'இந்தியாவின் நம்பகமான கிரிக்கெட் ஜோதிட கணிப்பு தளம். 10+ ஆண்டுகள் அனுபவம், 90% துல்லியம்.'
            : 'India\'s most trusted cricket astrology prediction platform. 10+ years of experience, 90% accuracy. Vedic match winner predictions.',
        keywords: isTA
            ? ['கிரிக்கெட் ஜோதிடம்', 'போட்டி ஜோதிட கணிப்பு', 'விளையாட்டு ஜோதிடம்']
            : ['sports astrology prediction', 'cricket astrology prediction', 'vedic sports astrology', 'match winner prediction'],
    };
}

export default function HomePage() {
    return (
        <>
            <HeroSection />
            <WhySection />
            <HowItWorks />
            <PredictionTypes />
            <AccuracyProof />
            <TestimonialsPreview />
            <DownloadSection />
            <CTASection />
        </>
    );
}
