export default function sitemap() {
    const baseUrl = 'https://sbastro.com';
    const locales = ['en', 'ta'];
    const routes = ['', '/analysis', '/live-scores', '/about', '/contact', '/download', '/method'];

    const sitemapEntries = [];

    locales.forEach((locale) => {
        routes.forEach((route) => {
            sitemapEntries.push({
                url: `${baseUrl}/${locale}${route}`,
                lastModified: new Date(),
                changeFrequency: route === '' || route === '/live-scores' ? 'hourly' : 'daily',
                priority: route === '' ? 1 : 0.8,
            });
        });
    });

    return sitemapEntries;
}
