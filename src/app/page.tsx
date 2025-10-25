'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeftRight, 
  FileText, 
  Download, 
  Share2, 
  Sparkles,
  RotateCcw,
  Save,
  Crown,
  Zap,
  Star,
  Copy
} from 'lucide-react'
import { MergePopup } from '@/components/merge-popup'
import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { HeroSection } from '@/components/hero-section'
import Head from 'next/head'

// SEO Structured Data
const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "TextCompare Pro",
  "description": "Free AI-powered text comparison tool with semantic analysis and chunk-based diff. Ads-free, completely free, faster and smarter.",
  "url": "https://text-compare.octopuslms.com",
  "applicationCategory": "Productivity",
  "operatingSystem": "Web Browser",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
    "description": "Completely free text comparison tool"
  },
  "featureList": [
    "Semantic Analysis",
    "Chunk-Based Diff",
    "Enterprise Grade Security",
    "Ads-Free Experience",
    "Fast Processing",
    "Smart Text Understanding"
  ],
  "author": {
    "@type": "Organization",
    "name": "OctopusLMS"
  }
}

interface ComparisonResult {
  leftText: string[]
  rightText: string[]
  leftHighlights: boolean[]
  rightHighlights: boolean[]
  additions: number
  removals: number
  similarity: number
  leftSentences: string[]
  rightSentences: string[]
  leftSentenceHighlights: boolean[]
  rightSentenceHighlights: boolean[]
  sentenceMappings: { left: number[], right: number[] }[]
  chunks: any[]
}

interface MergePopupState {
  isOpen: boolean
  side: 'left' | 'right' | null
  wordIndex: number | null
  sentenceIndex: number | null
  selectedWord: string
  targetWord: string
  selectedSentence: string
  targetSentence: string
  isSentenceMerge: boolean
  position: { x: number; y: number }
}

export default function Home() {
  const [leftText, setLeftText] = useState('Modern technology continues to transform the way humans interact with information and with one another.')
  const [rightText, setRightText] = useState('Modern technology keeps changing how people interact with information and each other.')
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null)
  const [isComparing, setIsComparing] = useState(false)
  const [semanticSimilarity, setSemanticSimilarity] = useState<number | null>(null)
  const [mergePopup, setMergePopup] = useState<MergePopupState>({
    isOpen: false,
    side: null,
    wordIndex: null,
    sentenceIndex: null,
    selectedWord: '',
    targetWord: '',
    selectedSentence: '',
    targetSentence: '',
    isSentenceMerge: false,
    position: { x: 0, y: 0 }
  })

  const compareTexts = async () => {
    if (!leftText.trim() || !rightText.trim()) return

    setIsComparing(true)
    
    try {
      // Get word-level diff
      const response = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leftText, rightText })
      })
      
      const result = await response.json()
      setComparisonResult(result)
      
      // Get semantic similarity
      const similarityResponse = await fetch('/api/similarity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text1: leftText, text2: rightText })
      })
      
      const similarityData = await similarityResponse.json()
      setSemanticSimilarity(similarityData.similarity)
      
    } catch (error) {
      console.error('Comparison failed:', error)
    } finally {
      setIsComparing(false)
    }
  }

  const clearAll = () => {
    setLeftText('')
    setRightText('')
    setComparisonResult(null)
    setSemanticSimilarity(null)
    setMergePopup({
      isOpen: false,
      side: null,
      wordIndex: null,
      sentenceIndex: null,
      selectedWord: '',
      targetWord: '',
      selectedSentence: '',
      targetSentence: '',
      isSentenceMerge: false,
      position: { x: 0, y: 0 }
    })
  }

  const copyToClipboard = async (text: string, side: 'left' | 'right') => {
    try {
      await navigator.clipboard.writeText(text)
      // You could add a toast notification here if needed
      console.log(`${side === 'left' ? 'Original' : 'New'} text copied to clipboard`)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const copyResultToClipboard = async (side: 'left' | 'right') => {
    if (!comparisonResult) return
    
    const text = side === 'left' 
      ? comparisonResult.leftText.join('')
      : comparisonResult.rightText.join('')
    
    await copyToClipboard(text, side)
  }

  const handleSentenceClick = (side: 'left' | 'right', sentenceIndex: number, event: React.MouseEvent) => {
    if (!comparisonResult) return
    
    const isHighlighted = side === 'left' 
      ? comparisonResult.leftSentenceHighlights[sentenceIndex]
      : comparisonResult.rightSentenceHighlights[sentenceIndex]
    
    if (!isHighlighted) return // Only allow clicks on highlighted (unmatched) sentences

    const selectedSentence = side === 'left' 
      ? comparisonResult.leftSentences[sentenceIndex]
      : comparisonResult.rightSentences[sentenceIndex]

    // Find the corresponding sentence on the opposite side
    const targetSentenceIndex = findCorrespondingSentenceIndex(sentenceIndex, side)
    const targetSentence = targetSentenceIndex !== null 
      ? (side === 'left' ? comparisonResult.rightSentences[targetSentenceIndex] : comparisonResult.leftSentences[targetSentenceIndex])
      : 'No match found'

    const rect = (event.target as HTMLElement).getBoundingClientRect()
    
    setMergePopup({
      isOpen: true,
      side,
      wordIndex: null,
      sentenceIndex,
      selectedWord: '',
      targetWord: '',
      selectedSentence,
      targetSentence,
      isSentenceMerge: true,
      position: {
        x: rect.left + rect.width / 2,
        y: rect.top
      }
    })
  }

  const findChunkForWord = (wordIndex: number, side: 'left' | 'right') => {
    if (!comparisonResult || !comparisonResult.chunks) return null
    
    return comparisonResult.chunks.find(chunk => {
      if (side === 'left') {
        return wordIndex >= chunk.leftStart && wordIndex <= chunk.leftEnd
      } else {
        return wordIndex >= chunk.rightStart && wordIndex <= chunk.rightEnd
      }
    })
  }

  const handleWordClick = (side: 'left' | 'right', wordIndex: number, event: React.MouseEvent) => {
    if (!comparisonResult) return
    
    // Check if the word index is valid
    const maxIndex = side === 'left' 
      ? comparisonResult.leftText.length - 1
      : comparisonResult.rightText.length - 1
    
    if (wordIndex > maxIndex) {
      console.warn('Word index out of bounds after merge')
      return
    }
    
    const isHighlighted = side === 'left' 
      ? comparisonResult.leftHighlights[wordIndex]
      : comparisonResult.rightHighlights[wordIndex]
    
    if (!isHighlighted) return // Only allow clicks on highlighted (unmatched) words

    // Find the chunk that contains this word
    const chunk = findChunkForWord(wordIndex, side)
    
    // If no chunk exists, create a simple chunk for this word
    const wordChunk = chunk || {
      leftStart: side === 'left' ? wordIndex : 0,
      leftEnd: side === 'left' ? wordIndex : -1,
      rightStart: side === 'right' ? wordIndex : 0,
      rightEnd: side === 'right' ? wordIndex : -1,
      leftText: side === 'left' ? [comparisonResult.leftText[wordIndex]] : [],
      rightText: side === 'right' ? [comparisonResult.rightText[wordIndex]] : []
    }

    const selectedText = side === 'left' 
      ? wordChunk.leftText.join(' ')
      : wordChunk.rightText.join(' ')

    // Find the corresponding text from the other side with better bounds checking
    let targetText = ''
    if (side === 'left') {
      if (wordChunk.rightText.length > 0) {
        targetText = wordChunk.rightText.join(' ')
      } else {
        // Find the nearest highlighted word on the right
        for (let i = 0; i < comparisonResult.rightHighlights.length; i++) {
          if (comparisonResult.rightHighlights[i] && i < comparisonResult.rightText.length) {
            targetText = comparisonResult.rightText[i]
            break
          }
        }
      }
    } else {
      if (wordChunk.leftText.length > 0) {
        targetText = wordChunk.leftText.join(' ')
      } else {
        // Find the nearest highlighted word on the left
        for (let i = 0; i < comparisonResult.leftHighlights.length; i++) {
          if (comparisonResult.leftHighlights[i] && i < comparisonResult.leftText.length) {
            targetText = comparisonResult.leftText[i]
            break
          }
        }
      }
    }

    const rect = (event.target as HTMLElement).getBoundingClientRect()
    
    setMergePopup({
      isOpen: true,
      side,
      wordIndex,
      sentenceIndex: null,
      selectedWord: selectedText,
      targetWord: targetText,
      selectedSentence: '',
      targetSentence: '',
      isSentenceMerge: false,
      position: {
        x: rect.left + rect.width / 2,
        y: rect.top
      }
    })
  }

  const performMerge = () => {
    if (!comparisonResult || mergePopup.side === null) return

    const newResult = { ...comparisonResult }
    
    if (mergePopup.isSentenceMerge && mergePopup.sentenceIndex !== null) {
      // Handle sentence merge (existing logic)
      if (mergePopup.side === 'left') {
        const targetSentenceIndex = findCorrespondingSentenceIndex(mergePopup.sentenceIndex, 'left')
        if (targetSentenceIndex !== null) {
          // Exchange sentences
          const temp = newResult.leftSentences[mergePopup.sentenceIndex]
          newResult.leftSentences[mergePopup.sentenceIndex] = newResult.rightSentences[targetSentenceIndex]
          newResult.rightSentences[targetSentenceIndex] = temp
          
          // Update highlights
          newResult.leftSentenceHighlights[mergePopup.sentenceIndex] = false
          newResult.rightSentenceHighlights[targetSentenceIndex] = false
          
          // Update the actual words in the text arrays
          updateWordsFromSentenceMerge(newResult, 'left', mergePopup.sentenceIndex, targetSentenceIndex)
        }
      } else {
        const targetSentenceIndex = findCorrespondingSentenceIndex(mergePopup.sentenceIndex, 'right')
        if (targetSentenceIndex !== null) {
          // Exchange sentences
          const temp = newResult.rightSentences[mergePopup.sentenceIndex]
          newResult.rightSentences[mergePopup.sentenceIndex] = newResult.leftSentences[targetSentenceIndex]
          newResult.leftSentences[targetSentenceIndex] = temp
          
          // Update highlights
          newResult.rightSentenceHighlights[mergePopup.sentenceIndex] = false
          newResult.leftSentenceHighlights[targetSentenceIndex] = false
          
          // Update the actual words in the text arrays
          updateWordsFromSentenceMerge(newResult, 'right', mergePopup.sentenceIndex, targetSentenceIndex)
        }
      }
    } else if (!mergePopup.isSentenceMerge && mergePopup.wordIndex !== null) {
      // Handle word merge - replace only words, preserve spacing and indexing
      const chunk = findChunkForWord(mergePopup.wordIndex, mergePopup.side)
      if (chunk) {
        if (mergePopup.side === 'left') {
          // Simple word replacement without index shifting
          const leftWordPositions = []
          const rightWords = []
          
          // Find actual word positions in left chunk (skip spaces)
          for (let i = chunk.leftStart; i <= chunk.leftEnd; i++) {
            if (i < newResult.leftText.length && !/^\s+$/.test(newResult.leftText[i])) {
              leftWordPositions.push(i)
            }
          }
          
          // Get actual words from right chunk (skip spaces)
          for (let i = chunk.rightStart; i <= chunk.rightEnd; i++) {
            if (i < newResult.rightText.length && !/^\s+$/.test(newResult.rightText[i])) {
              rightWords.push(newResult.rightText[i])
            }
          }
          
          // Replace words in-place without changing array structure
          const newLeftText = [...newResult.leftText]
          const newLeftHighlights = [...newResult.leftHighlights]
          
          // Replace each left word with corresponding right word (1-to-1 mapping)
          const replaceCount = Math.min(leftWordPositions.length, rightWords.length)
          for (let i = 0; i < replaceCount; i++) {
            const leftPos = leftWordPositions[i]
            const rightWord = rightWords[i]
            
            // Validate: ensure we're not replacing with whitespace
            if (!/^\s+$/.test(rightWord) && rightWord.length > 0) {
              newLeftText[leftPos] = rightWord
              newLeftHighlights[leftPos] = false // Remove highlight after merge
            }
          }
          
          // Don't add or remove words - just replace what exists
          // This preserves the original indexing structure
          
          newResult.leftText = newLeftText
          newResult.leftHighlights = newLeftHighlights
          
        } else {
          // Simple word replacement without index shifting (right side)
          const rightWordPositions = []
          const leftWords = []
          
          // Find actual word positions in right chunk (skip spaces)
          for (let i = chunk.rightStart; i <= chunk.rightEnd; i++) {
            if (i < newResult.rightText.length && !/^\s+$/.test(newResult.rightText[i])) {
              rightWordPositions.push(i)
            }
          }
          
          // Get actual words from left chunk (skip spaces)
          for (let i = chunk.leftStart; i <= chunk.leftEnd; i++) {
            if (i < newResult.leftText.length && !/^\s+$/.test(newResult.leftText[i])) {
              leftWords.push(newResult.leftText[i])
            }
          }
          
          // Replace words in-place without changing array structure
          const newRightText = [...newResult.rightText]
          const newRightHighlights = [...newResult.rightHighlights]
          
          // Replace each right word with corresponding left word (1-to-1 mapping)
          const replaceCount = Math.min(rightWordPositions.length, leftWords.length)
          for (let i = 0; i < replaceCount; i++) {
            const rightPos = rightWordPositions[i]
            const leftWord = leftWords[i]
            
            // Validate: ensure we're not replacing with whitespace
            if (!/^\s+$/.test(leftWord) && leftWord.length > 0) {
              newRightText[rightPos] = leftWord
              newRightHighlights[rightPos] = false // Remove highlight after merge
            }
          }
          
          // Don't add or remove words - just replace what exists
          // This preserves the original indexing structure
          
          newResult.rightText = newRightText
          newResult.rightHighlights = newRightHighlights
        }
        
        // Recalculate chunks after the merge
        const recomputeResult = recomputeChunksAfterMerge(newResult)
        if (recomputeResult) {
          Object.assign(newResult, recomputeResult)
        }
      } else {
        // Handle single word merge when no chunk exists
        if (mergePopup.side === 'left') {
          // Find the target word to replace with
          let targetWord = ''
          for (let i = 0; i < newResult.rightHighlights.length; i++) {
            if (newResult.rightHighlights[i]) {
              targetWord = newResult.rightText[i]
              break
            }
          }
          
          if (targetWord) {
            newResult.leftText[mergePopup.wordIndex] = targetWord
            newResult.leftHighlights[mergePopup.wordIndex] = false
          }
        } else {
          // Find the target word to replace with
          let targetWord = ''
          for (let i = 0; i < newResult.leftHighlights.length; i++) {
            if (newResult.leftHighlights[i]) {
              targetWord = newResult.leftText[i]
              break
            }
          }
          
          if (targetWord) {
            newResult.rightText[mergePopup.wordIndex] = targetWord
            newResult.rightHighlights[mergePopup.wordIndex] = false
          }
        }
        
        // Recalculate chunks after the merge
        const recomputeResult = recomputeChunksAfterMerge(newResult)
        if (recomputeResult) {
          Object.assign(newResult, recomputeResult)
        }
      }
    }

    // Recalculate statistics
    newResult.additions = newResult.rightHighlights.filter(h => h).length
    newResult.removals = newResult.leftHighlights.filter(h => h).length
    const totalWords = Math.max(newResult.leftText.length, newResult.rightText.length)
    newResult.similarity = totalWords > 0 ? (totalWords - newResult.additions - newResult.removals) / totalWords : 1

    setComparisonResult(newResult)
    setMergePopup({
      isOpen: false,
      side: null,
      wordIndex: null,
      sentenceIndex: null,
      selectedWord: '',
      targetWord: '',
      selectedSentence: '',
      targetSentence: '',
      isSentenceMerge: false,
      position: { x: 0, y: 0 }
    })
  }

  // Helper function to recompute chunks after merge (simplified for index preservation)
  const recomputeChunksAfterMerge = (result: ComparisonResult) => {
    try {
      // Since we're preserving array structure (no splice operations), 
      // we only need to update the existing chunks with new text content
      const newChunks = []
      
      // Copy existing chunks and update their text content
      if (comparisonResult && comparisonResult.chunks) {
        for (const chunk of comparisonResult.chunks) {
          // Check if this chunk still has highlighted words
          const hasLeftHighlights = chunk.leftStart <= chunk.leftEnd && 
            chunk.leftStart < result.leftHighlights.length &&
            chunk.leftEnd < result.leftHighlights.length &&
            result.leftHighlights.slice(chunk.leftStart, chunk.leftEnd + 1).some(h => h)
          
          const hasRightHighlights = chunk.rightStart <= chunk.rightEnd &&
            chunk.rightStart < result.rightHighlights.length &&
            chunk.rightEnd < result.rightHighlights.length &&
            result.rightHighlights.slice(chunk.rightStart, chunk.rightEnd + 1).some(h => h)
          
          if (hasLeftHighlights || hasRightHighlights) {
            // Update chunk with current text content
            newChunks.push({
              ...chunk,
              leftText: result.leftText.slice(chunk.leftStart, chunk.leftEnd + 1),
              rightText: result.rightText.slice(chunk.rightStart, chunk.rightEnd + 1)
            })
          }
        }
      }
      
      return { chunks: newChunks }
    } catch (error) {
      console.error('Error recomputing chunks:', error)
      return { chunks: [] }
    }
  }

  // Helper function to identify semantic chunks for text array
  const identifySemanticChunksForText = (words: string[]) => {
    const chunks = []
    let i = 0
    
    while (i < words.length) {
      let chunkSize = 1
      
      // Simple chunking logic - group 2-3 words together
      if (i < words.length - 1) {
        chunkSize = Math.min(2 + Math.floor(Math.random() * 2), words.length - i)
      }
      
      chunks.push({
        start: i,
        end: i + chunkSize - 1,
        text: words.slice(i, i + chunkSize)
      })
      
      i += chunkSize
    }
    
    return chunks
  }

  const findCorrespondingSentenceIndex = (currentIndex: number, side: 'left' | 'right'): number | null => {
    if (!comparisonResult) return null
    
    const oppositeHighlights = side === 'left' ? comparisonResult.rightSentenceHighlights : comparisonResult.leftSentenceHighlights
    const oppositeLength = oppositeHighlights.length
    
    // Look for the closest unmatched sentence
    for (let offset = 0; offset < Math.max(oppositeLength, currentIndex + 5); offset++) {
      // Check forward
      if (currentIndex + offset < oppositeLength && oppositeHighlights[currentIndex + offset]) {
        return currentIndex + offset
      }
      // Check backward
      if (currentIndex - offset >= 0 && oppositeHighlights[currentIndex - offset]) {
        return currentIndex - offset
      }
    }
    
    // If no close match found, find any unmatched sentence
    for (let i = 0; i < oppositeLength; i++) {
      if (oppositeHighlights[i]) {
        return i
      }
    }
    
    return null
  }

  const updateWordsFromSentenceMerge = (result: ComparisonResult, side: 'left' | 'right', sentenceIndex: number, targetSentenceIndex: number) => {
    // This is a simplified approach - in a real implementation, you'd want to
    // properly handle word boundaries and punctuation
    if (side === 'left') {
      const leftMapping = result.sentenceMappings[sentenceIndex]?.left || []
      const rightMapping = result.sentenceMappings[targetSentenceIndex]?.right || []
      
      // Update words based on sentence mappings
      leftMapping.forEach((wordIndex, i) => {
        if (i < rightMapping.length && wordIndex < result.leftText.length && rightMapping[i] < result.rightText.length) {
          result.leftText[wordIndex] = result.rightText[rightMapping[i]]
          result.leftHighlights[wordIndex] = false
        }
      })
    } else {
      const rightMapping = result.sentenceMappings[sentenceIndex]?.right || []
      const leftMapping = result.sentenceMappings[targetSentenceIndex]?.left || []
      
      // Update words based on sentence mappings
      rightMapping.forEach((wordIndex, i) => {
        if (i < leftMapping.length && wordIndex < result.rightText.length && leftMapping[i] < result.leftText.length) {
          result.rightText[wordIndex] = result.leftText[leftMapping[i]]
          result.rightHighlights[wordIndex] = false
        }
      })
    }
  }

  const findCorrespondingWordIndex = (currentIndex: number, side: 'left' | 'right'): number | null => {
    if (!comparisonResult) return null
    
    // Simple strategy: find the nearest unmatched word on the opposite side
    const oppositeHighlights = side === 'left' ? comparisonResult.rightHighlights : comparisonResult.leftHighlights
    const oppositeLength = oppositeHighlights.length
    
    // Look for the closest unmatched word
    for (let offset = 0; offset < Math.max(oppositeLength, currentIndex + 10); offset++) {
      // Check forward
      if (currentIndex + offset < oppositeLength && oppositeHighlights[currentIndex + offset]) {
        return currentIndex + offset
      }
      // Check backward
      if (currentIndex - offset >= 0 && oppositeHighlights[currentIndex - offset]) {
        return currentIndex - offset
      }
    }
    
    // If no close match found, find any unmatched word
    for (let i = 0; i < oppositeLength; i++) {
      if (oppositeHighlights[i]) {
        return i
      }
    }
    
    return null
  }

  const renderHighlightedText = (words: string[], highlights: boolean[], bgColor: string, highlightColor: string, side: 'left' | 'right') => {
    return (
      <div className="p-6 rounded-lg h-[400px] overflow-y-auto" style={{ backgroundColor: bgColor }}>
        <div className="text-base leading-relaxed font-mono whitespace-pre-wrap">
          {words.map((word, index) => (
            <span
              key={index}
              className={`px-0.5 py-0.5 rounded transition-colors ${highlights[index] ? 'cursor-pointer hover:opacity-80' : ''}`}
              style={{
                backgroundColor: highlights[index] ? highlightColor : 'transparent'
              }}
              onClick={(e) => handleWordClick(side, index, e)}
            >
              {word}
            </span>
          ))}
        </div>
      </div>
    )
  }

  const renderSentenceHighlightedText = (sentences: string[], highlights: boolean[], bgColor: string, highlightColor: string, side: 'left' | 'right') => {
    return (
      <div className="p-6 rounded-lg h-[400px] overflow-y-auto" style={{ backgroundColor: bgColor }}>
        <div className="text-base leading-relaxed">
          {sentences.map((sentence, index) => (
            <span
              key={index}
              className={`px-1 py-1 rounded transition-colors block mb-2 ${highlights[index] ? 'cursor-pointer hover:opacity-80' : ''}`}
              style={{
                backgroundColor: highlights[index] ? highlightColor : 'transparent'
              }}
              onClick={(e) => handleSentenceClick(side, index, e)}
            >
              {sentence}
            </span>
          ))}
        </div>
      </div>
    )
  }

  const hasSentenceDifferences = false // Always use word-level sequential semantic diff

  return (
    <>
      {/* SEO Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      <div className="min-h-screen">
        <Navigation />
        
        {/* Hero Section - Only show when no comparison */}
        {!comparisonResult && <HeroSection />}
        
        {/* Main Content */}
        <div className="bg-gray-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {!comparisonResult ? (
              /* Input Stage - After Hero */
              <div>
                <div className="grid md:grid-cols-2 gap-8">
                <Card className="shadow-lg border-0">
                  <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50">
                    <CardTitle className="flex items-center justify-between text-red-700">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Original Text
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(leftText, 'left')}
                        className="h-8 w-8 p-0 hover:bg-red-100"
                        disabled={!leftText.trim()}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <Textarea
                      placeholder="Enter the original text here..."
                      value={leftText}
                      onChange={(e) => setLeftText(e.target.value)}
                      className="h-[300px] resize-none border-gray-200 focus:border-red-500 overflow-y-auto whitespace-pre-wrap"
                    />
                  </CardContent>
                </Card>

                <Card className="shadow-lg border-0">
                  <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                    <CardTitle className="flex items-center justify-between text-green-700">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        New Text
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(rightText, 'right')}
                        className="h-8 w-8 p-0 hover:bg-green-100"
                        disabled={!rightText.trim()}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <Textarea
                      placeholder="Enter the new text here..."
                      value={rightText}
                      onChange={(e) => setRightText(e.target.value)}
                      className="h-[300px] resize-none border-gray-200 focus:border-green-500 overflow-y-auto whitespace-pre-wrap"
                    />
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-center gap-4 mt-8">
                <Button
                  onClick={compareTexts}
                  disabled={!leftText.trim() || !rightText.trim() || isComparing}
                  className="px-8 py-3 bg-black hover:bg-gray-800 text-white text-lg"
                >
                  {isComparing ? (
                    <>
                      <RotateCcw className="w-5 h-5 mr-2 animate-spin" />
                      Comparing...
                    </>
                  ) : (
                    <>
                      <ArrowLeftRight className="w-5 h-5 mr-2" />
                      Compare
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={clearAll} className="px-8 py-3 text-lg">
                  Clear
                </Button>
              </div>
            </div>
          ) : (
            /* Results Stage */
            <div>
              {/* Results Header */}
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Comparison Results</h2>
                <p className="text-xl text-gray-600">Semantic analysis complete</p>
              </div>

              {/* Statistics Bar */}
              <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-6">
                    <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100 px-4 py-2">
                      {comparisonResult.removals} removals
                    </Badge>
                    <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100 px-4 py-2">
                      {comparisonResult.additions} additions
                    </Badge>
                    {semanticSimilarity !== null && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-100 px-4 py-2">
                        {Math.round(semanticSimilarity * 100)}% similarity
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" onClick={clearAll}>
                      Clear
                    </Button>
                    <Button variant="outline" size="sm">
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                    <Button variant="outline" size="sm">
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                    <Button variant="outline" size="sm">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Explain
                    </Button>
                  </div>
                </div>
              </div>

              {/* Comparison View */}
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-700 flex items-center">
                      <FileText className="w-5 h-5 mr-2 text-red-600" />
                      Original
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyResultToClipboard('left')}
                      className="h-8 w-8 p-0 hover:bg-red-100"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  {renderHighlightedText(
                    comparisonResult.leftText,
                    comparisonResult.leftHighlights,
                    '#FDEBEB',
                    '#F29E9F',
                    'left'
                  )}
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-700 flex items-center">
                      <FileText className="w-5 h-5 mr-2 text-green-600" />
                      New
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyResultToClipboard('right')}
                      className="h-8 w-8 p-0 hover:bg-green-100"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  {renderHighlightedText(
                    comparisonResult.rightText,
                    comparisonResult.rightHighlights,
                    '#D7EBE7',
                    '#81DBBF',
                    'right'
                  )}
                </div>
              </div>

              {/* Chunk-Based Diff Indicator */}
              {comparisonResult && (
                <div className="flex justify-center mb-8">
                  <div className="bg-white rounded-lg shadow-md px-6 py-3">
                    <div className="flex items-center space-x-2">
                      <Zap className="w-5 h-5 text-blue-600" />
                      <span className="text-gray-700">Showing Chunk-Based Semantic Differences</span>
                      <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                        PRO
                      </Badge>
                    </div>
                  </div>
                </div>
              )}

              {/* Merge Button */}
              <div className="flex justify-center">
                <Button className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-lg">
                  <Crown className="w-5 h-5 mr-2" />
                  Merge Changes
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Merge Popup */}
      <MergePopup
        isOpen={mergePopup.isOpen}
        onClose={() => setMergePopup(prev => ({ ...prev, isOpen: false }))}
        onMerge={performMerge}
        side={mergePopup.side || 'left'}
        selectedWord={mergePopup.selectedWord}
        targetWord={mergePopup.targetWord}
        selectedSentence={mergePopup.selectedSentence}
        targetSentence={mergePopup.targetSentence}
        isSentenceMerge={mergePopup.isSentenceMerge}
        position={mergePopup.position}
      />
      
      <Footer />
    </div>
    </>
  )
}