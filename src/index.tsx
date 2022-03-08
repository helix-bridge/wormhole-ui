import { Suspense } from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App';
import { BallScalePulse } from './components/widget/BallScalePulse';
import './bridges/register';
import { THEME } from './config';
import './index.scss';
import { ApiProvider, GqlProvider, TxProvider } from './providers';
import reportWebVitals from './reportWebVitals';
import './theme/antd/index.less';
import { readStorage } from './utils/helper/storage';

ReactDOM.render(
  <Suspense
    fallback={
      <div
        className={`flex justify-center items-center w-screen h-screen ${
          readStorage().theme === THEME.DARK ? 'bg-black' : 'bg-white'
        }`}
      >
        <BallScalePulse />
      </div>
    }
  >
    <Router>
      <ApiProvider>
        <TxProvider>
          <GqlProvider>
            <App />
          </GqlProvider>
        </TxProvider>
      </ApiProvider>
    </Router>
  </Suspense>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
