import { Radio } from 'antd';
import { useTranslation } from 'react-i18next';

interface DayFilterProps {
  onChange?: (value: string) => void;
}

export function DayFilter({ onChange }: DayFilterProps) {
  const { t } = useTranslation();

  return (
    <Radio.Group
      defaultValue="all"
      buttonStyle="solid"
      onChange={(event) => {
        if (onChange) {
          onChange(event.target.value);
        }
      }}
    >
      <Radio.Button value="all" style={{ borderRadius: 0, marginRight: 10 }}>
        {t('ALL-TIME')}
      </Radio.Button>
      <Radio.Button value="7">{t('7D')}</Radio.Button>
      <Radio.Button value="30" style={{ borderRadius: 0, marginLeft: 10 }}>
        {t('30D')}
      </Radio.Button>
    </Radio.Group>
  );
}
