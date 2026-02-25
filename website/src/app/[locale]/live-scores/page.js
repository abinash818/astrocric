import { getTranslations } from 'next-intl/server';
import LiveScoresClient from '@/components/pages/LiveScoresClient';

export async function generateMetadata({ params }) {
    const { locale } = await params;
    return {
        title: locale === 'ta' ? 'நேரடி ஸ்கோர்கள்' : 'Live Scores',
        description: locale === 'ta'
            ? 'கிரிக்கெட் போட்டிகளின் நேரடி ஸ்கோர்கள் மற்றும் ஜோதிட கணிப்புகள்'
            : 'Live cricket match scores with astrology predictions. Real-time updates.',
    };
}

export default function LiveScoresPage() {
    return <LiveScoresClient />;
}
