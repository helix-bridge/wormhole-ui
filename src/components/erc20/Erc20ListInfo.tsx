import { Erc20Token, RequiredPartial } from '../../model';
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
        <p>
          <span>{symbol}</span>
          <sup className="ml-2 text-xs">{name}</sup>
        </p>
        <EllipsisMiddle>{address}</EllipsisMiddle>
      </div>
    </div>
  );
}
