import LegalPage from '@/components/layout/LegalPage';

export async function generateMetadata({ params }) {
    const { locale } = await params;
    return {
        title: locale === 'ta' ? 'பணம் திரும்பப் பெறும் கொள்கை | S&B ஆஸ்ட்ரோ' : 'Refund Policy | S&B Astro',
    };
}

export default function RefundPolicyPage() {
    return <LegalPage type="refund" />;
}
