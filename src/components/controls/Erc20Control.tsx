import { Loading3QuartersOutlined } from '@ant-design/icons';
import { Progress, Select, Typography } from 'antd';
import { groupBy } from 'lodash';
import { PropsWithRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { RegisterStatus } from '../../config';
import { useKnownErc20Tokens } from '../../hooks';
import { CustomFormControlProps, Erc20Token, Network } from '../../model';
import { fromWei, getUnit, prettyNumber } from '../../utils';
import { getTokenName } from '../../utils/erc20/meta';
import { Erc20ListInfo } from '../erc20/Erc20ListInfo';

interface Erc20ControlProps extends CustomFormControlProps<Erc20Token | null> {
  network: Network;
  updateBalance?: React.Dispatch<React.SetStateAction<(addr: string) => Promise<void>>>;
}

export function Erc20Control({ network, value, onChange, updateBalance }: PropsWithRef<Erc20ControlProps>) {
  const { t } = useTranslation();
  const { loading, allTokens, refreshTokenBalance } = useKnownErc20Tokens(network);
  const data = groupBy(allTokens, (token) => RegisterStatus[token.status ?? 0]);
  const triggerChange = useCallback(
    (val: string) => {
      if (onChange) {
        const result = allTokens.find((item) => item.address === val) ?? null;

        onChange(result as Erc20Token);
      }
    },
    [allTokens, onChange]
  );
  const option = useCallback(
    (token: Erc20Token, disabled = false) => (
      <Select.Option
        value={token.address}
        key={token.address}
        disabled={disabled}
        label={`${getTokenName(token.name, token.symbol) || '-'} -  ${token.address}`}
      >
        <div className="flex justify-between items-center pr-3">
          <Erc20ListInfo token={token}></Erc20ListInfo>
          {token.status === 1 ? (
            <span>{fromWei({ value: token.balance, unit: getUnit(+token.decimals) }, prettyNumber)}</span>
          ) : (
            <Loading3QuartersOutlined style={{ color: '#fe3876' }} />
          )}
        </div>
      </Select.Option>
    ),
    []
  );

  useEffect(() => {
    if (updateBalance) {
      updateBalance(() => refreshTokenBalance);
    }
  }, [refreshTokenBalance, updateBalance]);

  if (loading) {
    return <Progress percent={99} status="active" strokeColor={{ from: '#5745de', to: '#ec3783' }} />;
  }

  return (
    <Select<string>
      size="large"
      showSearch
      allowClear
      value={value?.address}
      placeholder={t('Search name or paste address')}
      onChange={(val: string) => {
        triggerChange(val);
      }}
      optionLabelProp="label"
    >
      <Select.OptGroup label={<Typography.Title level={5}>{t('In progress')}</Typography.Title>}>
        {data[RegisterStatus[RegisterStatus.registering]]?.map((token) => option(token as Erc20Token, true))}
      </Select.OptGroup>

      <Select.OptGroup label={<Typography.Title level={5}>{t('Available')}</Typography.Title>}>
        {data[RegisterStatus[RegisterStatus.registered]]?.map((token) => option(token as Erc20Token))}
      </Select.OptGroup>
    </Select>
  );
}
