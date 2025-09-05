import { ThemeSwitch } from './theme-switch'
import Link from 'next/link'

export function Navbar() {
  return (
    <nav style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-body)' }} className="fixed top-0 left-0 right-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
            <Link href="/">
              <h1 style={{ color: 'var(--accent-color)' }} className="text-2xl font-bold cursor-pointer transition-colors hover:opacity-80">
                ResuGPT
              </h1>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <ThemeSwitch />

            <Link 
              href="/"
              className="cursor-pointer bg-[#005b96] hover:bg-[#004578] text-white px-4 py-2 rounded-md font-medium transition-colors text-center inline-block"
            >
              Try Now
            </Link>

            <Link 
              href="/auth" 
              className="cursor-pointer border border-[#005b96] text-[#005b96] hover:bg-[#005b96] hover:text-white px-4 py-2 rounded-md font-medium transition-colors text-center inline-block"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}