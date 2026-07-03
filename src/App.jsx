import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { useCurrentInternship } from './context/InternshipContext'
import { Spinner } from './components/ui'
import Login from './components/Login'
import Layout from './components/Layout'
import InternshipOnboard from './components/InternshipOnboard'
import Dashboard from './pages/Dashboard'
import Weeks from './pages/Weeks'
import Learnings from './pages/Learnings'
import DailyLog from './pages/DailyLog'
import Projects from './pages/Projects'
import Todos from './pages/Todos'
import Board from './pages/Board'

function FullScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
      <Spinner className="h-8 w-8" />
    </div>
  )
}

export default function App() {
  const { session, loading } = useAuth()
  const { loading: iLoading, internships, currentId } = useCurrentInternship()

  if (loading) return <FullScreen />
  if (!session) return <Login />
  if (iLoading) return <FullScreen />

  // Ingen internships enda: la brukeren opprette det forste.
  if (internships.length === 0) return <InternshipOnboard />
  if (!currentId) return <FullScreen />

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/weeks" element={<Weeks />} />
        <Route path="/learnings" element={<Learnings />} />
        <Route path="/log" element={<DailyLog />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/todos" element={<Todos />} />
        <Route path="/board" element={<Board />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}
