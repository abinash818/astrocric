import LegalPage from '@/components/layout/LegalPage';

export async function generateMetadata({ params }) {
    const { locale } = await params;
    return {
        title: locale === 'ta' ? 'தனியுரிமைக் கொள்கை | S&B ஆஸ்ட்ரோ' : 'Privacy Policy | S&B Astro',
    };
}

export default function PrivacyPolicyPage() {
    return <LegalPage type="privacy" />;
}
