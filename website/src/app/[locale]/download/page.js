import { useTranslations } from 'next-intl';
import styles from './page.module.css';

export async function generateMetadata({ params }) {
    const { locale } = await params;
    return {
        title: locale === 'ta' ? 'பதிவிறக்கம்' : 'Download App',
        description: locale === 'ta'
            ? 'S&B ஆஸ்ட்ரோ ஆப் பதிவிறக்கம் — Android மற்றும் iOS'
            : 'Download the S&B Astro app for Android and iOS. Get predictions on the go.',
    };
}

export default function DownloadPage() {
    return <DownloadContent />;
}

function DownloadContent() {
    const t = useTranslations('home');

    const features = [
        { icon: '⚡', title: 'Instant Predictions', desc: 'Get match predictions as soon as they are published' },
        { icon: '🔔', title: 'Push Notifications', desc: 'Never miss a prediction — get notified before every match' },
        { icon: '💰', title: 'Easy Wallet', desc: 'Recharge via UPI, buy predictions with one tap' },
        { icon: '📊', title: 'Live Score Updates', desc: 'Track matches in real-time right from the app' },
        { icon: '🌙', title: 'Dark & Light Mode', desc: 'Choose between a dark premium and clean light theme' },
        { icon: '🗣️', title: 'Tamil & English', desc: 'Full bilingual support — switch languages anytime' },
    ];

    return (
        <section className={styles.page}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <span className="section-label">{t('downloadLabel')}</span>
                    <h1>{t('downloadTitle')}</h1>
                    <div className="divider"></div>
                    <p className={styles.subtitle}>{t('downloadDesc')}</p>
                </div>

                <div className={styles.buttons}>
                    <a href="#" className={styles.storeBtn}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-1.707l2.108 1.221a1 1 0 010 1.558l-2.108 1.221L15.333 12l2.365-2.364v-.001zM5.864 3.458L16.8 9.791l-2.302 2.302-8.634-8.635z" /></svg>
                        <div>
                            <small>GET IT ON</small>
                            <strong>Google Play</strong>
                        </div>
                    </a>
                    <button className={styles.storeBtn} disabled>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.31-1.32-3.15-2.55C4.22 17 2.97 12.46 4.7 9.3c.87-1.56 2.43-2.55 4.13-2.58 1.29-.02 2.52.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" /></svg>
                        <div>
                            <small>COMING SOON</small>
                            <strong>App Store</strong>
                        </div>
                    </button>
                </div>

                <div className={styles.features}>
                    <h2>App Features</h2>
                    <div className={styles.featuresGrid}>
                        {features.map((f, i) => (
                            <div key={i} className={styles.featureCard}>
                                <span className={styles.featureIcon}>{f.icon}</span>
                                <h3>{f.title}</h3>
                                <p>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
