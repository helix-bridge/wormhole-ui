import { Button, Checkbox, Form, Input, InputNumber } from 'antd';
import { useForm } from 'antd/lib/form/Form';
import { isArray, isBoolean, isNumber, isObject, last } from 'lodash';
import { useTranslation } from 'react-i18next';
import { ChainConfig } from '../model';

interface ConfigurationProps {
  config: ChainConfig;
}

// eslint-disable-next-line complexity
function getConfigControl(config: unknown, keys: string[]) {
  const key = last(keys);
  const label = /^\d+$/g.test(key + '') ? undefined : key;

  if (isArray(config)) {
    return (
      <Form.Item label={label} key={keys.join('-')} className="px-4 py-2 items-center">
        <Form.List name={keys} key={keys.join('-')}>
          {(_) => (
            <div className="list-container">
              {config.map((field, index) => (
                <div key={[...keys, index].join('-')} className="border-b border-gray-600">
                  {getConfigControl(field, [...keys.slice(0, -1), index.toString()])}
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
      <Form.Item key={[...keys].join('-')} label={label} className="px-4 py-2 items-center">
        {Object.entries(config).map(([k, value]) => getConfigControl(value, [...keys, k]))}
      </Form.Item>
    );
  }

  return (
    <Form.Item
      key={keys.join('-')}
      name={keys}
      label={label}
      valuePropName={isBoolean(config) ? 'checked' : undefined}
      className="px-4 py-2"
    >
      {isNumber(config) ? <InputNumber /> : isBoolean(config) ? <Checkbox /> : <Input />}
    </Form.Item>
  );
}

export function Configuration({ config }: ConfigurationProps) {
  const { t } = useTranslation();
  const controls = getConfigControl(config, []);
  const [form] = useForm();

  return (
    <Form
      layout="inline"
      form={form}
      name="configuration"
      initialValues={config}
      onFinish={(values) => {
        console.info('%c [ values ]-61', 'font-size:13px; background:pink; color:#bf2c9f;', values);
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
