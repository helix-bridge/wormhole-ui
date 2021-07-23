import { Button, Form, Input, Select } from 'antd';
import { useForm } from 'antd/lib/form/Form';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { validateMessages } from '../config';
import { Network, TransferFormValues, TransferValue } from '../model';
import { getInitialSetting, getNetworkByName } from '../utils';
import { Balance } from './Balance';
import { DownIcon } from './icons';
import { TransferControl } from './TransferControl';

export function TransferForm() {
  const { t, i18n } = useTranslation();
  const [form] = useForm<TransferFormValues>();
  const transfer = useMemo(() => {
    const come = getInitialSetting('from', '') as Network;
    const go = getInitialSetting('to', '') as Network;
    const from = getNetworkByName(come);
    const to = getNetworkByName(go);

    if (from?.isTest === to?.isTest) {
      return { from, to };
    } else if (from) {
      return { from, to: null };
    } else {
      return { from: null, to };
    }
  }, []);

  return (
    <>
      <Form
        name="transfer"
        layout="vertical"
        form={form}
        initialValues={{
          recipient: '',
          assets: 'ring',
          amount: '',
          transfer,
        }}
        onFinish={(value) => {
          console.info('🚀 ~ file: TransferForm.tsx ~ line 71 ~ TransferForm ~ value', value);
        }}
        validateMessages={validateMessages[i18n.language as 'en' | 'zh-CN' | 'zh']}
      >
        <Form.Item
          name="transfer"
          rules={[
            { required: true, message: t('Both send and receive network are all required') },
            {
              validator: (_, value: TransferValue) => {
                return value.from && value.to ? Promise.resolve() : Promise.reject();
              },
              message: t('You maybe forgot to select receive or sender network'),
            },
          ]}
        >
          <TransferControl />
        </Form.Item>

        <Form.Item label={t('Recipient')} name="recipient" validateFirst={true} rules={[{ required: true }]}>
          <Input
            onChange={() => {
              //
            }}
            size="large"
          />
        </Form.Item>

        <Form.Item label={t('Assets')} name="assets" rules={[{ required: true }]}>
          <Select
            onChange={() => {
              //
            }}
            size="large"
            suffixIcon={<DownIcon />}
          >
            <Select.Option value="ring"> ring </Select.Option>
            <Select.Option value="kton"> kton </Select.Option>
          </Select>
        </Form.Item>

        <Form.Item label={t('Amount')} name="amount" rules={[{ required: true }, { pattern: /^[\d,]+(.\d{1,3})?$/ }]}>
          <Balance
            placeholder={t('Available balance: {{balance}}', { balance: '99' })}
            size="large"
            onChange={() => {
              //
            }}
          />
        </Form.Item>

        <Form.Item style={{ margin: '48px 0 0 0' }}>
          {/* eslint-disable-next-line no-constant-condition */}
          {'' ? (
            <Button
              type="primary"
              className="block mx-auto w-full rounded-xl text-white"
              size="large"
              onClick={() => {
                //
              }}
            >
              {t('Connect Wallet')}
            </Button>
          ) : (
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              className="block mx-auto w-full rounded-xl text-white"
            >
              {t('Confirm to transfer')}
            </Button>
          )}
        </Form.Item>
      </Form>
      {/* 
      <TransferAlertModal
        cancel={() => {
          //
        }}
        recipient={form.getFieldValue('recipient')}
        confirm={() => {
          //
        }}
      /> */}

      {/* <TransferConfirmModal /> */}

      {/* <AccountModal
        // isVisible={}
        // assets={assets}
        cancel={() => {
          //
        }}
        confirm={() => {
          // do nothing
        }}
      /> */}
    </>
  );
}
