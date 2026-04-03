import { analyzeImage } from '../lib/groq.js';
import { parseMetadata } from '../tools/metadataParser.js';

export async function provenanceAgent(primaryFrame, originalFilePath) {
  try {
    const [metadata, visionResult] = await Promise.all([
      parseMetadata(originalFilePath),
      analyzeImage(primaryFrame, `Analyze this image for signs of digital manipulation, AI generation, or synthetic content.
Return JSON with exactly these fields:
{
  "reuse_detected": boolean,
  "synthetic_probability": number between 0 and 1,
  "manipulation_signs": ["list of specific observations"],
  "ai_generated_indicators": ["list of AI generation signals if any"],
  "confidence": "low" | "medium" | "high"
}
Base your assessment on: compression artifacts, lighting consistency, shadow coherence, text rendering, facial features if present, background-foreground blending, metadata consistency.`),
    ]);

    const vision = visionResult || {
      reuse_detected: false,
      synthetic_probability: 0,
      manipulation_signs: ['Vision analysis unavailable'],
      ai_generated_indicators: [],
      confidence: 'low',
    };

    // Merge metadata anomalies into manipulation signals
    const allSigns = [
      ...(vision.manipulation_signs || []),
      ...metadata.anomalies,
    ];

    return {
      reuse_detected: vision.reuse_detected || false,
      synthetic_probability: vision.synthetic_probability || 0,
      manipulation_signs: allSigns,
      ai_generated_indicators: vision.ai_generated_indicators || [],
      confidence: vision.confidence || 'low',
      metadata: {
        gps: metadata.gps,
        device: metadata.device,
        software: metadata.software,
        timestamp: metadata.timestamp,
        anomalies: metadata.anomalies,
      },
    };
  } catch (err) {
    console.error('[provenanceAgent] Error:', err.message);
    return {
      reuse_detected: false,
      synthetic_probability: 0,
      manipulation_signs: ['Provenance analysis failed: ' + err.message],
      ai_generated_indicators: [],
      confidence: 'low',
      metadata: { gps: null, device: null, software: null, timestamp: null, anomalies: [] },
    };
  }
}
