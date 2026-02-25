import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
    locales: ['ta', 'en'],
    defaultLocale: 'en',
    localePrefix: 'always'
});

export const config = {
    matcher: ['/', '/(ta|en)/:path*']
};
