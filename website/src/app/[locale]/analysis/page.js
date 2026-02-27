import AnalysisClient from '@/components/pages/AnalysisClient';
import JsonLd from '@/components/common/JsonLd';

export async function generateMetadata({ params }) {
    const { locale } = await params;
    const isTA = locale === 'ta';
    return {
        title: isTA ? 'நிபுணர் போட்டி ஆய்வு | கிரிக்கெட் நுண்ணறிவு' : 'Expert Match Analysis | Cricket Insights',
        description: isTA
            ? 'வரவிருக்கும் கிரிக்கெட் போட்டிகளின் ஆழமான ஆய்வு மற்றும் ஜோதிட நுண்ணறிவுகளைப் பெறுங்கள்.'
            : 'Get in-depth expert analysis and Vedic astrological insights for upcoming cricket matches.',
        keywords: isTA
            ? ['கிரிக்கெட் போட்டி ஆய்வு', 'இன்றைய போட்டி நுண்ணறிவு', 'ஜோதிட ஆய்வு']
            : ['cricket match analysis', 'today match insights', 'expert cricket report', 'astrological match analysis'],
    };
}

export default async function AnalysisPage({ params }) {
    const { locale } = await params;
    const isTA = locale === 'ta';

    const eventSchema = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": isTA ? "கிரிக்கெட் போட்டி ஆய்வுகள்" : "Cricket Match Analyses",
        "description": isTA ? "வரவிருக்கும் போட்டிகளுக்கான நிபுணர் ஜோதிட ஆய்வுகள்" : "Expert astrological analyses for upcoming matches",
        "url": `https://sbastro.com/${locale}/analysis`,
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": isTA ? "இன்றைய போட்டி ஆய்வு" : "Today's Match Analysis",
                "url": `https://sbastro.com/${locale}/analysis`
            }
        ]
    };

    return (
        <>
            <JsonLd data={eventSchema} />
            <AnalysisClient />
        </>
    );
}
