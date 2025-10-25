'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Menu, 
  X, 
  ChevronDown,
  CheckCircle
} from 'lucide-react'

export function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProductsOpen, setIsProductsOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-black">
                TextCompare Pro
              </span>
            </div>
            <Badge variant="secondary" className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs">
              FREE
            </Badge>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {/* Products Dropdown */}
            <div className="relative">
              <button
                onMouseEnter={() => setIsProductsOpen(true)}
                onMouseLeave={() => setIsProductsOpen(false)}
                className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 transition-colors py-2"
              >
                <span>Products</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {isProductsOpen && (
                <div 
                  onMouseEnter={() => setIsProductsOpen(true)}
                  onMouseLeave={() => setIsProductsOpen(false)}
                  className="absolute top-full left-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="space-y-4">
                      <Link href="https://octopuslms.com/products" className="block group">
                        <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                            <CheckCircle className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">All Products</h4>
                            <p className="text-sm text-gray-600">Explore our complete suite of tools</p>
                          </div>
                        </div>
                      </Link>
                      
                      <div className="border-t pt-4">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>15+ Premium Tools Available</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Link href="#" className="text-gray-700 hover:text-blue-600 transition-colors">
              Features
            </Link>
            
            <Link href="#" className="text-gray-700 hover:text-blue-600 transition-colors">
              Enterprise
            </Link>
          </div>

          {/* Right Side Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="ghost" className="text-gray-700 hover:text-blue-600">
              Sign In
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-4 py-6 space-y-4">
            <Link href="https://octopuslms.com/products" className="block text-gray-700 hover:text-blue-600 transition-colors">
              Products
            </Link>
            <Link href="#" className="block text-gray-700 hover:text-blue-600 transition-colors">
              Features
            </Link>
            <Link href="#" className="block text-gray-700 hover:text-blue-600 transition-colors">
              Enterprise
            </Link>
            
            <div className="pt-4 border-t border-gray-200 space-y-3">
              <Button variant="ghost" className="w-full justify-start">
                Sign In
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}