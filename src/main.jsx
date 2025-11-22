// D:\web-project\gifts-web-chat-vite\src\main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
// 🚨 هذا الاستيراد يجب أن يكون موجوداً
import './index.css' 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)