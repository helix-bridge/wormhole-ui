import { CopyrightOutlined, SendOutlined } from '@ant-design/icons';
import { Button, Layout } from 'antd';
import { getYear } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { THEME } from '../config';
import { Path } from '../config/routes';
import { Language, LanguageProps } from './Language';

type FooterProps = LanguageProps & { className?: string };

export function Footer({ network, theme, className = '' }: FooterProps) {
  const { t } = useTranslation();
  const color = theme === THEME.LIGHT ? '#ccc' : undefined;

  return (
    <Layout.Footer
      className={`flex items-center justify-between lg:px-40 px-4 text-gray-400 z-10 py-4 ${className}`}
      style={{ background: '#2d2d2d' }}
    >
      <div className="md:flex md:gap-4 md:flex-wrap text-gray-400">
        <span className="flex items-center justify-center">
          <CopyrightOutlined />
          <span className="ml-1">{t('{{year}} Darwinia', { year: getYear(new Date()) })}</span>
        </span>

        <Link to="yyy">
          <span className="text-gray-400 hover:text-white">{t('Terms of Use')}</span>
        </Link>
      </div>

      <div className="flex items-center">
        <Link to={Path.airdrop} className="mr-4">
          <Button type="ghost" icon={<SendOutlined />} className="flex items-center justify-center" style={{ color }}>
            {t('Airdrop')}
          </Button>
        </Link>

        <Language network={network} theme={theme} type="ghost" color={color} />
      </div>
    </Layout.Footer>
  );
}
