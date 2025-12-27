import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import ReplitFinderApp from './src/App.replitfinder'
import './src/index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ReplitFinderApp />
  </StrictMode>,
)