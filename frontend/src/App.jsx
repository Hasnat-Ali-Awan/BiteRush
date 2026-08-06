import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [status, setStatus] = useState('Checking…')
  const [users, setUsers] = useState([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  async function load() {
    setError('')
    try {
      const helloRes = await fetch('/api')
      if (!helloRes.ok) throw new Error(`Backend responded ${helloRes.status}`)
      const hello = await helloRes.text()

      const usersRes = await fetch('/api/users')
      if (!usersRes.ok) throw new Error(`Users API responded ${usersRes.status}`)
      const data = await usersRes.json()

      setStatus(`Connected — ${hello}`)
      setUsers(data)
    } catch (err) {
      setStatus('Disconnected')
      setError(err.message)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleCreate(e) {
    e.preventDefault()
    setError('')
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      })
      if (!res.ok) throw new Error(`Create failed (${res.status})`)
      setName('')
      setEmail('')
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <main className="app">
      <h1>BiteRush</h1>
      <p className={status.startsWith('Connected') ? 'ok' : 'bad'}>{status}</p>
      {error ? <p className="bad">{error}</p> : null}

      <form onSubmit={handleCreate} className="form">
        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit">Add user</button>
      </form>

      <button type="button" className="counter" onClick={load}>
        Refresh
      </button>

      <ul className="users">
        {users.length === 0 ? (
          <li>No users yet</li>
        ) : (
          users.map((user) => (
            <li key={user._id}>
              {user.name} — {user.email}
            </li>
          ))
        )}
      </ul>
    </main>
  )
}

export default App
