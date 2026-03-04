import LegalPage from '@/components/layout/LegalPage';

export async function generateMetadata({ params }) {
    const { locale } = await params;
    return {
        title: locale === 'ta' ? 'ஆஸ்ட்ரோக்ரிக் தனியுரிமைக் கொள்கை | S&B ஆஸ்ட்ரோ' : 'Astrocric Privacy Policy | S&B Astro',
        robots: {
            index: false,
            follow: true,
        },
    };
}

export default function GooglePrivacyPolicyPage() {
    return <LegalPage type="googlePrivacy" />;
}
