import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Auth from './Auth'
import Moments from './moments'
import PublishMoment from './PublishMoment'
import ProtectedRoute from './ProtectedRoute'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Auth />} />
        
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Moments />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/publish" 
          element={
            <ProtectedRoute>
              <PublishMoment />
            </ProtectedRoute>
          } 
        />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App
