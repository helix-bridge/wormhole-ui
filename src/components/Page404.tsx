import { Result, Button } from 'antd';
import { Trans } from 'react-i18next';
import { useHistory } from 'react-router-dom';

export function Page404() {
  const history = useHistory();

  return (
    <Result
      status="404"
      title="404"
      subTitle="Sorry, the page you visited does not exist."
      extra={
        <Button type="primary" onClick={() => history.goBack()}>
          <Trans>Back Home</Trans>
        </Button>
      }
    />
  );
}
