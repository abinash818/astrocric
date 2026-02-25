// Google Analytics 4 + Google Tag Manager utilities

const GA_ID = process.env.NEXT_PUBLIC_GA_ID || '';
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || '';

export function getGAScripts() {
    if (!GA_ID) return '';
    return `
    <script async src="https://www.googletagmanager.com/gtag/js?id=${GA_ID}"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${GA_ID}', {
        page_path: window.location.pathname,
        anonymize_ip: true
      });
    </script>
  `;
}

export function trackEvent(eventName, params = {}) {
    if (typeof window === 'undefined' || !window.gtag) return;
    window.gtag('event', eventName, params);
}

// Pre-defined events
export const events = {
    pageView: (page, locale) => trackEvent('page_view', { page, locale }),
    predictionView: (matchId, type) => trackEvent('prediction_view', { match_id: matchId, prediction_type: type }),
    buyClick: (matchId, price, type) => trackEvent('buy_click', { match_id: matchId, price, type }),
    paymentInitiated: (amount) => trackEvent('payment_initiated', { amount }),
    paymentSuccess: (amount, method) => trackEvent('payment_success', { amount, method }),
    predictionPurchased: (matchId, price) => trackEvent('prediction_purchased', { match_id: matchId, price }),
    appDownloadClick: (platform) => trackEvent('app_download_click', { platform }),
    languageSwitch: (from, to) => trackEvent('language_switch', { from_locale: from, to_locale: to }),
    ctaClick: (ctaName, page) => trackEvent('cta_click', { cta_name: ctaName, page }),
};
