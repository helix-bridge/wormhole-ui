import {
  CheckCircleOutlined,
  DisconnectOutlined,
  LinkOutlined,
  LoadingOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { Button, Descriptions, Empty, Form, Input, List, message, Popover, Progress, Spin, Tabs, Tooltip } from 'antd';
import { useForm } from 'antd/lib/form/Form';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Web3 from 'web3';
import { FORM_CONTROL, NETWORKS, NETWORK_CONFIG, RegisterStatus, validateMessages } from '../../config';
import i18n from '../../config/i18n';
import { MemoedTokenInfo, useAllTokens, useApi, useLocalSearch } from '../../hooks';
import { Erc20Token, NetConfig } from '../../model';
import { isValidAddress } from '../../utils';
import {
  confirmRegister,
  getTokenRegisterStatus,
  popupRegisterProof,
  proofObservable,
  registerToken,
} from '../../utils/erc20/token';
import { getNameAndLogo, getSymbolAndDecimals, getTokenName } from '../../utils/erc20/token-util';
import { updateStorage } from '../../utils/helper/storage';
import { Destination } from '../controls/Destination';
import { JazzIcon } from '../icons';
import { EllipsisMiddle } from '../ShortAccount';
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
  const [active, setActive] = useState(0);
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

      <Tabs
        type="card"
        onTabClick={(key) => {
          setActive(+key);
        }}
      >
        <Tabs.TabPane tab={t('Register Token')} active={active === 1} key={1}>
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

          <Form.Item className="-mb-1">
            {t(
              'Tips After submit the registration, please wait for the {{type}} network to return the result, click [Upcoming] to view the progress.',
              { type: net.name }
            )}
          </Form.Item>
        </Tabs.TabPane>

        {/* eslint-disable-next-line no-magic-numbers */}
        <Tabs.TabPane tab={t('Upcoming')} key={2} active={active === 2}>
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
  const { loading, allTokens, setAllTokens } = useAllTokens(netConfig.name, RegisterStatus.registering);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const searchFn = useCallback(tokenSearchFactory(allTokens), [allTokens]);
  const { data, setSearch } = useLocalSearch<MemoedTokenInfo>(searchFn as (arg: string) => MemoedTokenInfo[]);

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
        <List className="token-list">
          {!data.length && <Empty />}
          {data?.map((token, index) => {
            const { address, logo, source, name, symbol } = token;

            return (
              <List.Item key={token.address}>
                <div className="flex w-2/3">
                  {token.logo ? (
                    <img src={`/images/${logo}`} alt="" />
                  ) : (
                    <JazzIcon address={source || address}></JazzIcon>
                  )}
                  <div className="ml-4 w-full">
                    <h6>{getTokenName(name, symbol)}</h6>
                    <EllipsisMiddle>{address}</EllipsisMiddle>
                  </div>
                </div>

                <UpcomingTokenState
                  token={token}
                  onConfirm={() => {
                    const newData = [...allTokens];

                    newData[index].confirmed = 0;

                    setAllTokens([...newData]);

                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    confirmRegister(token.proof as unknown as any, netConfig)
                      .then((tx) => {
                        message.success(`Register success transaction hash: ${tx.transactionHash}`);

                        newData[index].confirmed = 1;

                        setAllTokens(newData);
                      })
                      .catch((err) => {
                        message.error(err.message);
                      });
                  }}
                />
              </List.Item>
            );
          })}
        </List>
      )}

      <Form.Item className="-mb-1">
        {t('Tips After {{type}} network returns the result, click [Confirm] to complete the token registration.', {
          type: netConfig.name,
        })}
      </Form.Item>
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
