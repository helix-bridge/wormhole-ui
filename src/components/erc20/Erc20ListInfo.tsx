import { Erc20Token, RequiredPartial } from '../../model';
import { getTokenName } from '../../utils/erc20/token-util';
import { JazzIcon } from '../icons';
import { EllipsisMiddle } from '../EllipsisMiddle';

interface Erc20SimpleProps {
  token: RequiredPartial<Erc20Token, 'address' | 'logo' | 'name' | 'symbol'>;
  className?: string;
}

export function Erc20ListInfo({ token, className }: Erc20SimpleProps) {
  const { logo, source, address, name, symbol } = token;
  return (
    <div className={`flex w-2/3 ${className ?? ''}`}>
      {logo ? <img src={`/images/${logo}`} alt="" /> : <JazzIcon address={source || address}></JazzIcon>}
      <div className="ml-4 w-full">
        <h6>{getTokenName(name, symbol) || '-'}</h6>
        <EllipsisMiddle>{address}</EllipsisMiddle>
      </div>
    </div>
  );
}
