import ContactClient from './ContactClient';

export async function generateMetadata({ params }) {
    const { locale } = await params;
    return {
        title: locale === 'ta' ? 'தொடர்பு கொள்ள' : 'Contact Us',
        description: locale === 'ta'
            ? 'S&B ஆஸ்ட்ரோ தொடர்பு — WhatsApp, மின்னஞ்சல், அல்லது படிவம் மூலம் தொடர்பு கொள்ளுங்கள்'
            : 'Contact S&B Astro — reach us via WhatsApp, email, or contact form.',
    };
}

export default function ContactPage() {
    return <ContactClient />;
}
