import React, { Suspense } from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App';
import './index.scss';
import { ApiProvider, GqlProvider } from './providers';
import { AccountProvider } from './providers/account-provider';
import reportWebVitals from './reportWebVitals';
import './theme/antd/index.less';

ReactDOM.render(
  <Suspense fallback="loading">
    <Router>
      <ApiProvider>
        <AccountProvider>
          <GqlProvider>
            <App />
          </GqlProvider>
        </AccountProvider>
      </ApiProvider>
    </Router>
  </Suspense>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
