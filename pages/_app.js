import 'bootstrap/dist/css/bootstrap.min.css'
import '../styles/globals.css'
import { useEffect } from 'react'

export default function App({ Component, pageProps }) {
  useEffect(() => {
    // Bootstrap JS (dropdowns, modals)
    import('bootstrap/dist/js/bootstrap.bundle.min.js')
  }, [])
  return <Component {...pageProps} />
}
