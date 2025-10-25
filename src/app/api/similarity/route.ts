import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export async function POST(request: NextRequest) {
  try {
    const { text1, text2 } = await request.json()

    if (!text1 || !text2) {
      return NextResponse.json({ error: 'Both texts are required' }, { status: 400 })
    }

    const zai = await ZAI.create()

    const prompt = `Please analyze the semantic similarity between these two texts and provide a numerical similarity score between 0 and 1, where 1 means identical meaning and 0 means completely different meaning.

Text 1: "${text1}"

Text 2: "${text2}"

Please respond with only a number between 0 and 1, representing the semantic similarity score. Consider:
- Overall meaning and intent
- Key concepts and topics
- Context and nuance
- Not just word overlap but actual semantic understanding

Example response: 0.85`

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a semantic analysis expert. Provide accurate similarity scores between 0 and 1.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 10
    })

    const responseText = completion.choices[0]?.message?.content?.trim()
    
    if (!responseText) {
      throw new Error('No response from AI')
    }

    const similarity = parseFloat(responseText)
    
    if (isNaN(similarity) || similarity < 0 || similarity > 1) {
      throw new Error('Invalid similarity score received')
    }

    return NextResponse.json({ similarity })
  } catch (error) {
    console.error('Semantic similarity error:', error)
    
    // Fallback to simple word-based similarity if AI fails
    const { text1, text2 } = await request.json()
    const words1 = text1.toLowerCase().split(/\s+/)
    const words2 = text2.toLowerCase().split(/\s+/)
    const set1 = new Set(words1)
    const set2 = new Set(words2)
    const intersection = new Set([...set1].filter(x => set2.has(x)))
    const union = new Set([...set1, ...set2])
    const fallbackSimilarity = union.size > 0 ? intersection.size / union.size : 1

    return NextResponse.json({ similarity: fallbackSimilarity })
  }
}