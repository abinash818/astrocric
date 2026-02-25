'use client';

import { useTranslations } from 'next-intl';
import styles from './LegalPage.module.css';

/**
 * Reusable component for Legal Pages (Privacy, Terms, etc.)
 * @param {string} type - Key in 'legalContent' translation object (e.g., 'privacy', 'terms')
 */
export default function LegalPage({ type }) {
    const t = useTranslations('legalContent');
    const content = t.raw(type);
    const lastUpdated = t('lastUpdated');

    return (
        <section className={styles.page}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1>{content.title}</h1>
                    <p className={styles.lastUpdated}>{lastUpdated}</p>
                </div>

                <div className={styles.content}>
                    {content.intro && <p>{content.intro}</p>}
                    {content.content && <p>{content.content}</p>}

                    {content.sections && content.sections.map((section, index) => (
                        <div key={index} className={styles.section}>
                            <h2 className={styles.sectionTitle}>{section.title}</h2>
                            <p className={styles.sectionContent}>{section.content}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
