import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { AuthProvider } from '@/context/AuthContext';

const locales = ['ta', 'en'];

export function generateStaticParams() {
    return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }) {
    const { locale } = await params;
    const isTA = locale === 'ta';
    return {
        alternates: {
            canonical: `https://sbastro.com/${locale}`,
            languages: {
                'en': 'https://sbastro.com/en',
                'ta': 'https://sbastro.com/ta',
            },
        },
        openGraph: {
            siteName: isTA ? 'S&B ஆஸ்ட்ரோ' : 'S&B Astro',
            locale: isTA ? 'ta_IN' : 'en_IN',
            type: 'website',
        },
    };
}

export default async function LocaleLayout({ children, params }) {
    const { locale } = await params;

    const messages = await getMessages();

    return (
        <html lang={locale} suppressHydrationWarning>
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
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
