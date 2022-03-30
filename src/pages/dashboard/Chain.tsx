import { GithubOutlined, GlobalOutlined, TwitterCircleFilled } from '@ant-design/icons';
import { BestNumber } from '../../components/widget/BestNumber';
import { ChainConfig, Facade } from '../../model';
import { isDVM } from '../../utils';

export interface ChainProps {
  config: ChainConfig;
  logoKey?: keyof Facade;
}

export function Chain({ config, logoKey }: ChainProps) {
  const name = isDVM(config) ? `${config.name} Smart Network` : config.name;

  return (
    <div className="flex items-center px-6 py-8 gap-6 bg-antDark">
      <img src={config.facade[logoKey ?? 'logo'] as string} width={70} />

      <div className="flex flex-col gap-2">
        <h6 className="capitalize">{name}</h6>
        {/* <p style={{ color: '#1fe733' }}># 607706</p> */}
        <BestNumber config={config} color={'#1fe733'} />
        <div className="flex gap-2 text-lg">
          <GlobalOutlined />
          <GithubOutlined />
          <TwitterCircleFilled />
        </div>
      </div>
    </div>
  );
}
