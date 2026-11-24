import React from 'react'
import {createRoot} from 'react-dom/client'
import {HashRouter} from 'react-router-dom'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import './styles/global.css'
import './styles/extras.css'
import './styles/theme.css'
import './styles/skeuo.css'
import {initTheme} from './services/theme.js'
initTheme()
createRoot(document.getElementById('root')).render(<ErrorBoundary><HashRouter><App/></HashRouter></ErrorBoundary>)
