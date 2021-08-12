import { DisconnectOutlined, LinkOutlined, SyncOutlined } from '@ant-design/icons';
import { Button, Descriptions, Form, Input, Popover, Spin, Tooltip } from 'antd';
import { useForm } from 'antd/lib/form/Form';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Web3 from 'web3';
import { FORM_CONTROL, NETWORKS, NETWORK_CONFIG, RegisterStatus, validateMessages } from '../../config';
import i18n from '../../config/i18n';
import { useAllTokens, useApi, useLocalSearch } from '../../hooks';
import { Erc20Token, NetConfig } from '../../model';
import { isValidAddress } from '../../utils';
import { getTokenRegisterStatus, registerToken } from '../../utils/erc20/token';
import { getNameAndLogo, getSymbolAndDecimals } from '../../utils/erc20/token-util';
import { updateStorage } from '../../utils/helper/storage';
import { Destination } from '../controls/Destination';
import { SubmitButton } from '../SubmitButton';

const DEFAULT_REGISTER_NETWORK = NETWORK_CONFIG.ropsten;

const tokenSearchFactory = (tokens: Pick<Erc20Token, 'address' | 'symbol'>[]) => (value: string) => {
  if (!value) {
    return tokens;
  }

  const isAddress = Web3.utils.isAddress(value);

  return isAddress
    ? tokens.filter((token) => token.address === value)
    : tokens.filter((token) => token.symbol.toLowerCase().includes(value.toLowerCase()));
};

// eslint-disable-next-line complexity
export function Manager() {
  const { t } = useTranslation();
  const [form] = useForm();
  const [net, setNet] = useState<NetConfig>(DEFAULT_REGISTER_NETWORK);
  const { networkStatus, network, switchNetwork } = useApi();
  const [inputValue, setInputValue] = useState('');
  const [registeredStatus, setRegisteredStatus] = useState(-1);
  const [token, setToken] =
    useState<Pick<Erc20Token, 'logo' | 'name' | 'symbol' | 'decimals' | 'address'> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const { allTokens, setAllTokens } = useAllTokens(network!, RegisterStatus.registering);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const searchFn = useCallback(tokenSearchFactory(allTokens), [allTokens]);
  const { data } = useLocalSearch(searchFn as (arg: string) => Erc20Token[]);
  const networks = useMemo(() => NETWORKS.filter((item) => item.type.includes('ethereum')), []);
  const canStart = useMemo(
    () => !form.getFieldError('address').length && networkStatus === 'success' && network === net.name,
    [form, net.name, network, networkStatus]
  );
  const Extra = useMemo(() => {
    if (networkStatus === 'connecting') {
      return <SyncOutlined spin style={{ color: '#1890ff' }} />;
    }

    const existAndConsistent = net.name === network;

    return networkStatus === 'success' ? (
      <Popover
        content={
          existAndConsistent ? (
            t('Network connected')
          ) : (
            <div className="max-w-sm flex flex-col">
              <span>
                {t(
                  'The connected network is not the same as the network selected, do you want switch to the {{network}} network?',
                  { network: net.name }
                )}
              </span>
              <Button
                onClick={() => {
                  switchNetwork(net.name);
                }}
                className="self-end mt-2"
              >
                {t('Switch')}
              </Button>
            </div>
          )
        }
      >
        <LinkOutlined style={{ color: existAndConsistent ? '#10b981' : '#fbbf24' }} />
      </Popover>
    ) : (
      <Tooltip title={t('Network disconnected')}>
        <DisconnectOutlined style={{ color: '#ef4444' }} />
      </Tooltip>
    );
  }, [networkStatus, net.name, network, t, switchNetwork]);

  useEffect(() => {
    if (!canStart) {
      setRegisteredStatus(-1);
      return;
    }

    (async () => {
      setIsLoading(true);

      const status = await getTokenRegisterStatus(inputValue, net);
      const result = await getSymbolAndDecimals(inputValue, net);
      const { name, logo } = getNameAndLogo(inputValue);

      setRegisteredStatus(status === null ? -1 : status);
      setToken({ ...result, name: name ?? '', logo: logo ?? '', address: inputValue });
      setIsLoading(false);
    })();
  }, [canStart, inputValue, net]);

  useEffect(() => {
    updateStorage({ from: net.name });
  }, [net]);

  return (
    <Form
      name={FORM_CONTROL.transfer}
      layout="vertical"
      form={form}
      initialValues={{ host: DEFAULT_REGISTER_NETWORK }}
      onFinish={() => {
        registerToken(inputValue, net);
        setAllTokens([token as Erc20Token, ...data]);
      }}
      validateMessages={validateMessages[i18n.language as 'en' | 'zh-CN' | 'zh']}
    >
      <Form.Item name="host" rules={[{ required: true }]}>
        <Destination
          title={t('Host Network')}
          networks={networks}
          extra={Extra}
          onChange={(value) => {
            if (value) {
              setNet(value);
            }
          }}
        />
      </Form.Item>

      <Form.Item
        name="address"
        label={t('Token Contract Address')}
        rules={[
          { required: true },
          {
            validator(_, value) {
              return isValidAddress(value, 'ethereum') ? Promise.resolve() : Promise.reject();
            },
            message: t('Invalid token contract address'),
          },
        ]}
      >
        <Input.Search
          placeholder={t('Token Contract Address')}
          size="large"
          onChange={(event) => {
            const errors = form.getFieldError(['address']);

            if (errors.length === 0) {
              setInputValue((event.target as unknown as HTMLInputElement).value);
            }
          }}
        />
      </Form.Item>

      {isLoading ? (
        <Form.Item>
          <Spin size="small" className="w-full text-center"></Spin>
        </Form.Item>
      ) : (
        canStart && (
          <Form.Item
            label={t('Token Info')}
            style={{
              display: form.getFieldError(['address']).length || !inputValue ? 'none' : 'block',
            }}
          >
            <Descriptions bordered>
              <Descriptions.Item label={t('Symbol')}>{token?.symbol}</Descriptions.Item>
              <Descriptions.Item label={t('Decimals of Precision')}>{token?.decimals}</Descriptions.Item>
            </Descriptions>
          </Form.Item>
        )
      )}

      <SubmitButton disabled={isLoading || registeredStatus !== 0} from={net} to={null}>
        {t('Register')}
      </SubmitButton>
    </Form>
  );
}
