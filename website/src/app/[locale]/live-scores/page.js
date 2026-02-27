import { getTranslations } from 'next-intl/server';
import LiveScoresClient from '@/components/pages/LiveScoresClient';

export async function generateMetadata({ params }) {
    const { locale } = await params;
    const isTA = locale === 'ta';
    return {
        title: isTA ? 'நேரடி கிரிக்கெட் ஸ்கோர்கள் மற்றும் ஆய்வு' : 'Live Cricket Scores & Match Analysis',
        description: isTA
            ? 'கிரிக்கெட் போட்டிகளின் நேரடி ஸ்கோர்கள், பந்துக்கு பந்து புதுப்பிப்புகள் மற்றும் நிபுணர் ஜோதிட ஆய்வுகள்.'
            : 'Live cricket match scores, ball-by-ball updates and expert Vedic astrology analysis.',
    };
}

export default function LiveScoresPage() {
    return <LiveScoresClient />;
}
