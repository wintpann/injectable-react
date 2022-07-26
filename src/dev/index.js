import React from 'react';
import ReactDOM from 'react-dom';
import { InjectableHooksHolder } from './injectable';
import { AppContainerResolved } from './resolved';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './style.css';

ReactDOM.render(
  <>
    <InjectableHooksHolder />
    <ToastContainer theme="dark" />
    <AppContainerResolved />
  </>,
  document.getElementById('root'),
);
