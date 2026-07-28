import React from 'react'
import 'sanitize.css'
import './styles/style.css'
import { BrowserRouter as Router } from 'react-router-dom'
import RouterConfig from './router.jsx'
import { LayerProvider } from './hooks/useLayer'

const App: React.FC = () => {
  return (
    <LayerProvider>
      <Router>
        <RouterConfig />
      </Router>
    </LayerProvider>
  )
}

export default App
