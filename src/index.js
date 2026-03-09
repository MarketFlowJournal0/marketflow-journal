import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { TradingProvider } from './context/TradingContext';
import ToastProvider from './components/ToastProvider';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <TradingProvider>
      <App />
      <ToastProvider />
    </TradingProvider>
  </React.StrictMode>
);