import LegalPage from '@/components/layout/LegalPage';

export async function generateMetadata({ params }) {
    const { locale } = await params;
    return {
        title: locale === 'ta' ? 'கணிப்பு மறுப்பு | S&B ஆஸ்ட்ரோ' : 'Prediction Disclaimer | S&B Astro',
    };
}

export default function PredictionDisclaimerPage() {
    return <LegalPage type="prediction" />;
}
