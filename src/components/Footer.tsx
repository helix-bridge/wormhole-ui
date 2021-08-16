import { Layout } from 'antd';
import { getYear } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { Language, LanguageProps } from './Language';

type FooterProps = LanguageProps & { className?: string };

export function Footer({ network, theme, className = '' }: FooterProps) {
  const { t } = useTranslation();

  return (
    <Layout.Footer
      className={`flex items-center justify-between lg:px-40 px-4 text-gray-400 z-10 md:fixed bottom-0 left-0 right-0 py-4 ${className}`}
      style={{ background: '#2d2d2d' }}
    >
      <div className="md:flex md:gap-4 md:flex-wrap text-gray-400">
        <span>{t('©{{year}} Darwinia', { year: getYear(new Date()) })}</span>
      </div>

      <Language network={network} theme={theme} />
    </Layout.Footer>
  );
}
