import { message, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import { copyTextToClipboard } from '../utils';
import { CopyIcon } from './icons';

export interface ShortAccountProps {
  account: string;
  isCopyBtnDisplay?: boolean;
  className?: string;
  color?: string;
}

export function ShortAccount({
  account,
  className = '',
  color = 'inherit',
  isCopyBtnDisplay = true,
}: ShortAccountProps) {
  const { t } = useTranslation();
  const endPosition = 6;
  const shortAccount = (
    <span className="cursor-default text-gray-800 dark:text-gray-200">
      {`${account.slice(0, endPosition)}...${account.slice(-endPosition)}`}
    </span>
  );

  return (
    <div className={`${className} flex items-center justify-between`}>
      {isCopyBtnDisplay ? (
        <>
          {/* <AccountType className="sm:inline hidden" /> */}
          <Tooltip title={account}>{shortAccount}</Tooltip>
          <CopyIcon
            onClick={(event) => {
              event.stopPropagation();
              copyTextToClipboard(account).then(() => {
                message.success(t('Copied'));
              });
            }}
            style={{ color }}
            className="ml-2 enlarge-hot-area hidden md:block"
          />
        </>
      ) : (
        shortAccount
      )}
    </div>
  );
}
