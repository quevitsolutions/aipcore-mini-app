import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { getAppKitModal } from './utils/web3';

// Initialize Web3 Modal at entry point to avoid bundling TDZ errors
getAppKitModal();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
