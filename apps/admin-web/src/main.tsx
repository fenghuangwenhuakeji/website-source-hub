import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

if (typeof document !== 'undefined') {
  document.title = '凤煌科技';
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
