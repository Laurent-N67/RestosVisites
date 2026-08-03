import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.tsx'
import LoginPage from './LoginPage.tsx'
import RegisterPage from './RegisterPage.tsx'

function AuthPage() {
  const { user } = useAuth()

  if (user) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="auth-page auth-page-split">
      <div className="auth-panel">
        <LoginPage />
      </div>
      <div className="auth-panel">
        <RegisterPage />
      </div>
    </div>
  )
}

export default AuthPage
