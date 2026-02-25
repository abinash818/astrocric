import LegalPage from '@/components/layout/LegalPage';

export async function generateMetadata({ params }) {
    const { locale } = await params;
    return {
        title: locale === 'ta' ? 'வருவாய் மறுப்பு | S&B ஆஸ்ட்ரோ' : 'Earnings Disclaimer | S&B Astro',
    };
}

export default function EarningsDisclaimerPage() {
    return <LegalPage type="earnings" />;
}
