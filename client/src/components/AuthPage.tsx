import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.tsx'
import LoginPage from './LoginPage.tsx'
import RegisterPage from './RegisterPage.tsx'
import { HeartIcon, MapIcon, PinIcon, ShieldIcon, StarIcon } from './icons/Icons.tsx'
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

interface AuthPageProps {
  mode?: 'login' | 'register'
}

function AuthPage({ mode = 'login' }: AuthPageProps) {
  const { user } = useAuth()

  if (user) {
    return <Navigate to="/" replace />
  }

  return (
    <div className={`auth-page auth-page--${mode}`}>
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

        {/* Bloc marque mobile-only (≤900px, cf. App.css) : remplace, sur mobile,
            le pavé marketing desktop ci-dessus (masqué en dessous de 900px) par
            un titre/logo centré dans le bandeau hero réduit. */}
        <div className="auth-hero-brand">
          <span className="auth-hero-brand-icon" aria-hidden="true">
            <PinIcon />
          </span>
          <h1>RestoVisites</h1>
          <p>Retrouvez, notez et partagez vos meilleures découvertes culinaires.</p>
        </div>
      </div>

      <div className="auth-panels">
        <div className="auth-panels-card">
          <div className="auth-panel auth-panel--login">
            <LoginPage />
          </div>
          <div className="auth-panel auth-panel--register">
            <RegisterPage />
          </div>
        </div>

        {/* Bascules mobile-only (≤900px) entre les écrans /login et /register
            en mode "un seul formulaire" — cf. App.css pour l'affichage
            conditionnel selon `.auth-page--login` / `.auth-page--register`. */}
        <div className="auth-switcher auth-switcher--login">
          <div className="auth-switcher-divider">
            <span>ou</span>
          </div>
          <Link to="/register" className="auth-switcher-btn">
            Créer un compte
          </Link>
        </div>
        <div className="auth-switcher auth-switcher--register">
          <Link to="/login" className="auth-switcher-link">
            J&apos;ai déjà un compte ? <strong>Se connecter</strong>
          </Link>
        </div>

        <p className="auth-mobile-trust">
          <ShieldIcon aria-hidden="true" />
          Vos données sont sécurisées et confidentielles.
        </p>
      </div>
    </div>
  )
}

export default AuthPage
