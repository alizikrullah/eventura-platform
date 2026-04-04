import { useState } from 'react'

function App() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null)

  const checkBackend = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/health')
      const data = await response.json()
      setIsConnected(data.status === 'ok')
    } catch (error) {
      setIsConnected(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Eventura
          </h1>
          <p className="text-gray-600 mb-8">
            Event Management Platform
          </p>
          
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg">
              <p className="text-sm text-gray-700 font-medium mb-2">
                Frontend Status
              </p>
              <p className="text-green-600 font-semibold">
                ✓ Running on Vite + React
              </p>
            </div>

            <button
              onClick={checkBackend}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Check Backend Connection
            </button>

            {isConnected !== null && (
              <div className={`p-4 rounded-lg ${
                isConnected 
                  ? 'bg-green-50 text-green-700' 
                  : 'bg-red-50 text-red-700'
              }`}>
                <p className="font-medium">
                  {isConnected 
                    ? '✓ Backend connected successfully!' 
                    : '✗ Backend not responding. Make sure backend is running.'}
                </p>
              </div>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Ready for development 🚀
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
