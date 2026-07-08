import { useEffect } from 'react';

export default function SEO({ title, description, keywords, ogImage, ogType = 'website', twitterCard = 'summary_large_image' }) {
  const siteName = 'Commerce';

  useEffect(() => {
    const previousTitle = document.title;
    document.title = title ? `${title} | ${siteName}` : siteName;

    const setMeta = (name, content, property = false) => {
      if (!content) return;
      const attr = property ? 'property' : 'name';
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    setMeta('description', description);
    setMeta('keywords', keywords);
    setMeta('og:title', title ? `${title} | ${siteName}` : siteName, true);
    setMeta('og:description', description, true);
    setMeta('og:type', ogType, true);
    setMeta('og:site_name', siteName, true);
    setMeta('og:image', ogImage, true);
    setMeta('twitter:card', twitterCard, true);
    setMeta('twitter:title', title ? `${title} | ${siteName}` : siteName, true);
    setMeta('twitter:description', description, true);
    setMeta('twitter:image', ogImage, true);

    return () => {
      document.title = previousTitle;
    };
  }, [title, description, keywords, ogImage, ogType, twitterCard]);

  return null;
}
