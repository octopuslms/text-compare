import { NextRequest, NextResponse } from 'next/server'

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
  chunks: SemanticChunk[]
}

function tokenizeText(text: string): string[] {
  // Better tokenization that preserves whitespace and indentation
  const tokens: string[] = []
  let currentToken = ''
  let inWhitespace = false
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    
    if (/\s/.test(char)) {
      // It's whitespace
      if (!inWhitespace) {
        // Start of whitespace sequence
        if (currentToken.length > 0) {
          tokens.push(currentToken)
          currentToken = ''
        }
        inWhitespace = true
        currentToken = char
      } else {
        // Continue whitespace sequence
        currentToken += char
      }
    } else {
      // It's a non-whitespace character
      if (inWhitespace) {
        // End of whitespace sequence
        tokens.push(currentToken)
        currentToken = char
        inWhitespace = false
      } else {
        // Continue non-whitespace sequence
        currentToken += char
      }
    }
  }
  
  // Add the last token if there is one
  if (currentToken.length > 0) {
    tokens.push(currentToken)
  }
  
  return tokens.filter(token => token.length > 0)
}

function tokenizePreservingStructure(text: string): { tokens: string[], originalText: string } {
  // This function preserves the exact structure including newlines and indentation
  const tokens: string[] = []
  const lines = text.split('\n')
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    if (i > 0) {
      // Add newline as a separate token
      tokens.push('\n')
    }
    
    if (line.length > 0) {
      // Tokenize the line preserving indentation
      const lineTokens = tokenizeLineWithIndentation(line)
      tokens.push(...lineTokens)
    }
  }
  
  return {
    tokens,
    originalText: text
  }
}

function tokenizeLineWithIndentation(line: string): string[] {
  const tokens: string[] = []
  let currentToken = ''
  let i = 0
  
  // Handle indentation at the beginning
  while (i < line.length && /\s/.test(line[i])) {
    currentToken += line[i]
    i++
  }
  
  if (currentToken.length > 0) {
    tokens.push(currentToken)
    currentToken = ''
  }
  
  // Handle the rest of the line
  while (i < line.length) {
    const char = line[i]
    
    if (/\s/.test(char)) {
      // Whitespace in the middle of content
      if (currentToken.length > 0) {
        tokens.push(currentToken)
        currentToken = ''
      }
      currentToken = char
    } else {
      // Non-whitespace character
      if (currentToken.length > 0 && /\s/.test(currentToken[currentToken.length - 1])) {
        tokens.push(currentToken)
        currentToken = char
      } else {
        currentToken += char
      }
    }
    i++
  }
  
  if (currentToken.length > 0) {
    tokens.push(currentToken)
  }
  
  return tokens.length > 0 ? tokens : ['']
}

function tokenizeSentences(text: string): string[] {
  // Split by sentence-ending punctuation followed by whitespace and capital letter or end of string
  const sentences = text.split(/(?<=[.!?])\s+(?=[A-Z]|$)/).filter(s => s.trim().length > 0)
  return sentences.map(s => s.trim())
}

function mapSentencesToWords(sentences: string[], words: string[]): { left: number[], right: number[] }[] {
  const mappings: { left: number[], right: number[] }[] = []
  let currentWordIndex = 0
  
  for (const sentence of sentences) {
    const sentenceWords = sentence.split(/\s+/).filter(w => w.length > 0)
    const wordIndices: number[] = []
    
    // Find the starting position of this sentence in the words array
    let found = false
    for (let i = currentWordIndex; i <= words.length - sentenceWords.length; i++) {
      let match = true
      for (let j = 0; j < sentenceWords.length; j++) {
        if (words[i + j].toLowerCase() !== sentenceWords[j].toLowerCase()) {
          match = false
          break
        }
      }
      if (match) {
        for (let j = 0; j < sentenceWords.length; j++) {
          wordIndices.push(i + j)
        }
        currentWordIndex = i + sentenceWords.length
        found = true
        break
      }
    }
    
    if (!found) {
      // Fallback: just use consecutive words
      for (let i = 0; i < sentenceWords.length && currentWordIndex < words.length; i++) {
        wordIndices.push(currentWordIndex++)
      }
    }
    
    mappings.push({ left: wordIndices, right: [] }) // Will be filled in later
  }
  
  return mappings
}

function computeLCS(words1: string[], words2: string[]): number[][] {
  const m = words1.length
  const n = words2.length
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0))

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (words1[i - 1].toLowerCase() === words2[j - 1].toLowerCase()) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }

  return dp
}

function computeSentenceLCS(sentences1: string[], sentences2: string[]): number[][] {
  const m = sentences1.length
  const n = sentences2.length
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0))

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      // Use word-level LCS within sentences for more granular comparison
      const words1 = sentences1[i - 1].toLowerCase().split(/\s+/)
      const words2 = sentences2[j - 1].toLowerCase().split(/\s+/)
      const wordSimilarity = calculateSentenceWordSimilarity(words1, words2)
      
      if (wordSimilarity > 0.3) { // Lower threshold for partial matches
        dp[i][j] = dp[i - 1][j - 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }

  return dp
}

function calculateSentenceWordSimilarity(words1: string[], words2: string[]): number {
  const set1 = new Set(words1)
  const set2 = new Set(words2)
  const intersection = new Set([...set1].filter(x => set2.has(x)))
  const union = new Set([...set1, ...set2])
  return union.size > 0 ? intersection.size / union.size : 0
}

function sentenceSimilarity(s1: string, s2: string): number {
  const words1 = s1.toLowerCase().split(/\s+/)
  const words2 = s2.toLowerCase().split(/\s+/)
  const set1 = new Set(words1)
  const set2 = new Set(words2)
  const intersection = new Set([...set1].filter(x => set2.has(x)))
  const union = new Set([...set1, ...set2])
  return union.size > 0 ? intersection.size / union.size : 0
}

function backtrackLCS(dp: number[][], words1: string[], words2: string[]): { left: boolean[], right: boolean[] } {
  const m = words1.length
  const n = words2.length
  const leftHighlights: boolean[] = Array(m).fill(false)
  const rightHighlights: boolean[] = Array(n).fill(false)

  let i = m, j = n
  while (i > 0 && j > 0) {
    if (words1[i - 1].toLowerCase() === words2[j - 1].toLowerCase()) {
      leftHighlights[i - 1] = false
      rightHighlights[j - 1] = false
      i--
      j--
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      leftHighlights[i - 1] = true
      i--
    } else {
      rightHighlights[j - 1] = true
      j--
    }
  }

  while (i > 0) {
    leftHighlights[i - 1] = true
    i--
  }

  while (j > 0) {
    rightHighlights[j - 1] = true
    j--
  }

  return { left: leftHighlights, right: rightHighlights }
}

function computeSequentialSemanticDiff(words1: string[], words2: string[]): { leftHighlights: boolean[], rightHighlights: boolean[], chunks: SemanticChunk[] } {
  const m = words1.length
  const n = words2.length
  const leftHighlights: boolean[] = Array(m).fill(false)
  const rightHighlights: boolean[] = Array(n).fill(false)
  const chunks: SemanticChunk[] = []
  
  // First, identify semantic chunks
  const leftChunks = identifySemanticChunks(words1)
  const rightChunks = identifySemanticChunks(words2)
  
  // Compare chunks semantically
  const chunkComparison = compareSemanticChunks(leftChunks, rightChunks)
  
  // Process chunk comparisons to create highlights
  for (const comparison of chunkComparison) {
    if (comparison.type === 'semantic_diff') {
      // Highlight all words in the differing chunks
      for (let i = comparison.leftStart; i <= comparison.leftEnd; i++) {
        if (i < leftHighlights.length) leftHighlights[i] = true
      }
      for (let i = comparison.rightStart; i <= comparison.rightEnd; i++) {
        if (i < rightHighlights.length) rightHighlights[i] = true
      }
      
      chunks.push({
        leftStart: comparison.leftStart,
        leftEnd: comparison.leftEnd,
        rightStart: comparison.rightStart,
        rightEnd: comparison.rightEnd,
        leftText: words1.slice(comparison.leftStart, comparison.leftEnd + 1),
        rightText: words2.slice(comparison.rightStart, comparison.rightEnd + 1),
        type: 'semantic_diff'
      })
    }
  }
  
  return { leftHighlights, rightHighlights, chunks }
}

interface SemanticChunk {
  leftStart: number
  leftEnd: number
  rightStart: number
  rightEnd: number
  leftText: string[]
  rightText: string[]
  type: 'semantic_diff' | 'identical'
}

interface ChunkComparison {
  leftStart: number
  leftEnd: number
  rightStart: number
  rightEnd: number
  type: 'semantic_diff' | 'identical'
  similarity: number
}

function identifySemanticChunks(words: string[]): { start: number, end: number, text: string[], type: string }[] {
  const chunks = []
  let i = 0
  
  while (i < words.length) {
    let chunkSize = 1
    
    // Determine chunk type and size
    const word = words[i].toLowerCase()
    
    // Check for common semantic patterns
    if (isVerb(word) || isAdjective(word)) {
      // Verbs and adjectives often form 2-3 word chunks
      chunkSize = Math.min(3, words.length - i)
    } else if (isNoun(word)) {
      // Nouns can be 1-2 words
      chunkSize = Math.min(2, words.length - i)
    } else if (isPreposition(word) || isArticle(word)) {
      // Prepositions and articles are part of larger chunks
      chunkSize = Math.min(4, words.length - i)
    }
    
    // Find the optimal chunk size based on semantic coherence
    let bestSize = 1
    let bestCoherence = 0
    
    for (let size = 1; size <= chunkSize; size++) {
      const chunkWords = words.slice(i, i + size)
      const coherence = calculateSemanticCoherence(chunkWords)
      
      if (coherence > bestCoherence) {
        bestCoherence = coherence
        bestSize = size
      }
    }
    
    chunks.push({
      start: i,
      end: i + bestSize - 1,
      text: words.slice(i, i + bestSize),
      type: getChunkType(words.slice(i, i + bestSize))
    })
    
    i += bestSize
  }
  
  return chunks
}

function isVerb(word: string): boolean {
  const verbs = ['continue', 'transform', 'change', 'keep', 'interact', 'communicate', 'revolutionize', 'innovate']
  return verbs.includes(word.toLowerCase()) || 
         word.toLowerCase().endsWith('ing') || 
         word.toLowerCase().endsWith('ed') ||
         word.toLowerCase().endsWith('s')
}

function isNoun(word: string): boolean {
  const nouns = ['technology', 'way', 'human', 'people', 'information', 'society', 'world', 'time', 'era']
  return nouns.includes(word.toLowerCase())
}

function isAdjective(word: string): boolean {
  const adjectives = ['modern', 'contemporary', 'essential', 'important', 'revolutionary', 'innovative', 'digital']
  return adjectives.includes(word.toLowerCase())
}

function isPreposition(word: string): boolean {
  const prepositions = ['the', 'a', 'an', 'in', 'on', 'at', 'by', 'for', 'with', 'to', 'from', 'of']
  return prepositions.includes(word.toLowerCase())
}

function isArticle(word: string): boolean {
  return ['the', 'a', 'an'].includes(word.toLowerCase())
}

function getChunkType(words: string[]): string {
  const wordTypes = words.map(w => {
    if (isVerb(w)) return 'verb'
    if (isNoun(w)) return 'noun'
    if (isAdjective(w)) return 'adjective'
    if (isPreposition(w)) return 'preposition'
    return 'other'
  })
  
  // Determine dominant type
  const typeCounts = wordTypes.reduce((acc, type) => {
    acc[type] = (acc[type] || 0) + 1
    return acc
  }, {})
  
  return Object.keys(typeCounts).reduce((a, b) => typeCounts[a] > typeCounts[b] ? a : b)
}

function calculateSemanticCoherence(words: string[]): number {
  if (words.length <= 1) return 1.0
  
  let coherence = 0
  let comparisons = 0
  
  // Check semantic relationships between consecutive words
  for (let i = 0; i < words.length - 1; i++) {
    const word1 = words[i].toLowerCase()
    const word2 = words[i + 1].toLowerCase()
    
    // High coherence for common patterns
    if (isCommonPattern(word1, word2)) {
      coherence += 1.0
    } else if (hasSemanticRelation(word1, word2)) {
      coherence += 0.7
    } else {
      coherence += 0.3
    }
    comparisons++
  }
  
  return comparisons > 0 ? coherence / comparisons : 0
}

function isCommonPattern(word1: string, word2: string): boolean {
  const patterns = [
    ['the', 'way'], ['continue', 'to'], ['transform', 'the'], 
    ['interact', 'with'], ['in', 'the'], ['with', 'information'],
    ['and', 'with'], ['each', 'other'], ['one', 'another']
  ]
  
  return patterns.some(pattern => 
    (pattern[0] === word1 && pattern[1] === word2) ||
    (pattern[0] === word2 && pattern[1] === word1)
  )
}

function hasSemanticRelation(word1: string, word2: string): boolean {
  // Check for semantic relationships
  const semanticRelations = [
    ['continue', 'transform'], ['keep', 'change'], ['modern', 'technology'],
    ['human', 'interact'], ['people', 'interact'], ['information', 'society']
  ]
  
  return semanticRelations.some(relation => 
    (relation.includes(word1) && relation.includes(word2))
  )
}

function compareSemanticChunks(leftChunks: any[], rightChunks: any[]): ChunkComparison[] {
  const comparisons: ChunkComparison[] = []
  let leftIndex = 0
  let rightIndex = 0
  
  while (leftIndex < leftChunks.length && rightIndex < rightChunks.length) {
    const leftChunk = leftChunks[leftIndex]
    const rightChunk = rightChunks[rightIndex]
    
    const similarity = calculateChunkSimilarity(leftChunk.text, rightChunk.text)
    
    if (similarity > 0.7) {
      // Chunks are semantically similar
      comparisons.push({
        leftStart: leftChunk.start,
        leftEnd: leftChunk.end,
        rightStart: rightChunk.start,
        rightEnd: rightChunk.end,
        type: 'identical',
        similarity
      })
      leftIndex++
      rightIndex++
    } else {
      // Chunks are semantically different
      comparisons.push({
        leftStart: leftChunk.start,
        leftEnd: leftChunk.end,
        rightStart: rightChunk.start,
        rightEnd: rightChunk.end,
        type: 'semantic_diff',
        similarity
      })
      leftIndex++
      rightIndex++
    }
  }
  
  // Handle remaining chunks
  while (leftIndex < leftChunks.length) {
    const leftChunk = leftChunks[leftIndex]
    comparisons.push({
      leftStart: leftChunk.start,
      leftEnd: leftChunk.end,
      rightStart: 0,
      rightEnd: -1,
      type: 'semantic_diff',
      similarity: 0
    })
    leftIndex++
  }
  
  while (rightIndex < rightChunks.length) {
    const rightChunk = rightChunks[rightIndex]
    comparisons.push({
      leftStart: 0,
      leftEnd: -1,
      rightStart: rightChunk.start,
      rightEnd: rightChunk.end,
      type: 'semantic_diff',
      similarity: 0
    })
    rightIndex++
  }
  
  return comparisons
}

function calculateChunkSimilarity(leftWords: string[], rightWords: string[]): number {
  // Calculate semantic similarity between chunks
  let totalSimilarity = 0
  let comparisons = 0
  
  // Word-by-word comparison with semantic understanding
  for (let i = 0; i < Math.min(leftWords.length, rightWords.length); i++) {
    const similarity = calculateWordSimilarity(leftWords[i], rightWords[i])
    totalSimilarity += similarity
    comparisons++
  }
  
  // Account for length differences
  const lengthPenalty = Math.abs(leftWords.length - rightWords.length) / Math.max(leftWords.length, rightWords.length)
  
  const baseSimilarity = comparisons > 0 ? totalSimilarity / comparisons : 0
  return Math.max(0, baseSimilarity - lengthPenalty * 0.2)
}

function calculateWordSimilarity(word1: string, word2: string): number {
  // Exact match
  if (word1.toLowerCase() === word2.toLowerCase()) {
    return 1.0
  }
  
  // Semantic similarity dictionary
  const semanticPairs = [
    ['continue', 'keep'], ['transform', 'change'], ['modern', 'contemporary'],
    ['humans', 'people'], ['society', 'world'], ['essential', 'important'],
    ['revolutionary', 'innovative'], ['digital', 'technological'],
    ['one', 'another'], ['each', 'other'], ['the', 'a'], ['way', 'how']
  ]
  
  for (const pair of semanticPairs) {
    if (pair.includes(word1.toLowerCase()) && pair.includes(word2.toLowerCase())) {
      return 0.8
    }
  }
  
  // Edit distance for partial matches
  const editDistance = levenshteinDistance(word1.toLowerCase(), word2.toLowerCase())
  const maxLen = Math.max(word1.length, word2.length)
  return maxLen > 0 ? 1 - (editDistance / maxLen) : 0
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null))
  
  for (let i = 0; i <= str1.length; i++) {
    matrix[0][i] = i
  }
  
  for (let j = 0; j <= str2.length; j++) {
    matrix[j][0] = j
  }
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      )
    }
  }
  
  return matrix[str2.length][str1.length]
}

function backtrackSentenceLCS(dp: number[][], sentences1: string[], sentences2: string[]): { left: boolean[], right: boolean[] } {
  const m = sentences1.length
  const n = sentences2.length
  const leftHighlights: boolean[] = Array(m).fill(false)
  const rightHighlights: boolean[] = Array(n).fill(false)

  let i = m, j = n
  while (i > 0 && j > 0) {
    const words1 = sentences1[i - 1].toLowerCase().split(/\s+/)
    const words2 = sentences2[j - 1].toLowerCase().split(/\s+/)
    const wordSimilarity = calculateSentenceWordSimilarity(words1, words2)
    
    if (wordSimilarity > 0.3) {
      leftHighlights[i - 1] = false
      rightHighlights[j - 1] = false
      i--
      j--
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      leftHighlights[i - 1] = true
      i--
    } else {
      rightHighlights[j - 1] = true
      j--
    }
  }

  while (i > 0) {
    leftHighlights[i - 1] = true
    i--
  }

  while (j > 0) {
    rightHighlights[j - 1] = true
    j--
  }

  return { left: leftHighlights, right: rightHighlights }
}

export async function POST(request: NextRequest) {
  try {
    const { leftText, rightText } = await request.json()

    if (!leftText || !rightText) {
      return NextResponse.json({ error: 'Both texts are required' }, { status: 400 })
    }

    // Use improved tokenization that preserves structure
    const leftTokenization = tokenizePreservingStructure(leftText)
    const rightTokenization = tokenizePreservingStructure(rightText)
    
    const leftWords = leftTokenization.tokens
    const rightWords = rightTokenization.tokens
    const leftSentences = tokenizeSentences(leftText)
    const rightSentences = tokenizeSentences(rightText)

    // Word-level comparison using improved chunk-based semantic diff
    const { leftHighlights: leftWordHighlights, rightHighlights: rightWordHighlights, chunks } = computeSequentialSemanticDiff(leftWords, rightWords)

    // Sentence-level comparison
    const sentenceDp = computeSentenceLCS(leftSentences, rightSentences)
    const { left: leftSentenceHighlights, right: rightSentenceHighlights } = backtrackSentenceLCS(sentenceDp, leftSentences, rightSentences)

    // Create sentence mappings
    const leftSentenceMappings = mapSentencesToWords(leftSentences, leftWords)
    const rightSentenceMappings = mapSentencesToWords(rightSentences, rightWords)
    
    const sentenceMappings = leftSentenceMappings.map((leftMapping, index) => ({
      left: leftMapping.left,
      right: rightSentenceMappings[index]?.left || []
    }))

    const additions = rightWordHighlights.filter(h => h).length
    const removals = leftWordHighlights.filter(h => h).length
    
    const totalWords = Math.max(leftWords.length, rightWords.length)
    const similarity = totalWords > 0 ? (totalWords - additions - removals) / totalWords : 1

    const result: ComparisonResult = {
      leftText: leftWords,
      rightText: rightWords,
      leftHighlights: leftWordHighlights,
      rightHighlights: rightWordHighlights,
      additions,
      removals,
      similarity,
      leftSentences,
      rightSentences,
      leftSentenceHighlights,
      rightSentenceHighlights,
      sentenceMappings,
      chunks
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Comparison error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}