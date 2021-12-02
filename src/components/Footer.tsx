import { CopyrightOutlined, SendOutlined, SettingOutlined } from '@ant-design/icons';
import { Button, Layout } from 'antd';
import { getYear } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { NETWORK_LIGHT_THEME, THEME } from '../config';
import { Path } from '../config/routes';
import { Language, LanguageProps } from './Language';

type FooterProps = LanguageProps & { className?: string };

export function Footer({ network, theme, className = '' }: FooterProps) {
  const { t } = useTranslation();
  const color = theme === THEME.LIGHT ? '#0d101d' : undefined;

  return (
    <Layout.Footer
      className={`flex items-center justify-between sm:px-8 px-2 text-gray-400 z-10 py-4 ${className}`}
      style={{
        background:
          theme === THEME.LIGHT ? NETWORK_LIGHT_THEME[network ?? 'pangolin']['@layout-header-background'] : '#0d101d',
      }}
    >
      <div className="md:flex md:gap-4 md:flex-wrap dark:text-gray-400">
        <span className="flex items-center justify-center">
          <CopyrightOutlined />
          <span className="ml-1">{t('{{year}} Darwinia', { year: getYear(new Date()) })}</span>
        </span>

        {/* <Link to="yyy">
          <span className=" text-black dark:text-gray-400 dark:hover:text-white">{t('Terms of Use')}</span>
        </Link> */}
      </div>

      <div className="flex items-center">
        <Link to={Path.airdrop} className="mr-4">
          <Button type="ghost" icon={<SendOutlined />} className="flex items-center justify-center" style={{ color }}>
            {t('Airdrop')}
          </Button>
        </Link>

        <Link to={Path.configure} className="mr-4">
          <Button
            type="ghost"
            icon={<SettingOutlined />}
            className="flex items-center justify-center"
            style={{ color }}
          >
            {t('Custom Configuration')}
          </Button>
        </Link>

        <Language theme={theme} type="ghost" color={color} />
      </div>
    </Layout.Footer>
  );
}
