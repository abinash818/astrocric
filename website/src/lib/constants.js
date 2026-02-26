// Site-wide constants

export const SITE_NAME = "S&B Astro";
export const SITE_DOMAIN = "sbastro.com";
export const SITE_URL = "https://sbastro.com";

export const API_URL = typeof window !== 'undefined'
    ? "/api"
    : "http://localhost:5000/api";

// App download links (replace with real links)
export const ANDROID_DOWNLOAD_URL = "#";
export const IOS_DOWNLOAD_URL = "#";

// Social links (replace with real links)
export const WHATSAPP_URL = "https://wa.me/919999999999";
export const YOUTUBE_URL = "https://youtube.com/@spastro";
export const EMAIL = "contact@sbastro.com";
export const ADDRESS = "Chennai, Tamil Nadu, India";

// Prediction types
export const PREDICTION_TYPES = {
    MATCH: { id: 'match', priceKey: 'typeMatch' },
    PLAYER: { id: 'player', priceKey: 'typePlayer' },
    BUNDLE: { id: 'bundle', priceKey: 'typeBundle' },
};

// SEO Keywords
export const SEO_KEYWORDS_EN = [
    "sports astrology prediction",
    "cricket astrology prediction",
    "match winner prediction astrology",
    "vedic sports astrology",
    "paid cricket prediction",
    "cricket match prediction India",
    "KP astrology cricket",
];

export const SEO_KEYWORDS_TA = [
    "கிரிக்கெட் ஜோதிடம்",
    "போட்டி ஜோதிட கணிப்பு",
    "விளையாட்டு ஜோதிடம்",
    "ஜோதிடம் மூலம் வெற்றி கணிப்பு",
    "கிரிக்கெட் போட்டி கணிப்பு",
];
