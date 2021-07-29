import { TransferNetwork } from '../../model';

interface BridgeProps extends TransferNetwork {
  tx: unknown;
}

/**
 * 负责查找指定的表单
 */
export function Bridge({ from, to }: BridgeProps) {
  console.info('%c [ from, to ]-11', 'font-size:13px; background:pink; color:#bf2c9f;', from, to);

  return <></>;
}
