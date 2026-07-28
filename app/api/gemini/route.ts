import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize the Gemini API if the key exists
const genAI = process.env.GEMINI_API_KEY 
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) 
  : null

export async function POST(request: Request) {
  if (!genAI) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY is not configured in the environment.' }, 
      { status: 500 }
    )
  }

  try {
    const body = await request.json()
    const { action, data } = body

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    if (action === 'categorize') {
      const { description } = data
      
      const prompt = `
        You are a safety classification assistant. 
        Analyze the following incident description and determine the most appropriate category and severity (1 to 5, where 5 is highest danger).
        Categories: harassment, poor_lighting, isolated_area, stalking, unsafe_transport, other
        
        Description: "${description}"
        
        Respond with ONLY a valid JSON object matching this schema, no markdown blocks, no backticks:
        { "category": "...", "severity": number }
      `
      
      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text().trim().replace(/```json/g, '').replace(/```/g, '')
      
      try {
        const json = JSON.parse(text)
        return NextResponse.json(json)
      } catch (parseError) {
        console.error("Gemini output not valid JSON:", text)
        return NextResponse.json({ error: 'Failed to parse Gemini output' }, { status: 500 })
      }
    } 
    
    else if (action === 'summarize') {
      const { reportsCount, categories, severities } = data
      
      const prompt = `
        You are a safety assistant providing a quick summary of a specific geographic area based on recent reports.
        
        Data for this area:
        - Total Reports: ${reportsCount}
        - Categories seen: ${categories.join(', ')}
        - Severities seen: ${severities.join(', ')} (1 is low, 5 is high)
        
        Write a concise, 1-2 sentence plain-English summary of the safety profile of this area. 
        Tone should be empathetic, objective, and clear. Do not use filler intro phrases.
      `
      
      const result = await model.generateContent(prompt)
      const response = await result.response
      
      return NextResponse.json({ summary: response.text().trim() })
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    
  } catch (error: any) {
    console.error('Gemini API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
