import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { getSiteUrl } from '../constants/site';

const normalizePath = (pathname) => {
  if (!pathname || pathname === '/') return '/';
  return pathname.endsWith('/') && pathname.length > 1
    ? pathname.slice(0, -1)
    : pathname;
};

const PageSeo = ({ pageKey, noindex = false }) => {
  const { t, language } = useLanguage();
  const { pathname } = useLocation();
  const siteUrl = getSiteUrl();
  const path = normalizePath(pathname);
  const title = t(`seo.pages.${pageKey}.title`);
  const description = t(`seo.pages.${pageKey}.description`);
  const siteName = t('seo.siteName');
  const fullTitle = title.includes(siteName) ? title : `${title} | ${siteName}`;
  const canonical = `${siteUrl}${path === '/' ? '/' : path}`;

  return (
    <Helmet htmlAttributes={{ lang: language }}>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      <meta name="robots" content={noindex ? 'noindex, nofollow' : 'index, follow'} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content={language === 'en' ? 'en_US' : 'pl_PL'} />
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  );
};

export default PageSeo;
