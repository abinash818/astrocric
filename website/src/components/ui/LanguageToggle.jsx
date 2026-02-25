'use client';

import { usePathname, useRouter } from 'next/navigation';
import styles from './LanguageToggle.module.css';

export default function LanguageToggle({ locale }) {
    const pathname = usePathname();
    const router = useRouter();

    const toggleLocale = () => {
        const newLocale = locale === 'ta' ? 'en' : 'ta';
        const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/';
        router.push(`/${newLocale}${pathWithoutLocale}`);
    };

    return (
        <button className={styles.toggle} onClick={toggleLocale} aria-label="Switch language">
            <span className={`${styles.option} ${locale === 'ta' ? styles.active : ''}`}>த</span>
            <span className={styles.divider}>/</span>
            <span className={`${styles.option} ${locale === 'en' ? styles.active : ''}`}>EN</span>
        </button>
    );
}
