import { UnlockOutlined, LockOutlined } from '@ant-design/icons';
import { Switch, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import { THEME } from '../../config';
import { useApi } from '../../hooks';

interface NetworkFilterProps {
  theme?: THEME;
}

export function NetworkFilter({ theme }: NetworkFilterProps) {
  const { t } = useTranslation();
  const { enableTestNetworks, setEnableTestNetworks } = useApi();

  return (
    <Tooltip
      title={t('{{enable}} the test networks to appear in the network selection panel', {
        enable: enableTestNetworks ? t('Disable') : t('Enable'),
      })}
    >
      <Switch
        onChange={() => setEnableTestNetworks(!enableTestNetworks)}
        checked={enableTestNetworks}
        checkedChildren={<UnlockOutlined />}
        unCheckedChildren={<LockOutlined />}
        className="mx-4"
        style={{
          lineHeight: 0.5,
          background: theme === THEME.DARK ? undefined : enableTestNetworks ? 'rgba(0,0,0,.5)' : undefined,
        }}
      />
    </Tooltip>
  );
}
