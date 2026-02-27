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
            ? 'S&B ஆஸ்ட்ரோ — நிபுணர் கிரிக்கெட் போட்டி ஆய்வு மற்றும் ஜோதிட நுண்ணறிவு'
            : 'S&B Astro — Expert Cricket Match Analysis & Vedic Insights',
        description: isTA
            ? 'இந்தியாவின் முதன்மையான விளையாட்டு ஜோதிட ஆய்வு தளம். துல்லியமான போட்டி நுண்ணறிவு, வீரர் ஆய்வு மற்றும் நேரடி கிரிக்கெட் செய்திகள்.'
            : 'India\'s premier sports astrology analysis platform. Get expert match insights, player analysis, and live cricket updates powered by Vedic science.',
        keywords: isTA
            ? ['கிரிக்கெட் ஆய்வு', 'போட்டி நுண்ணறிவு', 'விளையாட்டு ஜோதிடம்', 'நிபுணர் கிரிக்கெட் ஆய்வு', 'நேரடி ஸ்கோர் ஆய்வு']
            : ['cricket match analysis', 'expert match insights', 'vedic sports analysis', 'cricket expert report', 'live score analysis', 'IPL match analysis'],
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
