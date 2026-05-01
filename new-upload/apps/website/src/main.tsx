import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/website-theme.css';
import './styles/unified-overrides.css';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
