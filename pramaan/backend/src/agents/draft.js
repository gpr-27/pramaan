import { chatGroq } from '../lib/groq.js';

export async function draftGenerator(provenance, spatial, retrieval, risk) {
  try {
    const systemPrompt = `You are a senior editorial assistant in a digital newsroom. Your role is to produce a structured, evidence-constrained civic news brief.

STRICT RULES:
1. Tag every factual claim with its source: [Provenance], [Spatial], or [Retrieval]
2. Use hedged language for unverified claims: "appears to show", "reportedly", "visual evidence suggests"
3. Never assert facts that are not grounded in the provided evidence
4. If risk level is HIGH, begin with: "⚠️ WARNING: This media has elevated authenticity concerns."
5. Maximum 150 words
6. Structure: Lead sentence → Location context → Event description → Verification notes
7. End with: "Editorial status: [verification status based on risk level]"`;

    const userPrompt = `Generate a news brief based on the following verified evidence:

PROVENANCE EVIDENCE:
- Synthetic probability: ${Math.round((provenance.synthetic_probability || 0) * 100)}%
- Reuse detected: ${provenance.reuse_detected ? 'Yes' : 'No'}
- Manipulation signs: ${(provenance.manipulation_signs || []).slice(0, 3).join('; ')}
- Device: ${provenance.metadata?.device || 'Unknown'}
- Timestamp: ${provenance.metadata?.timestamp || 'Unknown'}
- Metadata anomalies: ${(provenance.metadata?.anomalies || []).join('; ') || 'None'}

SPATIAL EVIDENCE:
- Estimated location: ${spatial.estimated_location}
- Country: ${spatial.country}
- Environment: ${spatial.environment}
- Visual signals: ${(spatial.signals || []).slice(0, 4).join('; ')}
- Time of day: ${spatial.time_of_day}
- Weather: ${spatial.weather}
- OCR text found: ${spatial.ocr?.hasText ? `"${spatial.ocr.text?.substring(0, 100)}"` : 'None'}

RETRIEVAL EVIDENCE:
- Event type: ${retrieval.event_type}
- Event description: ${retrieval.event_description}
- Keywords: ${(retrieval.keywords || []).join(', ')}
- Context analysis: ${retrieval.context_analysis}
- Corroborating articles: ${retrieval.relevant_articles?.length || 0} found

RISK ASSESSMENT:
- Level: ${risk.level}
- Key flags: ${(risk.flags || []).slice(0, 3).map(f => f.flag).join('; ')}
- Recommendation: ${risk.publish_recommendation}`;

    const draft = await chatGroq(systemPrompt, userPrompt);

    // Extract civic action items
    const civicSystemPrompt = `You are a civic affairs coordinator. Based on the news brief and evidence, generate a structured civic action summary for forwarding to local authorities or officials.`;

    const civicPrompt = `Based on this evidence:
Event type: ${retrieval.event_type}
Location: ${spatial.estimated_location}, ${spatial.country}
Description: ${retrieval.event_description}
Risk: ${risk.level}

Generate a civic action summary as JSON:
{
  "action_required": true or false,
  "urgency": "immediate" | "within_24h" | "routine",
  "departments": ["list of relevant authorities"],
  "summary": "2-3 sentence civic action brief",
  "suggested_actions": ["list of 2-4 concrete actions"]
}`;

    let civicAction = {
      action_required: false,
      urgency: 'routine',
      departments: [],
      summary: 'No immediate civic action identified.',
      suggested_actions: [],
    };

    try {
      const civicRaw = await chatGroq(
        civicSystemPrompt,
        civicPrompt + '\n\nReturn only valid JSON.'
      );
      const jsonMatch = civicRaw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        civicAction = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      // Fallback civic action is fine
    }

    return {
      draft: draft || 'Draft generation failed — evidence insufficient for narrative construction.',
      civic_action: civicAction,
      confidence: draft ? 'high' : 'low',
    };
  } catch (err) {
    console.error('[draftGenerator] Error:', err.message);
    return {
      draft: 'Draft generation failed: ' + err.message,
      civic_action: {
        action_required: false,
        urgency: 'routine',
        departments: [],
        summary: 'Unable to generate civic action summary.',
        suggested_actions: [],
      },
      confidence: 'low',
    };
  }
}
