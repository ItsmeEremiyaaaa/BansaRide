import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/nunito'
import '@fontsource-variable/baloo-2'
import '../styles.css'
import { AuthProvider } from '../auth'
import AdminApp from './AdminApp'

// The BansaRide admin website (bansalanride.netlify.app/admin/). It is not part of the rider app and is never saved
// for offline use: it always needs a signal, and the database checks that the person is an admin.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <AdminApp />
    </AuthProvider>
  </StrictMode>,
)
