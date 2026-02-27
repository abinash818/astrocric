import LegalPage from '@/components/layout/LegalPage';

export async function generateMetadata({ params }) {
    const { locale } = await params;
    return {
        title: locale === 'ta' ? 'ஆய்வு மறுப்பு | S&B ஆஸ்ட்ரோ' : 'Analysis Disclaimer | S&B Astro',
    };
}

export default function PredictionDisclaimerPage() {
    return <LegalPage type="prediction" />;
}
