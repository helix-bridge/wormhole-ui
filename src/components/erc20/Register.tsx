import {
  CheckCircleOutlined,
  DisconnectOutlined,
  LinkOutlined,
  LoadingOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import {
  Button,
  Descriptions,
  Empty,
  Form,
  Input,
  List,
  Popover,
  Progress,
  Spin,
  Tabs,
  Tooltip,
  Typography,
} from 'antd';
import { useForm } from 'antd/lib/form/Form';
import React, { PropsWithChildren, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { FORM_CONTROL, NETWORKS, NETWORK_CONFIG, RegisterStatus, validateMessages } from '../../config';
import i18n from '../../config/i18n';
import { MemoedTokenInfo, useApi, useKnownErc20Tokens, useLocalSearch, useTx } from '../../hooks';
import { Erc20Token, NetConfig } from '../../model';
import { isValidAddress } from '../../utils';
import { getNameAndLogo, getSymbolAndDecimals } from '../../utils/erc20/meta';
import {
  confirmRegister,
  getTokenRegisterStatus,
  launchRegister,
  popupRegisterProof,
  proofObservable,
  tokenSearchFactory,
} from '../../utils/erc20/token';
import { updateStorage } from '../../utils/helper/storage';
import { Destination } from '../controls/Destination';
import { SubmitButton } from '../SubmitButton';
import { Erc20ListInfo } from './Erc20ListInfo';

const DEFAULT_REGISTER_NETWORK = NETWORK_CONFIG.ropsten;

enum TabKeys {
  register = 'register',
  upcoming = 'upcoming',
}

// eslint-disable-next-line complexity
export function Register() {
  const { t } = useTranslation();
  const [form] = useForm();
  const [net, setNet] = useState<NetConfig>(DEFAULT_REGISTER_NETWORK);
  const { networkStatus, network, switchNetwork } = useApi();
  const [active, setActive] = useState(TabKeys.register);
  const [inputValue, setInputValue] = useState('');
  const [registeredStatus, setRegisteredStatus] = useState(-1);
  const [token, setToken] =
    useState<Pick<Erc20Token, 'logo' | 'name' | 'symbol' | 'decimals' | 'address'> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { allTokens, setAllTokens } = useKnownErc20Tokens(network!, RegisterStatus.registering);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const searchFn = useCallback(tokenSearchFactory(allTokens), [allTokens]);
  const { data } = useLocalSearch(searchFn as (arg: string) => Erc20Token[]);
  const { observer } = useTx();
  const networks = useMemo(() => NETWORKS.filter((item) => item.type.includes('ethereum')), []);
  const canStart = useMemo(
    () =>
      !form.getFieldError('address').length &&
      networkStatus === 'success' &&
      network === net.name &&
      net.erc20Token.bankingAddress,
    [form, net.erc20Token.bankingAddress, net.name, network, networkStatus]
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
        launchRegister(inputValue, net).subscribe(observer);
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

      <Tabs type="card" activeKey={active} onTabClick={(key) => setActive(key as TabKeys)}>
        <Tabs.TabPane tab={t('Register Token')} key={TabKeys.register}>
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
              disabled={!net.erc20Token.bankingAddress}
              onChange={(event) => {
                const errors = form.getFieldError(['address']);

                if (errors.length === 0) {
                  setInputValue(event.target.value);
                }
              }}
            />
          </Form.Item>

          {isLoading ? (
            <Form.Item>
              <Spin size="small" className="w-full text-center"></Spin>
            </Form.Item>
          ) : canStart ? (
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
          ) : (
            <Form.Item>
              <div className="flex justify-center items-center w-full text-lg">{t('Coming Soon')}</div>
            </Form.Item>
          )}

          <SubmitButton disabled={isLoading || registeredStatus !== 0} from={net} to={null}>
            {t('Register')}
          </SubmitButton>

          <Tip>
            <Trans i18nKey="erc20RegistrationTip">
              After submit the registration, please wait for the {{ network }} network to return the result, click
              <Typography.Link onClick={() => setActive(TabKeys.upcoming)}> Upcoming </Typography.Link>to view the
              progress.
            </Trans>
          </Tip>
        </Tabs.TabPane>

        <Tabs.TabPane tab={t('Upcoming')} key={TabKeys.upcoming}>
          <Upcoming netConfig={net} />
        </Tabs.TabPane>
      </Tabs>
    </Form>
  );
}

interface UpcomingProps {
  netConfig: NetConfig;
}

function Upcoming({ netConfig }: UpcomingProps) {
  const { t } = useTranslation();
  const { loading, allTokens, setAllTokens } = useKnownErc20Tokens(netConfig.name, RegisterStatus.registering);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const searchFn = useCallback(tokenSearchFactory(allTokens), [allTokens]);
  const { data, setSearch } = useLocalSearch<MemoedTokenInfo>(searchFn as (arg: string) => MemoedTokenInfo[]);
  const { observer } = useTx();

  useEffect(() => {
    if (!allTokens.length) {
      return;
    }

    const subscription = proofObservable.subscribe((proof) => {
      const updated = allTokens.map((token) => (proof.source === token.address ? { ...token, proof } : token));

      setAllTokens(updated);
    });

    allTokens.forEach(({ address }) => {
      const sub$$ = popupRegisterProof(address, netConfig);

      subscription.add(sub$$);
    });

    return () => subscription.unsubscribe();
  }, [allTokens, netConfig, setAllTokens]);

  return (
    <>
      <Input.Search
        size="large"
        placeholder={t('Search name or paste address')}
        onChange={(event) => {
          const value = event.target.value;

          setSearch(value);
        }}
      />

      {loading ? (
        <Spin className="mx-auto w-full mt-4"></Spin>
      ) : (
        <List>
          {!data.length && <Empty />}
          {data?.map((token, index) => (
            <List.Item key={token.address}>
              <Erc20ListInfo token={token}></Erc20ListInfo>
              <UpcomingTokenState
                token={token}
                onConfirm={() => {
                  const newData = [...allTokens];

                  newData[index].confirmed = 0;

                  setAllTokens([...newData]);

                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  confirmRegister(token.proof as unknown as any, netConfig).subscribe({
                    ...observer,
                    next: (state) => {
                      observer.next(state);
                      if (state.status === 'finalized') {
                        newData[index].confirmed = 1;

                        setAllTokens(newData);
                      }
                    },
                  });
                }}
              />
            </List.Item>
          ))}
        </List>
      )}
      <Tip>
        <Trans i18nKey="erc20CompletionTip">
          After {{ type: netConfig.name }} network returns the result, click [Confirm] to complete the token
          registration.
        </Trans>
      </Tip>
    </>
  );
}

/**
 * confirmed - 0: confirming 1: confirmed
 */
interface UpcomingTokenStateProps {
  token: MemoedTokenInfo;
  onConfirm: () => void;
}

function UpcomingTokenState({ token, onConfirm }: UpcomingTokenStateProps) {
  const { t } = useTranslation();
  const { proof, confirmed } = token;

  if (!proof) {
    return <LoadingOutlined />;
  }

  if (confirmed === 0) {
    return <Progress type="circle" percent={50} format={() => ''} />;
  }

  if (confirmed === 1) {
    return <CheckCircleOutlined />;
  }

  return (
    <Button
      size="small"
      onClick={onConfirm}
      style={{
        pointerEvents: 'all',
      }}
    >
      {t('Confirm')}
    </Button>
  );
}

function Tip({ children }: PropsWithChildren<string | ReactNode>) {
  return (
    <Form.Item className="px-4 text-xs mb-0 mt-8">
      <span className="text-gray-600">{children}</span>
    </Form.Item>
  );
}
