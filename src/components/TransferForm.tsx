import { Button, Form, Input, Select } from 'antd';
import { useForm } from 'antd/lib/form/Form';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useApi } from '../hooks';
import { TransferFormValues } from '../model';
import { Balance } from './Balance';
import { DownIcon } from './icons';
import { TransferControl } from './TransferControl';

export function TransferForm() {
  const { t } = useTranslation();
  const { accounts } = useApi();
  // const { account } = useAccount();
  const [form] = useForm<TransferFormValues>();

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
        }}
        onFinish={(_) => {
          //
        }}
        // validateMessages={validateMessages[i18n.language as 'en' | 'zh-CN' | 'zh']}
      >
        <Form.Item>
          <TransferControl />
        </Form.Item>

        <Form.Item label={t('Destination address')} name="recipient" validateFirst={true} rules={[{ required: true }]}>
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
          {!accounts ? (
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
              disabled={true}
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
