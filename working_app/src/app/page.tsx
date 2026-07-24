export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">YouTube Viral Intelligence Engine</h1>
        <p className="text-gray-600 mb-4">A tool for analyzing viral YouTube videos and generating content.</p>
        <a href="/password" className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700">
          Get Started
        </a>
      </div>
    </div>
  )
}
