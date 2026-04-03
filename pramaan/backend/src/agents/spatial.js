import { analyzeImage } from '../lib/groq.js';
import { runOCR } from '../tools/ocr.js';
import { reverseGeocode } from '../tools/geoLookup.js';

export async function spatialAgent(primaryFrame, provenanceResult) {
  try {
    const [visionResult, ocrResult] = await Promise.all([
      analyzeImage(primaryFrame, `Identify the geographic location and environmental context from this image.
Look for: landmarks, signboards, building styles, vehicles (license plate regions), road markings, vegetation, sky conditions, cultural markers.
Return JSON with exactly these fields:
{
  "estimated_location": "city/area name or 'Unknown'",
  "country": "country name or 'Unknown'",
  "region_type": "urban" | "rural" | "industrial" | "natural" | "unknown",
  "signals": ["list of specific visual cues observed"],
  "environment": "brief description of the scene environment",
  "time_of_day": "day" | "night" | "dawn" | "dusk" | "unknown",
  "weather": "clear" | "rainy" | "foggy" | "cloudy" | "unknown",
  "confidence": "low" | "medium" | "high"
}`),
      runOCR(primaryFrame),
    ]);

    const vision = visionResult || {
      estimated_location: 'Unknown',
      country: 'Unknown',
      region_type: 'unknown',
      signals: ['Spatial analysis unavailable'],
      environment: 'Unknown',
      time_of_day: 'unknown',
      weather: 'unknown',
      confidence: 'low',
    };

    // Append OCR text to signals if meaningful
    const signals = [...(vision.signals || [])];
    if (ocrResult.hasText) {
      signals.push(`OCR text detected: "${ocrResult.text.substring(0, 200)}"`);
      if (ocrResult.words.length > 0) {
        signals.push(`Readable words: ${ocrResult.words.slice(0, 10).join(', ')}`);
      }
    }

    // Override with GPS geocoding if available from provenance
    let geocoded = null;
    const gps = provenanceResult?.metadata?.gps;
    if (gps?.lat && gps?.lng) {
      geocoded = await reverseGeocode(gps.lat, gps.lng);
    }

    const finalLocation = geocoded
      ? `${geocoded.city || geocoded.suburb || ''}, ${geocoded.state || ''}, ${geocoded.country || ''}`.replace(/^,\s*|,\s*$/g, '').trim()
      : vision.estimated_location;

    return {
      estimated_location: finalLocation,
      country: geocoded?.country || vision.country,
      region_type: vision.region_type,
      signals,
      environment: vision.environment,
      time_of_day: vision.time_of_day,
      weather: vision.weather,
      confidence: geocoded ? 'high' : vision.confidence,
      geocoded,
      ocr: {
        text: ocrResult.text,
        words: ocrResult.words,
        hasText: ocrResult.hasText,
      },
    };
  } catch (err) {
    console.error('[spatialAgent] Error:', err.message);
    return {
      estimated_location: 'Unknown',
      country: 'Unknown',
      region_type: 'unknown',
      signals: ['Spatial analysis failed: ' + err.message],
      environment: 'Unknown',
      time_of_day: 'unknown',
      weather: 'unknown',
      confidence: 'low',
      geocoded: null,
      ocr: { text: '', words: [], hasText: false },
    };
  }
}
