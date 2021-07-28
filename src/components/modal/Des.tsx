import { Typography } from 'antd';
import { ReactNode } from 'react';

export interface DesProps {
  title: string | ReactNode;
  content: string | ReactNode;
  icon?: ReactNode;
}

export function Des({ title, content, icon }: DesProps) {
  return (
    <div className="my-4 flex items-center gap-2">
      {icon}
      <div>
        <h4 className="text-gray-400 mb-2">{title}:</h4>
        <Typography.Link>{content}</Typography.Link>
      </div>
    </div>
  );
}
