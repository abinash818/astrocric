import { useTranslations } from 'next-intl';
import styles from './page.module.css';

export async function generateMetadata({ params }) {
    const { locale } = await params;
    return {
        title: locale === 'ta' ? 'சான்றுகள்' : 'Testimonials & Results',
        description: locale === 'ta'
            ? 'S&B ஆஸ்ட்ரோ வாடிக்கையாளர் சான்றுகள் மற்றும் கணிப்பு முடிவுகள்'
            : 'Customer testimonials and verified prediction results from S&B Astro.',
    };
}

const TESTIMONIALS = [
    { name: 'Rajesh K.', location: 'Mumbai', text: 'Amazing accuracy! I have been following S&B Astro for 6 months and the predictions are consistently right. The KP method really works.', rating: 5 },
    { name: 'Priya M.', location: 'Chennai', text: 'First time trying astrology prediction and was blown away. The Key Player prediction was spot on! Worth every rupee.', rating: 5 },
    { name: 'Suresh V.', location: 'Bangalore', text: 'Best prediction site in India. The Vedic method really works. I have tried many other services but this is the most accurate by far.', rating: 5 },
    { name: 'Anitha R.', location: 'Hyderabad', text: 'Very professional and transparent. They show their track record openly. Highly recommended for cricket fans!', rating: 5 },
    { name: 'Karthik S.', location: 'Delhi', text: 'The combo prediction package gives great value. Match winner + key player insights for a very affordable price.', rating: 4 },
    { name: 'Deepa N.', location: 'Coimbatore', text: 'I was skeptical at first, but after seeing 3 correct predictions in a row, I became a regular subscriber. The analysis is detailed.', rating: 5 },
    { name: 'Vikram P.', location: 'Pune', text: 'Their IPL predictions during the season were incredible. Almost 90% accuracy. The planetary analysis is solid.', rating: 5 },
    { name: 'Lakshmi G.', location: 'Madurai', text: 'Easy to use, clear predictions, and great customer support on WhatsApp. The Tamil predictions are a nice touch!', rating: 4 },
];

export default function TestimonialsPage() {
    return <TestimonialsContent />;
}

function TestimonialsContent() {
    const t = useTranslations('testimonials');

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
                    {TESTIMONIALS.map((item, i) => (
                        <div key={i} className={styles.card}>
                            <div className={styles.stars}>{'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}</div>
                            <p className={styles.text}>&ldquo;{item.text}&rdquo;</p>
                            <div className={styles.author}>
                                <div className={styles.avatar}>{item.name[0]}</div>
                                <div>
                                    <span className={styles.name}>{item.name}</span>
                                    <span className={styles.location}>{item.location}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
