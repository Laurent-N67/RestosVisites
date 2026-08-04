import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type {
  Categorie,
  Restaurant,
  UtilisateurAvecFavoris,
  Visite,
} from '../api/types.ts'
import type { Theme } from '../hooks/useTheme.ts'
import { averageNote } from '../utils/visites.ts'
import { formatNoteMoyenne } from '../utils/format.ts'

interface StatsPageProps {
  restaurants: Restaurant[]
  visites: Visite[]
  categories: Categorie[]
  utilisateursAvecFavoris: UtilisateurAvecFavoris[]
  theme: Theme
}

const CHART_COLORS_LIGHT = {
  accent: '#ff7a45',
  star: '#f5a623',
  success: '#22c55e',
  text: '#6b7280',
  textH: '#111827',
  border: 'rgba(0, 0, 0, 0.08)',
  grid: 'rgba(0, 0, 0, 0.08)',
} as const

const CHART_COLORS_DARK = {
  accent: '#ff7a45',
  star: '#f5a623',
  success: '#22c55e',
  text: '#a1a8b8',
  textH: '#ffffff',
  border: 'rgba(255, 255, 255, 0.09)',
  grid: 'rgba(255, 255, 255, 0.12)',
} as const

interface CategoryTally {
  nom: string
  count: number
}

interface MonthlyTally {
  mois: string
  visites: number
}

interface NoteTally {
  note: number
  count: number
}

function tallyTopCategories(restaurants: Restaurant[]): CategoryTally[] {
  const counts = new Map<string, number>()
  for (const restaurant of restaurants) {
    for (const categorie of restaurant.categories) {
      counts.set(categorie.nom, (counts.get(categorie.nom) ?? 0) + 1)
    }
  }
  return Array.from(counts.entries())
    .map(([nom, count]) => ({ nom, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
}

function tallyVisitesByMonth(visites: Visite[]): MonthlyTally[] {
  const counts = new Map<string, number>()
  for (const visite of visites) {
    const mois = visite.date.slice(0, 7) // "AAAA-MM"
    counts.set(mois, (counts.get(mois) ?? 0) + 1)
  }
  return Array.from(counts.entries())
    .map(([mois, visites]) => ({ mois, visites }))
    .sort((a, b) => a.mois.localeCompare(b.mois))
}

function tallyNotes(visites: Visite[]): NoteTally[] {
  const counts = new Map<number, number>([1, 2, 3, 4, 5].map((n) => [n, 0]))
  for (const visite of visites) {
    counts.set(visite.note, (counts.get(visite.note) ?? 0) + 1)
  }
  return Array.from(counts.entries())
    .map(([note, count]) => ({ note, count }))
    .sort((a, b) => a.note - b.note)
}

function formatMonthLabel(mois: string): string {
  const [annee, m] = mois.split('-')
  const date = new Date(Number(annee), Number(m) - 1, 1)
  return date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
}

function StatsPage({
  restaurants,
  visites,
  utilisateursAvecFavoris,
  theme,
}: StatsPageProps) {
  const colors = theme === 'dark' ? CHART_COLORS_DARK : CHART_COLORS_LIGHT

  const totalFavoris = useMemo(
    () =>
      utilisateursAvecFavoris.reduce(
        (sum, utilisateur) => sum + utilisateur.favoris.length,
        0,
      ),
    [utilisateursAvecFavoris],
  )

  const noteMoyenneGlobale = useMemo(() => averageNote(visites), [visites])

  const topCategories = useMemo(
    () => tallyTopCategories(restaurants),
    [restaurants],
  )

  const visitesParMois = useMemo(() => tallyVisitesByMonth(visites), [visites])

  const notesDistribution = useMemo(() => tallyNotes(visites), [visites])

  return (
    <div className="detail-page stats-page">
      <h2>Statistiques</h2>

      <div className="stats-tiles">
        <div className="card stats-tile">
          <span className="stats-tile-value">{restaurants.length}</span>
          <span className="stats-tile-label">Restaurants</span>
        </div>
        <div className="card stats-tile">
          <span className="stats-tile-value">{visites.length}</span>
          <span className="stats-tile-label">Visites</span>
        </div>
        <div className="card stats-tile">
          <span className="stats-tile-value">{totalFavoris}</span>
          <span className="stats-tile-label">Favoris</span>
        </div>
        <div className="card stats-tile">
          <span className="stats-tile-value">
            {noteMoyenneGlobale !== null
              ? formatNoteMoyenne(noteMoyenneGlobale)
              : '—'}
          </span>
          <span className="stats-tile-label">Note moyenne</span>
        </div>
      </div>

      <div className="stats-charts">
        <div className="card stats-chart-card">
          <h3>Catégories les plus représentées</h3>
          {topCategories.length === 0 ? (
            <p className="popup-status">Aucune catégorie enregistrée.</p>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(220, topCategories.length * 34)}>
              <BarChart
                data={topCategories}
                layout="vertical"
                margin={{ top: 4, right: 28, bottom: 4, left: 4 }}
                barCategoryGap={10}
              >
                <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" horizontal={false} />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  stroke={colors.text}
                  tick={{ fill: colors.text, fontSize: 12 }}
                />
                <YAxis
                  type="category"
                  dataKey="nom"
                  width={140}
                  stroke={colors.text}
                  tick={{ fill: colors.textH, fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: colors.grid }}
                  contentStyle={{
                    background: theme === 'dark' ? '#171923' : '#fff',
                    border: `1px solid ${colors.border}`,
                    color: colors.textH,
                  }}
                />
                <Bar dataKey="count" fill={colors.accent} radius={[0, 4, 4, 0]} maxBarSize={20}>
                  <LabelList
                    dataKey="count"
                    position="right"
                    fill={colors.textH}
                    fontSize={12}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card stats-chart-card">
          <h3>Visites par mois</h3>
          {visitesParMois.length === 0 ? (
            <p className="popup-status">Aucune visite enregistrée.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={visitesParMois}>
                <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" />
                <XAxis
                  dataKey="mois"
                  tickFormatter={formatMonthLabel}
                  stroke={colors.text}
                  tick={{ fill: colors.text, fontSize: 12 }}
                />
                <YAxis
                  allowDecimals={false}
                  stroke={colors.text}
                  tick={{ fill: colors.text, fontSize: 12 }}
                />
                <Tooltip
                  labelFormatter={(label) => formatMonthLabel(String(label))}
                  contentStyle={{
                    background: theme === 'dark' ? '#171923' : '#fff',
                    border: `1px solid ${colors.border}`,
                    color: colors.textH,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="visites"
                  stroke={colors.accent}
                  strokeWidth={2}
                  dot={{ fill: colors.accent }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card stats-chart-card">
          <h3>Répartition des notes</h3>
          {visites.length === 0 ? (
            <p className="popup-status">Aucune visite enregistrée.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={notesDistribution}>
                <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" />
                <XAxis
                  dataKey="note"
                  tickFormatter={(note: number) => `${note} ★`}
                  stroke={colors.text}
                  tick={{ fill: colors.text, fontSize: 12 }}
                />
                <YAxis
                  allowDecimals={false}
                  stroke={colors.text}
                  tick={{ fill: colors.text, fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    background: theme === 'dark' ? '#171923' : '#fff',
                    border: `1px solid ${colors.border}`,
                    color: colors.textH,
                  }}
                />
                <Bar dataKey="count" fill={colors.star} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}

export default StatsPage
