import './globals.css';
import { SITE_NAME } from '@/lib/constants';

export const metadata = {
  title: {
    default: `${SITE_NAME} — Vedic Sports Astrology Predictions`,
    template: `%s | ${SITE_NAME}`,
  },
  description: 'India\'s most trusted Vedic sports astrology prediction platform. 10+ years experience, 90% accuracy. Cricket match winner predictions powered by KP astrology.',
  metadataBase: new URL('https://sbastro.com'),
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }) {
  return children;
}
