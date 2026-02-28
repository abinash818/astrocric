import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { AuthProvider } from '@/context/AuthContext';
import JsonLd from '@/components/common/JsonLd';

const locales = ['ta', 'en'];

export function generateStaticParams() {
    return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }) {
    const { locale } = await params;
    const isTA = locale === 'ta';
    const title = isTA ? 'S&B ஆஸ்ட்ரோ — வேத விளையாட்டு ஜோதிட ஆய்வு' : 'S&B Astro — Vedic Sports Astrology Analysis';
    const description = isTA
        ? 'இந்தியாவின் நம்பகமான கிரிக்கெட் ஜோதிட ஆய்வு தளம். 10+ ஆண்டுகள் அனுபவம், 90% துல்லியம்.'
        : 'India\'s most trusted cricket astrology analysis platform. 10+ years of experience, 90% accuracy.';

    return {
        title,
        description,
        alternates: {
            canonical: `https://sbastro.com/${locale}`,
            languages: {
                'en': 'https://sbastro.com/en',
                'ta': 'https://sbastro.com/ta',
                'x-default': 'https://sbastro.com/en',
            },
        },
        openGraph: {
            title,
            description,
            siteName: isTA ? 'S&B ஆஸ்ட்ரோ' : 'S&B Astro',
            locale: isTA ? 'ta_IN' : 'en_IN',
            type: 'website',
            url: `https://sbastro.com/${locale}`,
            images: [
                {
                    url: '/og-image.png',
                    width: 1200,
                    height: 630,
                    alt: isTA ? 'S&B ஆஸ்ட்ரோ' : 'S&B Astro',
                },
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: ['/og-image.png'],
        },
    };
}

export default async function LocaleLayout({ children, params }) {
    const { locale } = await params;
    const isTA = locale === 'ta';

    const messages = await getMessages();

    const orgSchema = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": isTA ? "S&B ஆஸ்ட்ரோ" : "S&B Astro",
        "url": `https://sbastro.com/${locale}`,
        "logo": "https://sbastro.com/logo.png",
        "sameAs": [
            "https://youtube.com/@spastro",
            "https://wa.me/919999999999"
        ],
        "contactPoint": {
            "@type": "ContactPoint",
            "telephone": "+91-9999999999",
            "contactType": "customer service",
            "email": "contact@sbastro.com"
        }
    };

    return (
        <html lang={locale} suppressHydrationWarning>
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <JsonLd data={orgSchema} />
                {/* PhonePe Checkout Script (Production version) */}
                <script src="https://mercury.phonepe.com/web/bundle/checkout.js" async></script>
            </head>
            <body className="" suppressHydrationWarning>
                <NextIntlClientProvider messages={messages}>
                    <AuthProvider>
                        <Header locale={locale} />
                        <main>{children}</main>
                        <Footer locale={locale} />
                    </AuthProvider>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
