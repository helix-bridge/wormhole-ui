import { Button, Checkbox, Form, Input, InputNumber, Tooltip } from 'antd';
import { useForm } from 'antd/lib/form/Form';
import { isArray, isBoolean, isEqual, isNumber, isObject, isString, last } from 'lodash';
import { useEffect } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { NETWORK_CONFIG_DESCRIPTIONS } from '../config';
import { ChainConfig } from '../model';
import { saveNetworkConfig } from '../utils/helper/storage';

interface ConfigurationProps {
  config: ChainConfig;
}

// eslint-disable-next-line complexity
function getConfigControl(config: unknown, keys: (string | number)[]) {
  const lastKey = last(keys);
  const keysStr = keys.join('-');
  const descriptor = NETWORK_CONFIG_DESCRIPTIONS.find((item) => isEqual(item.path, keys.filter(isString)));
  const label =
    !lastKey || isNumber(lastKey) ? null : descriptor?.comment ? (
      <Tooltip title={<Trans>{descriptor?.comment}</Trans>}>{lastKey}</Tooltip>
    ) : (
      lastKey
    );
  const idx = keys.findIndex(isNumber);
  const namePath = [...keys];

  // remove parent path
  if (idx >= 1) {
    namePath.splice(idx - 1, 1);
  }

  if (isArray(config)) {
    return (
      <Form.Item label={label} key={keysStr} className="px-4 py-2 items-center">
        <Form.List name={namePath} key={keysStr}>
          {(_) => (
            <div className="list-container">
              {config.map((field, index) => (
                <div key={[...keys, index].join('-')} className="border-b border-gray-600">
                  {getConfigControl(field, [...keys, index])}
                </div>
              ))}
            </div>
          )}
        </Form.List>
      </Form.Item>
    );
  }

  if (isObject(config)) {
    return (
      <Form.Item key={keysStr} label={label} className="px-4 py-2 items-center">
        {Object.entries(config).map(([k, value]) => getConfigControl(value, [...keys, k]))}
      </Form.Item>
    );
  }

  return (
    <Form.Item
      key={keysStr}
      name={namePath}
      label={label}
      valuePropName={isBoolean(config) ? 'checked' : undefined}
      className="px-4 py-2"
    >
      {isNumber(config) ? (
        <InputNumber disabled={!descriptor?.editable} />
      ) : isBoolean(config) ? (
        <Checkbox disabled={!descriptor?.editable} />
      ) : (
        <Input disabled={!descriptor?.editable} />
      )}
    </Form.Item>
  );
}

export function Configuration({ config }: ConfigurationProps) {
  const { t } = useTranslation();
  const controls = getConfigControl(config, []);
  const [form] = useForm();

  useEffect(() => {
    form.setFieldsValue(config);
  }, [config, form]);

  return (
    <Form
      layout="inline"
      form={form}
      name="configuration"
      initialValues={config}
      onFinish={(values) => {
        console.info('%c [ values ]-61', 'font-size:13px; background:pink; color:#bf2c9f;', values);
        saveNetworkConfig(values);
      }}
    >
      <div className="w-full configuration-control-container">{controls}</div>

      <Form.Item className="mt-4 ml-4">
        <Button type="primary" htmlType="submit">
          {t('Confirm')}
        </Button>
      </Form.Item>
    </Form>
  );
}
