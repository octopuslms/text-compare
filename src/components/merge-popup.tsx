'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { X, ArrowLeftRight } from 'lucide-react'

interface MergePopupProps {
  isOpen: boolean
  onClose: () => void
  onMerge: () => void
  side: 'left' | 'right'
  selectedWord: string
  targetWord: string
  selectedSentence: string
  targetSentence: string
  isSentenceMerge: boolean
  position: { x: number; y: number }
}

export function MergePopup({ isOpen, onClose, onMerge, side, selectedWord, targetWord, selectedSentence, targetSentence, isSentenceMerge, position }: MergePopupProps) {
  if (!isOpen) return null

  return (
    <div 
      className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-4 min-w-[200px]"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -100%) translateY(-10px)'
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">Merge Options</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-6 w-6 p-0 hover:bg-gray-100"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
      
      <div className="space-y-3">
        <div className="text-xs text-gray-600 space-y-2">
          {isSentenceMerge ? (
            <>
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-700">Selected:</span>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium max-w-[120px] truncate">
                  {selectedSentence}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-700">Will change to:</span>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium max-w-[120px] truncate">
                  {targetSentence}
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-700">Selected:</span>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                  {selectedWord}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-700">Will change to:</span>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                  {targetWord}
                </span>
              </div>
            </>
          )}
        </div>
        
        <div className="border-t pt-2">
          <Button
            onClick={onMerge}
            size="sm"
            className="w-full h-8 text-xs bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeftRight className="h-3 w-3 mr-1" />
            Set Merge
          </Button>
        </div>
        
        <div className="text-xs text-gray-500 text-center">
          {isSentenceMerge 
            ? (side === 'left' ? '← Exchange sentence with right' : 'Exchange sentence with left →')
            : (side === 'left' ? '← Exchange word with right' : 'Exchange word with left →')
          }
        </div>
      </div>
      
      {/* Arrow pointing down */}
      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
        <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-white"></div>
        <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[5px] border-l-transparent border-r-transparent border-t-gray-200 absolute top-[-1px] left-[-5px]"></div>
      </div>
    </div>
  )
}