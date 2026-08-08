import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import L from 'leaflet'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Restaurant, Utilisateur, Visite } from '../api/types.ts'
import { Role } from '../api/types.ts'
import { FavorisProvider } from '../contexts/FavorisContext.tsx'
import RestaurantsMap from './RestaurantsMap.tsx'
import '../leaflet-icon-fix.ts'

// jsdom ne fait aucune mise en page réelle : clientWidth/clientHeight valent
// toujours 0, ce que Leaflet utilise pour calculer la taille de la carte
// (`getSize()`). Sans une taille non nulle, les calculs de zoom-vers-limites
// de Leaflet.markercluster (`zoomToBounds`, utilisé par `zoomToShowLayer`
// pour faire éclater un cluster contenant le marqueur sélectionné) produisent
// des bornes invalides et plus aucun marqueur ne reste affiché sur la carte.
beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
    configurable: true,
    value: 1024,
  })
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
    configurable: true,
    value: 768,
  })
})

const {
  getVisitesMock,
  getMesFavorisMock,
  deleteRestaurantMock,
  deleteVisiteMock,
  addFavoriMock,
  removeFavoriMock,
} = vi.hoisted(() => ({
  getVisitesMock: vi.fn(),
  getMesFavorisMock: vi.fn(),
  deleteRestaurantMock: vi.fn(),
  deleteVisiteMock: vi.fn(),
  addFavoriMock: vi.fn(),
  removeFavoriMock: vi.fn(),
}))

vi.mock('../api/client.ts', async () => {
  const actual =
    await vi.importActual<typeof import('../api/client.ts')>(
      '../api/client.ts',
    )
  return {
    ...actual,
    getVisites: getVisitesMock,
    getMesFavoris: getMesFavorisMock,
    deleteRestaurant: deleteRestaurantMock,
    deleteVisite: deleteVisiteMock,
    addFavori: addFavoriMock,
    removeFavori: removeFavoriMock,
  }
})

const adminUser: Utilisateur = {
  id: 'admin-1',
  email: 'admin@example.com',
  nomAffiche: 'Admin',
  role: Role.Admin,
}

vi.mock('../contexts/AuthContext.tsx', () => ({
  useAuth: () => ({
    user: adminUser,
    loading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
  }),
}))

const restaurantA: Restaurant = {
  id: 'restaurant-a',
  nom: 'Chez Aline',
  adresse: '1 rue de Paris',
  latitude: 48.85,
  longitude: 2.35,
  categories: [],
  description: null,
  telephone: null,
  siteWeb: null,
  horaires: null,
  photos: [],
}

const restaurantB: Restaurant = {
  id: 'restaurant-b',
  nom: 'Le Petit Coin',
  adresse: '2 rue de Lyon',
  // Volontairement proche de restaurantA (quelques centaines de mètres, pas
  // à Lyon malgré l'adresse) : avec le clustering (Phase 7b), un restaurant
  // sélectionné via la sidebar recentre/zoome fortement la carte dessus, et
  // Leaflet.markercluster ne rend plus dans le DOM les marqueurs hors de la
  // zone actuellement visible (virtualisation par viewport) — trop éloigné,
  // le marqueur de restaurantB deviendrait injoignable par un clic direct
  // dans le test ci-dessous.
  latitude: 48.855,
  longitude: 2.355,
  categories: [],
  description: null,
  telephone: null,
  siteWeb: null,
  horaires: null,
  photos: [],
}

const restaurants = [restaurantA, restaurantB]
const visites: Visite[] = []

function makeRestaurant(id: string, nom: string): Restaurant {
  return {
    id,
    nom,
    adresse: `Adresse ${nom}`,
    latitude: 45,
    longitude: 5,
    categories: [],
    description: null,
    telephone: null,
    siteWeb: null,
    horaires: null,
    photos: [],
  }
}

function makeVisite(overrides: Partial<Visite>): Visite {
  return {
    id: 'visite-x',
    restaurantId: restaurantA.id,
    date: '2026-01-01',
    note: 4,
    commentaire: null,
    urlsPhotos: [],
    utilisateurId: adminUser.id,
    utilisateurNomAffiche: adminUser.nomAffiche,
    avecQui: null,
    reservation: null,
    budget: null,
    tempsAttente: null,
    ...overrides,
  }
}

function renderMap(
  props: Partial<React.ComponentProps<typeof RestaurantsMap>> = {},
) {
  const defaultProps: React.ComponentProps<typeof RestaurantsMap> = {
    theme: 'light',
    restaurants,
    visites,
    utilisateursAvecFavoris: [],
    visiteMutation: null,
    onEditRestaurant: vi.fn(),
    onEditVisite: vi.fn(),
    onRestaurantDeleted: vi.fn(),
    onVisiteDeleted: vi.fn(),
    onAddVisite: vi.fn(),
  }
  return render(
    <MemoryRouter>
      <FavorisProvider>
        <RestaurantsMap {...defaultProps} {...props} />
      </FavorisProvider>
    </MemoryRouter>,
  )
}

/**
 * Retrouve le marqueur Leaflet (l'élément `.leaflet-marker-icon`) d'un
 * restaurant par son nom, via l'`aria-describedby` du marqueur qui pointe
 * vers l'id de son tooltip permanent (`leaflet-tooltip-N`, affichant le nom
 * du restaurant). Avec le clustering (Phase 7b), Leaflet.markercluster
 * n'ajoute plus forcément les marqueurs au DOM dans l'ordre du tableau
 * `restaurants` passé en props (l'ordre dépend de sa structure interne en
 * grille spatiale) — un index fixe (`markers[1]`) n'est donc plus fiable
 * pour cibler un restaurant précis.
 */
function findMarkerByRestaurantName(name: string): HTMLElement {
  const tooltip = [...document.querySelectorAll('.restaurant-label-nom')].find(
    (el) => el.textContent === name,
  )
  const tooltipContainer = tooltip?.closest('[id^="leaflet-tooltip-"]')
  if (!tooltipContainer) {
    throw new Error(`Aucun tooltip trouvé pour le restaurant "${name}"`)
  }
  const marker = document.querySelector(
    `.leaflet-marker-icon[aria-describedby="${tooltipContainer.id}"]`,
  )
  if (!marker) {
    throw new Error(`Aucun marqueur trouvé pour le restaurant "${name}"`)
  }
  return marker as HTMLElement
}

/**
 * Bouton "sélectionner" d'un item de la sidebar, par nom de restaurant.
 * Depuis l'ajout du cœur favori en frère du bouton de sélection (Phase 8),
 * `getByRole('button', { name: /nom/ })` seul est ambigu : le bouton favori
 * porte aussi le nom du restaurant dans son `aria-label` ("Ajouter X aux
 * favoris"). `getAllByRole` + premier élément lève l'ambiguïté en se basant
 * sur l'ordre du DOM (le bouton de sélection est toujours rendu avant le
 * bouton favori, cf. `RestaurantsMap.tsx`).
 */
function getSidebarSelectButton(name: string): HTMLElement {
  return screen.getAllByRole('button', { name: new RegExp(name) })[0]
}

describe('RestaurantsMap', () => {
  beforeEach(() => {
    getVisitesMock.mockReset()
    getMesFavorisMock.mockReset()
    deleteRestaurantMock.mockReset()
    deleteVisiteMock.mockReset()
    addFavoriMock.mockReset()
    removeFavoriMock.mockReset()
    getVisitesMock.mockResolvedValue([])
    getMesFavorisMock.mockResolvedValue([])
    vi.spyOn(window, 'confirm').mockReturnValue(true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("n'affiche pas de panneau de détail tant qu'aucun restaurant n'est sélectionné, mais affiche l'état vide", () => {
    renderMap()

    expect(
      document.querySelector('.restaurant-detail-panel'),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Sélectionnez un restaurant' }),
    ).toBeInTheDocument()
  })

  it('sélectionne un restaurant et affiche le panneau de détail au clic dans la sidebar', async () => {
    const user = userEvent.setup()
    renderMap()

    await user.click(
      getSidebarSelectButton('Chez Aline'),
    )

    expect(
      await screen.findByRole('heading', { name: 'Chez Aline', level: 2 }),
    ).toBeInTheDocument()
  })

  it('ajoute un favori au clic sur le cœur de la sidebar sans sélectionner le restaurant', async () => {
    const user = userEvent.setup()
    addFavoriMock.mockResolvedValue(undefined)
    renderMap()

    await user.click(
      screen.getByRole('button', { name: 'Ajouter Chez Aline aux favoris' }),
    )

    expect(addFavoriMock).toHaveBeenCalledWith('restaurant-a')
    expect(
      document.querySelector('.restaurant-detail-panel'),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Sélectionnez un restaurant' }),
    ).toBeInTheDocument()
  })

  it("n'échoue pas silencieusement quand l'ajout du favori est rejeté (plafond atteint)", async () => {
    const user = userEvent.setup()
    addFavoriMock.mockRejectedValue(new Error('422'))
    renderMap()

    await user.click(
      screen.getByRole('button', { name: 'Ajouter Chez Aline aux favoris' }),
    )

    await waitFor(() => expect(addFavoriMock).toHaveBeenCalled())
  })

  it('sélectionne un restaurant et affiche le panneau de détail au clic sur son marqueur', async () => {
    renderMap()

    // react-leaflet-cluster ajoute les marqueurs au groupe de clustering de
    // façon asynchrone (microtask), d'où le waitFor plutôt qu'une lecture
    // synchrone du DOM juste après le rendu.
    await waitFor(() =>
      expect(document.querySelectorAll('.leaflet-marker-icon').length).toBe(2),
    )
    // fireEvent plutôt que userEvent : userEvent.click() simule une vraie
    // séquence pointerdown/mousedown/pointerup/mouseup/click, et Leaflet
    // supprime le "click" qui suit un mousedown/mouseup s'il détecte un drag
    // (_draggableMoved). En jsdom, le conteneur a une taille simulée
    // (clientWidth/clientHeight mockés ci-dessus) mais les marqueurs restent
    // sans coordonnées de layout réelles (getBoundingClientRect toujours à
    // 0,0,0,0) : ce décalage déclenche parfois à tort la détection de drag de
    // Leaflet et avale le clic (flaky avec userEvent). fireEvent.click()
    // dispatche un seul évènement "click" directement sur le nœud ciblé, sans
    // passer par cette séquence bas niveau — fiable ici, sans rapport avec le
    // clustering en lui-même.
    fireEvent.click(findMarkerByRestaurantName('Le Petit Coin'))

    expect(
      await screen.findByRole('heading', { name: 'Le Petit Coin', level: 2 }),
    ).toBeInTheDocument()
    await waitFor(() => expect(getVisitesMock).toHaveBeenCalledWith('restaurant-b'))
  })

  it('ferme le panneau de détail et efface la sélection au clic sur Fermer', async () => {
    const user = userEvent.setup()
    renderMap()

    await user.click(getSidebarSelectButton('Chez Aline'))
    expect(
      await screen.findByRole('heading', { name: 'Chez Aline', level: 2 }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Fermer' }))

    await waitFor(() =>
      expect(
        document.querySelector('.restaurant-detail-panel'),
      ).not.toBeInTheDocument(),
    )
  })

  it('transmet onAddVisite avec l\'id du restaurant sélectionné', async () => {
    const user = userEvent.setup()
    const onAddVisite = vi.fn()
    renderMap({ onAddVisite })

    await user.click(getSidebarSelectButton('Chez Aline'))
    await screen.findByRole('heading', { name: 'Chez Aline', level: 2 })

    await user.click(
      screen.getByRole('button', { name: '+ Ajouter une visite' }),
    )

    expect(onAddVisite).toHaveBeenCalledWith('restaurant-a')
  })

  it('affiche une vignette photo de couverture par restaurant dans la sidebar', () => {
    renderMap()

    const items = document.querySelectorAll('.map-sidebar-item-thumb')
    expect(items.length).toBe(2)
  })

  it('limite la sidebar à un aperçu de 4 restaurants avec un lien vers la liste complète', () => {
    const manyRestaurants = Array.from({ length: 7 }, (_, i) =>
      makeRestaurant(`restaurant-${i + 1}`, `Restaurant ${i + 1}`),
    )
    renderMap({ restaurants: manyRestaurants })

    expect(document.querySelectorAll('.map-sidebar-item').length).toBe(4)
    expect(screen.getByText('7 résultats')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /Voir tous les restaurants/ }),
    ).toHaveAttribute('href', '/liste')
  })

  it('affiche le nombre de visites personnelles et la date de la dernière dans la sidebar', () => {
    renderMap({
      visites: [
        makeVisite({ id: 'v1', date: '2026-06-01' }),
        makeVisite({ id: 'v2', date: '2026-08-01' }),
      ],
    })

    expect(screen.getByText('2 visites · Dernière le 01/08/2026')).toBeInTheDocument()
  })

  it('révèle le marqueur sélectionné via zoomToShowLayer du groupe de clustering (au cas où il serait masqué dans un cluster)', async () => {
    // Vérifie le câblage réel ajouté en Phase 7b : un simple map.setView ne
    // suffirait pas à faire éclater un cluster contenant le marqueur
    // sélectionné, d'où l'appel à zoomToShowLayer (API de
    // Leaflet.markercluster, exposée par le ref de MarkerClusterGroup) plutôt
    // que de recentrer directement. On espionne la méthode réelle sur le
    // prototype plutôt que de reproduire la géométrie de clustering en jsdom
    // (peu fiable, cf. commentaires plus haut sur clientWidth/clientHeight).
    const zoomToShowLayerSpy = vi.spyOn(
      L.MarkerClusterGroup.prototype,
      'zoomToShowLayer',
    )
    const user = userEvent.setup()
    renderMap()

    await user.click(getSidebarSelectButton('Chez Aline'))
    await screen.findByRole('heading', { name: 'Chez Aline', level: 2 })

    await waitFor(() => expect(zoomToShowLayerSpy).toHaveBeenCalledTimes(1))
    const [layerArg, callbackArg] = zoomToShowLayerSpy.mock.calls[0]
    expect(layerArg).toBeInstanceOf(L.Marker)
    expect(typeof callbackArg).toBe('function')
  })

  it('sélectionne le bon restaurant après un clic sidebar suivi d\'un clic sur un autre marqueur', async () => {
    const user = userEvent.setup()
    renderMap()

    await user.click(getSidebarSelectButton('Chez Aline'))
    await screen.findByRole('heading', { name: 'Chez Aline', level: 2 })

    // react-leaflet-cluster ajoute les marqueurs au groupe de clustering de
    // façon asynchrone (microtask), d'où le waitFor plutôt qu'une lecture
    // synchrone du DOM juste après le rendu.
    await waitFor(() =>
      expect(document.querySelectorAll('.leaflet-marker-icon').length).toBe(2),
    )
    // fireEvent plutôt que userEvent : voir commentaire équivalent plus haut
    // (hit-testing par coordonnées ambigu en jsdom sur des marqueurs Leaflet
    // sans layout réel).
    fireEvent.click(findMarkerByRestaurantName('Le Petit Coin'))

    const heading = await screen.findByRole('heading', {
      name: 'Le Petit Coin',
      level: 2,
    })
    expect(heading).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Chez Aline', level: 2 }),
    ).not.toBeInTheDocument()
  })

  describe('sections basses (Phase 7c)', () => {
    it("n'affiche pas la section \"Visites récentes\" quand l'utilisateur connecté n'a aucune visite", () => {
      renderMap()

      expect(screen.queryByText('Visites récentes')).not.toBeInTheDocument()
    })

    it('affiche la section "Visites récentes" tronquée aux 4 dernières visites, avec un lien "Voir tout" au-delà', async () => {
      const sevenVisites = Array.from({ length: 7 }, (_, index) =>
        makeVisite({
          id: `visite-${index}`,
          restaurantId: index % 2 === 0 ? restaurantA.id : restaurantB.id,
          date: `2026-01-${String(index + 1).padStart(2, '0')}`,
        }),
      )
      renderMap({ visites: sevenVisites })

      expect(await screen.findByText('Visites récentes')).toBeInTheDocument()
      const rows = document.querySelectorAll('.map-recent-visit-row')
      expect(rows.length).toBe(4)
      for (const row of rows) {
        expect(row).toHaveAttribute('href', '/visites')
      }
      expect(screen.getAllByRole('link', { name: 'Voir tout' })[0]).toHaveAttribute(
        'href',
        '/visites',
      )
    })

    it('affiche la grille Favoris à 6 emplacements sous la carte', async () => {
      renderMap()

      expect(
        await screen.findByRole('heading', { name: 'Mes favoris (6 max)', level: 3 }),
      ).toBeInTheDocument()
      await waitFor(() =>
        expect(document.querySelectorAll('.favoris-slot').length).toBe(6),
      )
    })

    it('affiche la section "Recommandés pour vous" quand des recommandations existent', async () => {
      const italien = { id: 'cat-italien', nom: 'Italien', groupe: 'Type de cuisine' }
      const restaurantAAvecCategorie: Restaurant = {
        ...restaurantA,
        categories: [italien],
      }
      const restaurantCRecommande: Restaurant = {
        id: 'restaurant-c',
        nom: 'La Trattoria',
        adresse: '3 rue de Turin',
        latitude: 48.86,
        longitude: 2.36,
        categories: [italien],
        description: null,
        telephone: null,
        siteWeb: null,
        horaires: null,
        photos: [],
      }
      const visiteAdmin = makeVisite({
        id: 'visite-admin',
        restaurantId: restaurantA.id,
      })

      renderMap({
        restaurants: [restaurantAAvecCategorie, restaurantB, restaurantCRecommande],
        visites: [visiteAdmin],
      })

      const heading = await screen.findByRole('heading', {
        name: 'Recommandés pour vous',
        level: 3,
      })
      expect(heading).toBeInTheDocument()
      const section = heading.closest('section')
      expect(section).not.toBeNull()
      expect(
        section && Array.from(section.querySelectorAll('h3')).some(
          (el) => el.textContent === 'La Trattoria',
        ),
      ).toBe(true)
    })
  })
})
