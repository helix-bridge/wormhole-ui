import { CheckCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import { Button, Descriptions, Empty, Form, Input, List, Progress, Spin, Tabs, Typography } from 'antd';
import { useForm } from 'antd/lib/form/Form';
import React, { PropsWithChildren, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { from, mergeMap } from 'rxjs';
import { FORM_CONTROL, NETWORKS, NETWORK_CONFIG, RegisterStatus, validateMessages } from '../../config';
import i18n from '../../config/i18n';
import { MemoedTokenInfo, useApi, useKnownErc20Tokens, useLocalSearch, useTx } from '../../hooks';
import { Erc20Token, NetConfig } from '../../model';
import { isSameNetConfig, isValidAddress } from '../../utils';
import { getNameAndLogo, getSymbolAndDecimals } from '../../utils/erc20/meta';
import {
  confirmRegister,
  getRegisterProof,
  getTokenRegisterStatus,
  launchRegister,
  StoredProof,
  tokenSearchFactory,
} from '../../utils/erc20/token';
import { updateStorage } from '../../utils/helper/storage';
import { Destination } from '../controls/Destination';
import { LinkIndicator } from '../LinkIndicator';
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
  const {
    connection: { status },
    network,
  } = useApi();
  const [active, setActive] = useState(TabKeys.register);
  const [inputValue, setInputValue] = useState('');
  const [registeredStatus, setRegisteredStatus] = useState(-1);
  const [token, setToken] =
    useState<Pick<Erc20Token, 'logo' | 'name' | 'symbol' | 'decimals' | 'address'> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { tokens, updateTokens } = useKnownErc20Tokens(network!.name, RegisterStatus.registering);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const searchFn = useCallback(tokenSearchFactory(tokens), [tokens]);
  const { data } = useLocalSearch(searchFn as (arg: string) => Erc20Token[]);
  const { observer } = useTx();
  const networks = useMemo(() => NETWORKS.filter((item) => item.type.includes('ethereum')), []);
  const canStart = useMemo(
    () =>
      status === 'success' &&
      isSameNetConfig(network, net) &&
      !!net.erc20Token.bankingAddress &&
      isValidAddress(inputValue, 'ethereum'),
    [inputValue, net, network, status]
  );

  useEffect(() => {
    if (!canStart) {
      setRegisteredStatus(-1);
      setToken(null);
      return;
    }

    (async () => {
      setIsLoading(true);

      const searchValue = !inputValue.startsWith('0x') ? '0x' + inputValue : inputValue;
      const tokenStatus = await getTokenRegisterStatus(searchValue, net);
      const result = await getSymbolAndDecimals(searchValue, net);
      const { name, logo } = getNameAndLogo(searchValue);

      setRegisteredStatus(tokenStatus === null ? -1 : tokenStatus);
      setToken({ ...result, name: name ?? '', logo: logo ?? '', address: searchValue });
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
        launchRegister(inputValue, net).subscribe({
          ...observer,
          next: (tx) => {
            observer.next(tx);

            if (tx.status === 'finalized') {
              updateTokens([token as Erc20Token, ...data]);
            }
          },
        });
      }}
      validateMessages={validateMessages[i18n.language as 'en' | 'zh-CN' | 'zh']}
    >
      <Form.Item name="host" label={t('Host network')} rules={[{ required: true }]}>
        <Destination
          networks={networks}
          extra={<LinkIndicator config={net} />}
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
            validateFirst
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
                setInputValue(event.target.value);
              }}
            />
          </Form.Item>

          {isLoading ? (
            <Form.Item>
              <Spin size="small" className="w-full text-center"></Spin>
            </Form.Item>
          ) : (
            token && (
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
  const {
    loading,
    tokens: allTokens,
    proofs: knownProofs,
    updateTokens,
    addKnownProof,
    switchToConfirmed,
  } = useKnownErc20Tokens(netConfig.name, RegisterStatus.registering);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const searchFn = useCallback(tokenSearchFactory(allTokens), [allTokens]);
  const { data, setSearch } = useLocalSearch<MemoedTokenInfo>(searchFn as (arg: string) => MemoedTokenInfo[]);
  const { observer } = useTx();
  const [inQueryingQueue, setInQueryingQueue] = useState<string[]>([]);
  const tokens = useMemo(() => {
    const proofs = knownProofs.map((item) => item.registerProof.source);

    return allTokens.filter((item) => !proofs.includes(item.address) && !inQueryingQueue.includes(item.address));
  }, [allTokens, inQueryingQueue, knownProofs]);

  useEffect(() => {
    if (!tokens.length) {
      return;
    }

    from(tokens)
      .pipe(mergeMap(({ address }) => getRegisterProof(address, netConfig)))
      .subscribe((proof) => {
        addKnownProof(proof);
      });

    setInQueryingQueue(tokens.map((item) => item.address));
  }, [tokens, netConfig, updateTokens, addKnownProof]);

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
          {data?.map((token) => (
            <List.Item key={token.address}>
              <Erc20ListInfo token={token}></Erc20ListInfo>
              <UpcomingTokenState
                token={token}
                proofs={knownProofs}
                onConfirm={() => {
                  const proof: StoredProof = knownProofs.find((item) => item.registerProof.source === token.address)!;

                  confirmRegister(proof, netConfig).subscribe({
                    ...observer,
                    next: (state) => {
                      observer.next(state);
                      if (state.status === 'finalized') {
                        switchToConfirmed(token.address);
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
 * confirmed - -1: waiting for proof; 0: confirming 1: confirmed
 */
interface UpcomingTokenStateProps {
  token: MemoedTokenInfo;
  proofs: StoredProof[];
  animate?: boolean;
  onConfirm: () => void;
}

function UpcomingTokenState({ token, onConfirm, proofs, animate = true }: UpcomingTokenStateProps) {
  const { t } = useTranslation();

  if (
    token.status === RegisterStatus.registering &&
    !proofs.map((item) => item.registerProof.source).includes(token.address)
  ) {
    return animate ? <LoadingOutlined /> : <Progress type="circle" percent={50} format={() => ''} />;
  }

  if (token.status === RegisterStatus.registered) {
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
    <Form.Item className="text-xs mb-0 mt-8">
      <span className="text-gray-600">{children}</span>
    </Form.Item>
  );
}
