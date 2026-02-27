import './globals.css';
import { SITE_NAME } from '@/lib/constants';

export const metadata = {
  title: {
    default: `${SITE_NAME} — Vedic Sports Astrology Analysis`,
    template: `%s | ${SITE_NAME}`,
  },
  description: 'India\'s most trusted Vedic sports astrology analysis platform. 10+ years experience, 90% accuracy. Cricket match expert insights powered by Vedic astrology.',
  metadataBase: new URL('https://sbastro.com'),
  alternates: {
    canonical: '/',
    languages: {
      'en-US': '/en',
      'ta-IN': '/ta',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://sbastro.com',
    siteName: SITE_NAME,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: 'Vedic Sports Astrology Analysis & Cricket Insights',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  robots: {
    index: true,
    follow: true,
  }
};

export default function RootLayout({ children }) {
  return children;
}
