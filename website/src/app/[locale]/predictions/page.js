import { getTranslations } from 'next-intl/server';
import PredictionsClient from '@/components/pages/PredictionsClient';

export async function generateMetadata({ params }) {
    const { locale } = await params;
    return {
        title: locale === 'ta' ? 'கணிப்புகள்' : 'Predictions',
        description: locale === 'ta'
            ? 'கிரிக்கெட் போட்டி கணிப்புகள் — வேத ஜோதிடம் மூலம் வெற்றியாளரை கணிக்கவும்'
            : 'Cricket match predictions powered by Vedic astrology. Buy accurate winner predictions.',
    };
}

export default function PredictionsPage() {
    return <PredictionsClient />;
}
