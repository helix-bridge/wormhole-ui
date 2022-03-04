import { Button, Result } from 'antd';
import { Trans } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Path } from '../../config/constant';

export function Page404() {
  return (
    <Result
      status="404"
      title="404"
      subTitle="Sorry, the page you visited does not exist."
      extra={
        <Button type="primary">
          <Link to={Path.root}>
            <Trans>Back Home</Trans>
          </Link>
        </Button>
      }
    />
  );
}
