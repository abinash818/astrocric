import LegalPage from '@/components/layout/LegalPage';

export async function generateMetadata({ params }) {
    const { locale } = await params;
    return {
        title: locale === 'ta' ? 'விதிமுறைகள் மற்றும் நிபந்தனைகள் | S&B ஆஸ்ட்ரோ' : 'Terms & Conditions | S&B Astro',
    };
}

export default function TermsPage() {
    return <LegalPage type="terms" />;
}
