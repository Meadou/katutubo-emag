import { Route, Routes } from 'react-router-dom'

/** Temporary shell while the Paper islands journey is rebuilt. */
export default function App() {
  return (
    <main>
      <Routes>
        <Route path="*" element={<h1>Katutubo</h1>} />
      </Routes>
    </main>
  )
}
