'use client';

import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import LanguageToggle from '@/components/ui/LanguageToggle';
import ThemeToggle from '@/components/ui/ThemeToggle';
import styles from './Header.module.css';

export default function Header({ locale }) {
    const t = useTranslations('nav');
    const pathname = usePathname();
    const { user } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);

    const navLinks = [
        { href: `/${locale}`, label: t('home') },
        { href: `/${locale}/about`, label: t('about') },
        { href: `/${locale}/method`, label: t('method') },
        { href: `/${locale}/live-scores`, label: t('liveScores') },
        { href: `/${locale}/predictions`, label: t('predictions') },
        { href: `/${locale}/testimonials`, label: t('testimonials') },
        { href: `/${locale}/contact`, label: t('contact') },
    ];

    const isActive = (href) => {
        if (href === `/${locale}`) return pathname === `/${locale}`;
        return pathname.startsWith(href);
    };

    return (
        <header className={styles.header}>
            <div className={styles.container}>
                {/* Logo */}
                <Link href={`/${locale}`} className={styles.logo}>
                    <span className={styles.logoIcon}>✦</span>
                    <span className={styles.logoText}>
                        S&B <span className={styles.logoAccent}>Astro</span>
                    </span>
                </Link>

                {/* Desktop Nav */}
                <nav className={styles.desktopNav}>
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`${styles.navLink} ${isActive(link.href) ? styles.active : ''}`}
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>

                {/* Right Actions */}
                <div className={styles.actions}>
                    <ThemeToggle />
                    <LanguageToggle locale={locale} />

                    {user ? (
                        <Link href={`/${locale}/dashboard`} className={styles.userBtn}>
                            {user.photoURL ? (
                                <img src={user.photoURL} alt="" className={styles.userAvatar} />
                            ) : (
                                <div className={styles.userAvatarPlaceholder}>
                                    {user.email?.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <span>{user.displayName || (user.email?.split('@')[0])}</span>
                        </Link>
                    ) : (
                        <Link href={`/${locale}/login`} className={styles.navLink}>
                            {t('login')}
                        </Link>
                    )}

                    <Link href={`/${locale}/download`} className={styles.downloadBtn}>
                        {t('download')}
                    </Link>
                </div>

                {/* Mobile Hamburger */}
                <button
                    className={`${styles.hamburger} ${mobileOpen ? styles.hamburgerOpen : ''}`}
                    onClick={() => setMobileOpen(!mobileOpen)}
                    aria-label="Toggle menu"
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            </div>

            {/* Mobile Menu */}
            {mobileOpen && (
                <div className={styles.mobileMenu}>
                    <nav className={styles.mobileNav}>
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`${styles.mobileLink} ${isActive(link.href) ? styles.active : ''}`}
                                onClick={() => setMobileOpen(false)}
                            >
                                {link.label}
                            </Link>
                        ))}
                        <div className={styles.mobileDivider}></div>

                        {user ? (
                            <Link
                                href={`/${locale}/dashboard`}
                                className={styles.mobileLink}
                                onClick={() => setMobileOpen(false)}
                            >
                                {user.displayName || user.email}
                            </Link>
                        ) : (
                            <Link
                                href={`/${locale}/login`}
                                className={styles.mobileLink}
                                onClick={() => setMobileOpen(false)}
                            >
                                {t('login')}
                            </Link>
                        )}

                        <Link
                            href={`/${locale}/download`}
                            className={styles.mobileDownload}
                            onClick={() => setMobileOpen(false)}
                        >
                            {t('download')}
                        </Link>
                        <LanguageToggle locale={locale} />
                        <ThemeToggle />
                    </nav>
                </div>
            )}
        </header>
    );
}
