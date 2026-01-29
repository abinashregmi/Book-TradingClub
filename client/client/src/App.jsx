import { useState, useEffect } from 'react'
import './styles/App.css'

function App() {
  const [serverStatus, setServerStatus] = useState('Loading...')

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setServerStatus(data.status))
      .catch(err => setServerStatus('Server not connected'))
  }, [])

  return (
    <div className="App">
      <header>
        <h1>Book Trading Club</h1>
        <p>Server Status: {serverStatus}</p>
      </header>
      <main>
        <p>Welcome to the Book Trading Club Application</p>
      </main>
    </div>
  )
}

export default App
