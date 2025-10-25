'use client'

export function HeroSection() {
  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Content */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Compare Text Like
            </span>
            <br />
            <span className="text-gray-900">Never Before</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Advanced semantic text comparison with chunk-based analysis. 
            Understand meaning, not just words. Perfect for writers, editors, and developers.
          </p>
        </div>
      </div>
    </div>
  )
}