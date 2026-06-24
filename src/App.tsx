import { Routes, Route } from 'react-router'
import Layout from './components/Layout'
import Home from './pages/Home'
import Games from './pages/Games'
import GameArena from './pages/GameArena'
import Terminal from './pages/Terminal'
import Leaderboard from './pages/Leaderboard'
import Profile from './pages/Profile'
import Arsenal from './pages/Arsenal'
import Fortress from './pages/Fortress'
import VSBattle from './pages/VSBattle'
import About from './pages/About'
import Login from './pages/Login'
import Register from './pages/Register'

export default function App() {
  return (
    <Routes>
      {/* Auth pages — no Layout (no navbar/footer) */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Main app pages — with Layout */}
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/games" element={<Games />} />
        <Route path="/games/:id" element={<GameArena />} />
        <Route path="/terminal" element={<Terminal />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/arsenal" element={<Arsenal />} />
        <Route path="/fortress" element={<Fortress />} />
        <Route path="/vs" element={<VSBattle />} />
        <Route path="/about" element={<About />} />
      </Route>
    </Routes>
  )
}
