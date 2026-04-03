import { provenanceAgent } from './provenance.js';
import { spatialAgent } from './spatial.js';
import { retrievalAgent } from './retrieval.js';
import { riskAnalyzer } from './risk.js';
import { draftGenerator } from './draft.js';

/**
 * Runs the full multi-agent pipeline and streams progress via SSE emit function.
 * @param {string[]} frames - Array of extracted frame paths
 * @param {string} originalFilePath - Path to the original uploaded file
 * @param {Function} emit - SSE emit function: (agent, state, result?) => void
 * @returns {Object} Full pipeline results
 */
export async function runPipeline(frames, originalFilePath, emit) {
  const primaryFrame = frames[0];

  // Stage 1: Provenance
  emit('provenance', 'running');
  emit('spatial', 'running');
  emit('retrieval', 'running');

  // Run 3 agents in parallel — provenance first since spatial needs its GPS output
  const provenancePromise = provenanceAgent(primaryFrame, originalFilePath);

  // Spatial and retrieval can start immediately
  const retrievalPromise = retrievalAgent(primaryFrame);

  // Wait for provenance to get GPS for spatial
  const provenance = await provenancePromise;
  emit('provenance', 'done', provenance);

  const [spatial, retrieval] = await Promise.all([
    spatialAgent(primaryFrame, provenance).then(result => {
      emit('spatial', 'done', result);
      return result;
    }),
    retrievalPromise.then(result => {
      emit('retrieval', 'done', result);
      return result;
    }),
  ]);

  // Stage 2: Risk analysis (pure logic, fast)
  emit('risk', 'running');
  const risk = riskAnalyzer(provenance, spatial, retrieval);
  emit('risk', 'done', risk);

  // Stage 3: Draft generation
  emit('draft', 'running');
  const draftResult = await draftGenerator(provenance, spatial, retrieval, risk);
  emit('draft', 'done', draftResult);

  return {
    provenance,
    spatial,
    retrieval,
    risk,
    draft: draftResult.draft,
    civic_action: draftResult.civic_action,
  };
}
