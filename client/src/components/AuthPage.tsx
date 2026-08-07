import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.tsx'
import LoginPage from './LoginPage.tsx'
import RegisterPage from './RegisterPage.tsx'
import { HeartIcon, MapIcon, ShieldIcon, StarIcon } from './icons/Icons.tsx'
import authHero from '../assets/auth-hero.jpg'

const FEATURES = [
  {
    icon: MapIcon,
    title: 'Carte interactive',
    text: 'Trouvez et ajoutez des restaurants partout dans le monde.',
  },
  {
    icon: StarIcon,
    title: 'Suivi de vos visites',
    text: 'Notez, commentez et gardez une trace de vos expériences.',
  },
  {
    icon: HeartIcon,
    title: 'Vos favoris',
    text: 'Retrouvez rapidement vos restaurants préférés.',
  },
]

function AuthPage() {
  const { user } = useAuth()

  if (user) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="auth-page">
      <div className="auth-hero">
        <div
          className="auth-hero-image"
          style={{ backgroundImage: `url(${authHero})` }}
        />
        <div className="auth-hero-scrim" />
        <div className="auth-hero-content">
          <h2>
            Vos restaurants préférés,
            <br />
            sur <span>une seule carte</span>.
          </h2>
          <p>
            Enregistrez, visitez, notez et retrouvez les meilleurs restaurants
            où que vous soyez.
          </p>
          <ul className="auth-hero-features">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title}>
                <span className="auth-hero-feature-icon" aria-hidden="true">
                  <Icon />
                </span>
                <div>
                  <strong>{title}</strong>
                  <span>{text}</span>
                </div>
              </li>
            ))}
          </ul>
          <p className="auth-hero-trust">
            <ShieldIcon aria-hidden="true" />
            Vos données sont sécurisées et confidentielles.
          </p>
        </div>
      </div>

      <div className="auth-panels">
        <div className="auth-panels-card">
          <div className="auth-panel">
            <LoginPage />
          </div>
          <div className="auth-panel">
            <RegisterPage />
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthPage
