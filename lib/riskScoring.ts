export interface Report {
  latitude: number
  longitude: number
  severity: number
  category: string
  created_at: string
  description?: string
  ai_category?: string
  ai_severity?: number
}

export interface RiskCell {
  lat: number
  lng: number
  score: number
  reportCount: number
  reports: Report[]
}

export function calculateRiskCells(reports: Report[]): RiskCell[] {
  const cells = new Map<string, RiskCell>()
  const now = new Date().getTime()
  
  // 30 days in ms
  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000
  const NINETY_DAYS = 90 * 24 * 60 * 60 * 1000

  for (const report of reports) {
    // Round to 3 decimal places (~110m resolution)
    const cellLat = Math.round(report.latitude * 1000) / 1000
    const cellLng = Math.round(report.longitude * 1000) / 1000
    const key = `${cellLat},${cellLng}`

    const reportTime = new Date(report.created_at).getTime()
    const ageMs = now - reportTime
    
    // Time decay logic
    let weight = 1.0
    if (ageMs > NINETY_DAYS) {
      weight = 0.2 // Base weight for old reports
    } else if (ageMs > THIRTY_DAYS) {
      // Linear decay from 1.0 at 30 days to 0.2 at 90 days
      const decayRange = NINETY_DAYS - THIRTY_DAYS
      const agePast30 = ageMs - THIRTY_DAYS
      const decayRatio = agePast30 / decayRange
      weight = 1.0 - (0.8 * decayRatio) 
    }

    // Effective severity uses AI severity if present, otherwise manual severity
    const effectiveSeverity = report.ai_severity || report.severity
    const riskScore = effectiveSeverity * weight

    if (cells.has(key)) {
      const cell = cells.get(key)!
      cell.score += riskScore
      cell.reportCount += 1
      cell.reports.push(report)
    } else {
      cells.set(key, {
        lat: cellLat,
        lng: cellLng,
        score: riskScore,
        reportCount: 1,
        reports: [report]
      })
    }
  }

  return Array.from(cells.values())
}
