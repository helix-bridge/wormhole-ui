import { RightOutlined } from '@ant-design/icons';
import { Typography } from 'antd';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { TransferFormValues } from '../../model/transfer';
import { E2DItems } from '../bridge/Ethereum2Darwinia';

export function TransferConfirm<T extends E2DItems>({ value }: { value: TransferFormValues<T> }) {
  const { t } = useTranslation();

  return (
    <>
      <Des
        title={t('Cross-chain direction')}
        content={
          <>
            {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
            <span className="uppercase">{value.transfer.from!.name}</span>
            <RightOutlined />
            {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
            <span className="uppercase">{value.transfer.to!.name}</span>
          </>
        }
      />

      <Des title={t('From')} content={value.sender} />

      <Des title={t('To')} content={value.recipient}></Des>

      <Des
        title={t('Amount')}
        content={
          <span>
            {value.amount}
            <span className="uppercase ml-2">{value.asset}</span>
          </span>
        }
      />
    </>
  );
}

interface DesProps {
  title: string;
  content: string | ReactNode;
}

function Des({ title, content }: DesProps) {
  return (
    <div className="my-4">
      <h4 className="text-gray-400 mb-2">{title}:</h4>
      <Typography.Link>{content}</Typography.Link>
    </div>
  );
}
