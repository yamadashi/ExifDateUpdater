import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Upload from './pages/upload/Upload.jsx'
import Download from './pages/download/Download.js'
import NotFound from './pages/NotFound.jsx'

const RouterConfig: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/upload" replace />} />
      <Route path="/upload" element={<Upload />} />
      <Route path="/download/:batchId" element={<Download />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default RouterConfig
