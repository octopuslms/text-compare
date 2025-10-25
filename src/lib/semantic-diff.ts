/**
 * 语义差异比较算法
 * 
 * 核心思想：
 * 1. 识别相同的文本片段
 * 2. 找到语义差异的部分
 * 3. 处理中间插入的内容
 * 4. 保持上下文的连贯性
 */

export interface SemanticDiffResult {
  leftHighlights: boolean[]
  rightHighlights: boolean[]
  semanticBlocks: SemanticBlock[]
}

export interface SemanticBlock {
  type: 'identical' | 'semantic_diff' | 'insertion' | 'deletion'
  leftStart: number
  leftEnd: number
  rightStart: number
  rightEnd: number
  leftText: string[]
  rightText: string[]
}

/**
 * 计算语义差异
 */
export function computeSemanticDiff(words1: string[], words2: string[]): SemanticDiffResult {
  const m = words1.length
  const n = words2.length
  const leftHighlights: boolean[] = Array(m).fill(false)
  const rightHighlights: boolean[] = Array(n).fill(false)
  const semanticBlocks: SemanticBlock[] = []

  // 第一步：找到所有相同的片段
  const commonSegments = findCommonSegments(words1, words2)
  
  // 第二步：基于相同片段分析语义差异
  let leftIndex = 0
  let rightIndex = 0
  
  for (const segment of commonSegments) {
    // 处理左侧差异部分
    if (segment.leftStart > leftIndex) {
      const leftDiffWords = words1.slice(leftIndex, segment.leftStart)
      const rightDiffWords = words2.slice(rightIndex, segment.rightStart)
      
      analyzeSemanticDifference(
        leftDiffWords, 
        rightDiffWords, 
        leftIndex, 
        rightIndex, 
        leftHighlights, 
        rightHighlights,
        semanticBlocks
      )
    }
    
    // 标记相同片段
    for (let i = 0; i < segment.length; i++) {
      leftHighlights[segment.leftStart + i] = false
      rightHighlights[segment.rightStart + i] = false
    }
    
    // 添加相同片段块
    semanticBlocks.push({
      type: 'identical',
      leftStart: segment.leftStart,
      leftEnd: segment.leftStart + segment.length - 1,
      rightStart: segment.rightStart,
      rightEnd: segment.rightStart + segment.length - 1,
      leftText: words1.slice(segment.leftStart, segment.leftStart + segment.length),
      rightText: words2.slice(segment.rightStart, segment.rightStart + segment.length)
    })
    
    leftIndex = segment.leftStart + segment.length
    rightIndex = segment.rightStart + segment.length
  }
  
  // 处理剩余部分
  if (leftIndex < m || rightIndex < n) {
    const leftDiffWords = words1.slice(leftIndex)
    const rightDiffWords = words2.slice(rightIndex)
    
    analyzeSemanticDifference(
      leftDiffWords, 
      rightDiffWords, 
      leftIndex, 
      rightIndex, 
      leftHighlights, 
      rightHighlights,
      semanticBlocks
    )
  }
  
  return {
    leftHighlights,
    rightHighlights,
    semanticBlocks
  }
}

/**
 * 找到所有相同的片段
 */
interface CommonSegment {
  leftStart: number
  rightStart: number
  length: number
}

function findCommonSegments(words1: string[], words2: string[]): CommonSegment[] {
  const segments: CommonSegment[] = []
  const m = words1.length
  const n = words2.length
  const minLength = 1 // 最小相同片段长度，改为1以捕获更多相同片段
  
  // 使用滑动窗口寻找相同片段
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      let matchLength = 0
      while (i + matchLength < m && 
             j + matchLength < n && 
             words1[i + matchLength].toLowerCase() === words2[j + matchLength].toLowerCase()) {
        matchLength++
      }
      
      if (matchLength >= minLength) {
        segments.push({
          leftStart: i,
          rightStart: j,
          length: matchLength
        })
      }
    }
  }
  
  // 过滤重叠的片段，保留最长的
  return filterOverlappingSegments(segments)
}

/**
 * 过滤重叠的片段
 */
function filterOverlappingSegments(segments: CommonSegment[]): CommonSegment[] {
  if (segments.length === 0) return []
  
  // 按长度排序，优先保留长的片段
  segments.sort((a, b) => b.length - a.length)
  
  const filtered: CommonSegment[] = []
  
  for (const segment of segments) {
    let hasOverlap = false
    
    for (const existing of filtered) {
      if (segmentsOverlap(segment, existing)) {
        hasOverlap = true
        break
      }
    }
    
    if (!hasOverlap) {
      filtered.push(segment)
    }
  }
  
  // 按起始位置排序
  filtered.sort((a, b) => a.leftStart - b.leftStart)
  
  return filtered
}

/**
 * 检查两个片段是否重叠
 */
function segmentsOverlap(seg1: CommonSegment, seg2: CommonSegment): boolean {
  return !(seg1.leftStart + seg1.length <= seg2.leftStart || 
           seg2.leftStart + seg2.length <= seg1.leftStart ||
           seg1.rightStart + seg1.length <= seg2.rightStart || 
           seg2.rightStart + seg2.length <= seg1.rightStart)
}

/**
 * 分析语义差异
 */
function analyzeSemanticDifference(
  leftWords: string[], 
  rightWords: string[], 
  leftOffset: number, 
  rightOffset: number,
  leftHighlights: boolean[], 
  rightHighlights: boolean[],
  semanticBlocks: SemanticBlock[]
) {
  if (leftWords.length === 0 && rightWords.length === 0) return
  
  if (leftWords.length === 0) {
    // 纯插入
    for (let i = 0; i < rightWords.length; i++) {
      rightHighlights[rightOffset + i] = true
    }
    
    semanticBlocks.push({
      type: 'insertion',
      leftStart: leftOffset,
      leftEnd: leftOffset - 1,
      rightStart: rightOffset,
      rightEnd: rightOffset + rightWords.length - 1,
      leftText: [],
      rightText: rightWords
    })
  } else if (rightWords.length === 0) {
    // 纯删除
    for (let i = 0; i < leftWords.length; i++) {
      leftHighlights[leftOffset + i] = true
    }
    
    semanticBlocks.push({
      type: 'deletion',
      leftStart: leftOffset,
      leftEnd: leftOffset + leftWords.length - 1,
      rightStart: rightOffset,
      rightEnd: rightOffset - 1,
      leftText: leftWords,
      rightText: []
    })
  } else {
    // 语义差异 - 使用更智能的比较
    const semanticMapping = findSemanticMapping(leftWords, rightWords)
    
    for (const mapping of semanticMapping) {
      if (mapping.type === 'match') {
        // 语义匹配的词不高亮
        leftHighlights[leftOffset + mapping.leftIndex] = false
        rightHighlights[rightOffset + mapping.rightIndex] = false
      } else {
        // 语义差异的词高亮
        leftHighlights[leftOffset + mapping.leftIndex] = true
        rightHighlights[rightOffset + mapping.rightIndex] = true
      }
    }
    
    semanticBlocks.push({
      type: 'semantic_diff',
      leftStart: leftOffset,
      leftEnd: leftOffset + leftWords.length - 1,
      rightStart: rightOffset,
      rightEnd: rightOffset + rightWords.length - 1,
      leftText: leftWords,
      rightText: rightWords
    })
  }
}

/**
 * 找到语义映射
 */
interface SemanticMapping {
  leftIndex: number
  rightIndex: number
  type: 'match' | 'diff'
  similarity: number
}

function findSemanticMapping(leftWords: string[], rightWords: string[]): SemanticMapping[] {
  const mappings: SemanticMapping[] = []
  
  // 使用更智能的映射策略
  const leftUsed = new Set<number>()
  const rightUsed = new Set<number>()
  
  // 首先找到精确匹配
  for (let i = 0; i < leftWords.length; i++) {
    for (let j = 0; j < rightWords.length; j++) {
      if (!leftUsed.has(i) && !rightUsed.has(j)) {
        const similarity = calculateWordSimilarity(leftWords[i], rightWords[j])
        if (similarity > 0.8) {
          mappings.push({
            leftIndex: i,
            rightIndex: j,
            type: 'match',
            similarity
          })
          leftUsed.add(i)
          rightUsed.add(j)
          break
        }
      }
    }
  }
  
  // 处理剩余的词
  const remainingLeft = Array.from({ length: leftWords.length }, (_, i) => i)
    .filter(i => !leftUsed.has(i))
  const remainingRight = Array.from({ length: rightWords.length }, (_, i) => i)
    .filter(i => !rightUsed.has(i))
  
  // 为剩余的词创建映射
  const maxRemaining = Math.max(remainingLeft.length, remainingRight.length)
  for (let i = 0; i < maxRemaining; i++) {
    const leftIdx = remainingLeft[i]
    const rightIdx = remainingRight[i]
    
    if (leftIdx !== undefined && rightIdx !== undefined) {
      const similarity = calculateWordSimilarity(leftWords[leftIdx], rightWords[rightIdx])
      mappings.push({
        leftIndex: leftIdx,
        rightIndex: rightIdx,
        type: similarity > 0.5 ? 'match' : 'diff',
        similarity
      })
    } else if (leftIdx !== undefined) {
      mappings.push({
        leftIndex: leftIdx,
        rightIndex: 0,
        type: 'diff',
        similarity: 0
      })
    } else if (rightIdx !== undefined) {
      mappings.push({
        leftIndex: 0,
        rightIndex: rightIdx,
        type: 'diff',
        similarity: 0
      })
    }
  }
  
  // 按左索引排序
  return mappings.sort((a, b) => a.leftIndex - b.leftIndex)
}

/**
 * 计算词语相似度
 */
function calculateWordSimilarity(word1: string, word2: string): number {
  // 精确匹配
  if (word1.toLowerCase() === word2.toLowerCase()) {
    return 1.0
  }
  
  // 语义相似的词对（扩展词典）
  const semanticPairs: [string, string][] = [
    // 动词变化
    ['transform', 'change'],
    ['transform', 'changing'],
    ['continues', 'keeps'],
    ['continue', 'keep'],
    ['transforming', 'changing'],
    ['transform', 'revolutionize'],
    ['change', 'revolutionize'],
    
    // 形容词变化
    ['modern', 'contemporary'],
    ['modern', 'current'],
    ['contemporary', 'current'],
    ['essential', 'important'],
    ['essential', 'crucial'],
    ['important', 'crucial'],
    ['revolutionary', 'innovative'],
    ['revolutionary', 'groundbreaking'],
    ['innovative', 'groundbreaking'],
    ['digital', 'technological'],
    ['digital', 'electronic'],
    ['technological', 'electronic'],
    
    // 名词变化
    ['humans', 'people'],
    ['humans', 'individuals'],
    ['people', 'individuals'],
    ['interact', 'communicate'],
    ['interaction', 'communication'],
    ['interact', 'engage'],
    ['communicate', 'engage'],
    ['society', 'world'],
    ['society', 'community'],
    ['world', 'community'],
    ['era', 'age'],
    ['era', 'period'],
    ['age', 'period'],
    ['time', 'era'],
    ['time', 'age'],
    ['time', 'period'],
    
    // 代词和介词
    ['one', 'another'],
    ['each', 'other'],
    ['another', 'other'],
    
    // 连接词
    ['the', 'a'],
    ['the', 'an'],
    ['a', 'an']
  ]
  
  // 检查语义相似性
  for (const pair of semanticPairs) {
    if ((pair.includes(word1.toLowerCase()) && pair.includes(word2.toLowerCase()))) {
      return 0.85 // 语义相似度较高
    }
  }
  
  // 检查词根相似性
  if (hasSameRoot(word1, word2)) {
    return 0.75
  }
  
  // 编辑距离相似度
  const editDistance = levenshteinDistance(word1.toLowerCase(), word2.toLowerCase())
  const maxLen = Math.max(word1.length, word2.length)
  const editSimilarity = maxLen > 0 ? 1 - (editDistance / maxLen) : 0
  
  // 如果编辑距离相似度较高，给予一定分数
  if (editSimilarity > 0.7) {
    return editSimilarity * 0.6
  }
  
  return 0
}

/**
 * 检查两个词是否有相同的词根
 */
function hasSameRoot(word1: string, word2: string): boolean {
  const w1 = word1.toLowerCase()
  const w2 = word2.toLowerCase()
  
  // 常见词根
  const roots = [
    'techn', 'communic', 'interact', 'transform', 'change',
    'inform', 'soci', 'commun', 'digit', 'innov', 'revolut'
  ]
  
  for (const root of roots) {
    if (w1.includes(root) && w2.includes(root)) {
      return true
    }
  }
  
  return false
}

/**
 * 计算编辑距离
 */
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

/**
 * 获取语义差异解释
 */
export function getSemanticDiffExplanation(blocks: SemanticBlock[]): string[] {
  const explanations: string[] = []
  
  for (const block of blocks) {
    switch (block.type) {
      case 'identical':
        // 相同部分不需要解释
        break
      case 'semantic_diff':
        const leftText = block.leftText.join(' ')
        const rightText = block.rightText.join(' ')
        
        // 分析具体的语义变化
        const changeType = analyzeChangeType(block.leftText, block.rightText)
        
        switch (changeType) {
          case 'verb_change':
            explanations.push(`动词变化: "${leftText}" → "${rightText}"`)
            break
          case 'noun_change':
            explanations.push(`名词替换: "${leftText}" → "${rightText}"`)
            break
          case 'structure_change':
            explanations.push(`结构重组: "${leftText}" → "${rightText}"`)
            break
          case 'semantic_equivalent':
            explanations.push(`语义等价: "${leftText}" → "${rightText}"`)
            break
          default:
            explanations.push(`语义差异: "${leftText}" → "${rightText}"`)
        }
        break
      case 'insertion':
        explanations.push(`新增内容: "${block.rightText.join(' ')}"`)
        break
      case 'deletion':
        explanations.push(`删除内容: "${block.leftText.join(' ')}"`)
        break
    }
  }
  
  return explanations
}

/**
 * 分析变化类型
 */
function analyzeChangeType(leftWords: string[], rightWords: string[]): string {
  const leftText = leftWords.join(' ')
  const rightText = rightWords.join(' ')
  
  // 检查是否主要是动词变化
  const verbPatterns = ['transform', 'change', 'continues', 'keeps', 'changing', 'transforming']
  const hasVerbChange = verbPatterns.some(verb => 
    (leftText.includes(verb) && !rightText.includes(verb)) ||
    (rightText.includes(verb) && !leftText.includes(verb))
  )
  
  // 检查是否主要是名词变化
  const nounPatterns = ['humans', 'people', 'individuals', 'society', 'world', 'community']
  const hasNounChange = nounPatterns.some(noun => 
    (leftText.includes(noun) && !rightText.includes(noun)) ||
    (rightText.includes(noun) && !leftText.includes(noun))
  )
  
  // 检查是否是结构变化
  const hasStructureChange = leftWords.length !== rightWords.length
  
  if (hasVerbChange) return 'verb_change'
  if (hasNounChange) return 'noun_change'
  if (hasStructureChange) return 'structure_change'
  
  // 检查语义相似度
  let totalSimilarity = 0
  let comparisons = 0
  
  for (let i = 0; i < Math.min(leftWords.length, rightWords.length); i++) {
    totalSimilarity += calculateWordSimilarity(leftWords[i], rightWords[i])
    comparisons++
  }
  
  const avgSimilarity = comparisons > 0 ? totalSimilarity / comparisons : 0
  if (avgSimilarity > 0.7) return 'semantic_equivalent'
  
  return 'general_change'
}