'use client';

import { useTranslations } from 'next-intl';
import styles from './page.module.css';
import { WHATSAPP_URL, EMAIL, ADDRESS } from '@/lib/constants';

export default function ContactClient() {
    const t = useTranslations('contact');

    return (
        <section className={styles.page}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <span className="section-label">{t('label')}</span>
                    <h1>{t('title')}</h1>
                    <div className="divider"></div>
                    <p className={styles.subtitle}>{t('subtitle')}</p>
                </div>

                <div className={styles.grid}>
                    <div className={styles.methods}>
                        <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={styles.methodCard}>
                            <div className={styles.methodIcon}>💬</div>
                            <div>
                                <h3>{t('whatsapp')}</h3>
                                <p>{t('whatsappDesc')}</p>
                            </div>
                        </a>

                        <a href={`mailto:${EMAIL}`} className={styles.methodCard}>
                            <div className={styles.methodIcon}>✉️</div>
                            <div>
                                <h3>{t('email')}</h3>
                                <p>{EMAIL}</p>
                            </div>
                        </a>

                        <div className={styles.methodCard}>
                            <div className={styles.methodIcon}>📍</div>
                            <div>
                                <h3>{t('address')}</h3>
                                <p>{ADDRESS}</p>
                            </div>
                        </div>

                        <div className={styles.methodCard}>
                            <div className={styles.methodIcon}>⏰</div>
                            <div>
                                <h3>{t('hours')}</h3>
                                <p>{t('hoursDesc')}</p>
                            </div>
                        </div>
                    </div>

                    <div className={styles.formCard}>
                        <h2>{t('formTitle')}</h2>
                        <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
                            <div className={styles.fieldGroup}>
                                <label>{t('nameLabel')}</label>
                                <input type="text" placeholder={t('namePlaceholder')} className={styles.input} />
                            </div>
                            <div className={styles.fieldGroup}>
                                <label>{t('emailLabel')}</label>
                                <input type="email" placeholder={t('emailPlaceholder')} className={styles.input} />
                            </div>
                            <div className={styles.fieldGroup}>
                                <label>{t('messageLabel')}</label>
                                <textarea placeholder={t('messagePlaceholder')} className={styles.textarea} rows={5}></textarea>
                            </div>
                            <button type="submit" className={styles.submitBtn}>{t('send')}</button>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    );
}
