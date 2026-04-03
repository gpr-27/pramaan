export function riskAnalyzer(provenance, spatial, retrieval) {
  const flags = [];
  let score = 0;

  // HIGH risk conditions
  if (provenance.synthetic_probability > 0.6) {
    flags.push({ severity: 'HIGH', flag: `High AI/synthetic probability (${Math.round(provenance.synthetic_probability * 100)}%)` });
    score += 3;
  }
  if (provenance.reuse_detected) {
    flags.push({ severity: 'HIGH', flag: 'Potential media reuse detected — footage may not be original' });
    score += 3;
  }
  if (provenance.ai_generated_indicators?.length > 1) {
    flags.push({ severity: 'HIGH', flag: `Multiple AI generation indicators: ${provenance.ai_generated_indicators.slice(0, 2).join('; ')}` });
    score += 2;
  }

  // MEDIUM risk conditions
  const anomalyCount = provenance.metadata?.anomalies?.length || 0;
  if (anomalyCount > 1) {
    flags.push({ severity: 'MEDIUM', flag: `${anomalyCount} metadata anomalies detected` });
    score += 1.5;
  }
  if (provenance.synthetic_probability > 0.3 && provenance.synthetic_probability <= 0.6) {
    flags.push({ severity: 'MEDIUM', flag: `Moderate manipulation probability (${Math.round(provenance.synthetic_probability * 100)}%)` });
    score += 1;
  }
  if (spatial.confidence === 'low') {
    flags.push({ severity: 'MEDIUM', flag: 'Location could not be reliably determined from visual cues' });
    score += 1;
  }
  if (retrieval.context_score < 0.3 && retrieval.related_news.length > 0) {
    flags.push({ severity: 'MEDIUM', flag: 'Low news context match — event may be isolated or context is unclear' });
    score += 1;
  }
  if (!provenance.metadata?.gps) {
    flags.push({ severity: 'MEDIUM', flag: 'No GPS metadata — location cannot be independently verified' });
    score += 0.5;
  }

  // LOW / INFO conditions
  if (provenance.metadata?.software) {
    const softLower = provenance.metadata.software.toLowerCase();
    const editingTools = ['capcut', 'adobe', 'photoshop', 'snapseed', 'facetune'];
    if (editingTools.some(t => softLower.includes(t))) {
      flags.push({ severity: 'MEDIUM', flag: `Editing software detected in metadata: ${provenance.metadata.software}` });
      score += 1;
    }
  }
  if (retrieval.related_news.length === 0) {
    flags.push({ severity: 'LOW', flag: 'No corroborating news sources found' });
    score += 0.5;
  }
  if (provenance.manipulation_signs?.some(s => s.toLowerCase().includes('artifact'))) {
    flags.push({ severity: 'LOW', flag: 'Compression or processing artifacts noted' });
    score += 0.3;
  }

  // Determine level
  let level;
  let publish_recommendation;
  if (score >= 4) {
    level = 'HIGH';
    publish_recommendation = 'DO NOT PUBLISH — Requires thorough editorial verification before use.';
  } else if (score >= 2) {
    level = 'MEDIUM';
    publish_recommendation = 'CAUTION — Additional verification recommended before publication.';
  } else {
    level = 'LOW';
    publish_recommendation = 'Suitable for editorial review — standard verification protocols apply.';
  }

  return {
    level,
    score: Math.round(score * 10) / 10,
    flags,
    publish_recommendation,
    confidence: level === 'LOW' ? 'high' : level === 'MEDIUM' ? 'medium' : 'low',
  };
}
