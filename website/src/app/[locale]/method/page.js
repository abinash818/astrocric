import { useTranslations } from 'next-intl';
import styles from './page.module.css';

export async function generateMetadata({ params }) {
    const { locale } = await params;
    return {
        title: locale === 'ta' ? 'எங்கள் முறை' : 'Our Method',
        description: locale === 'ta'
            ? 'KP ஜோதிடம் மூலம் கிரிக்கெட் போட்டி கணிப்பு முறை'
            : 'Our KP Astrology methodology for cricket match predictions — the science behind our 90% accuracy.',
    };
}

export default function MethodPage() {
    return <MethodContent />;
}

function MethodContent() {
    const t = useTranslations('method');

    const steps = [
        { icon: '🪐', num: '01', title: t('step1Title'), desc: t('step1Desc') },
        { icon: '📊', num: '02', title: t('step2Title'), desc: t('step2Desc') },
        { icon: '🔭', num: '03', title: t('step3Title'), desc: t('step3Desc') },
        { icon: '✅', num: '04', title: t('step4Title'), desc: t('step4Desc') },
    ];

    return (
        <section className={styles.page}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <span className="section-label">{t('label')}</span>
                    <h1>{t('title')}</h1>
                    <div className="divider"></div>
                    <p className={styles.intro}>{t('intro')}</p>
                </div>

                <div className={styles.steps}>
                    {steps.map((step, i) => (
                        <div key={i} className={styles.step}>
                            <div className={styles.stepLeft}>
                                <span className={styles.stepNum}>{step.num}</span>
                                <span className={styles.stepIcon}>{step.icon}</span>
                            </div>
                            <div className={styles.stepContent}>
                                <h3>{step.title}</h3>
                                <p>{step.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className={styles.kpBox}>
                    <h2>{t('kpTitle')}</h2>
                    <p>{t('kpDesc')}</p>
                    <ul>
                        <li>{t('kpPoint1')}</li>
                        <li>{t('kpPoint2')}</li>
                        <li>{t('kpPoint3')}</li>
                    </ul>
                </div>

                <div className={styles.disclaimer}>
                    ⚠️ {t('disclaimer')}
                </div>
            </div>
        </section>
    );
}
