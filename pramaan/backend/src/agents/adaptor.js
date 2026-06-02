import { groq, resolveModel } from '../lib/groqClient.js';
import logger from '../lib/logger.js';

/**
 * Cultural Adaptation Agent
 * Translates and culturally adapts business news
 */
export async function adaptToHindi(content, context = {}, model) {
  try {
    const prompt = `You are translating business news from English to Hindi with cultural adaptation.

ENGLISH CONTENT:
"${content}"

CONTEXT:
- User type: ${context.user_type || 'general'}
- Knowledge level: ${context.knowledge_level || 'intermediate'}

TASK: Provide culturally adapted Hindi translation in JSON:
{
  "literal_translation": "Direct Hindi translation",
  "culturally_adapted": "Hindi with local context and examples",
  "key_terms_explained": {
    "EMI": "मासिक किस्त",
    "FD": "फिक्स्ड डिपॉजिट"
  },
  "local_examples": ["Using Indian context like dal prices, petrol, gold"],
  "readability_score": "easy" | "moderate" | "complex"
}

GUIDELINES FOR CULTURAL ADAPTATION:
1. Replace abstract terms with familiar Indian concepts:
   - "inflation" → "महंगाई - जैसे दाल, पेट्रोल की कीमतें बढ़ना"
   - "interest rate" → "ब्याज दर - जो आपके लोन की EMI पर असर डालती है"
   - "GDP" → "GDP (देश की कुल कमाई)"

2. Use relatable examples:
   - Instead of "bond yields", explain "FD पर मिलने वाला रिटर्न"
   - Instead of "equity markets", explain "शेयर बाजार - Nifty/Sensex"

3. Explain financial jargon in brackets:
   - "Mutual funds (म्यूचुअल फंड - एक साथ कई शेयरों में निवेश)"
   - "SEBI (भारत का stock market regulator)"

4. Keep English terms that are commonly used:
   - Stock market (not शेयर बाज़ार)
   - Investment (निवेश or investment - both okay)
   - FD, EMI, ATM (these are universal)

EXAMPLE:
English: "The RBI's repo rate hike will impact mutual fund returns through higher bond yields and corporate borrowing costs."

Literal: "आरबीआई की रेपो दर वृद्धि उच्च बांड प्रतिफल और कॉर्पोरेट उधार लागत के माध्यम से म्यूचुअल फंड रिटर्न को प्रभावित करेगी।"

Culturally Adapted: "RBI ने ब्याज दर बढ़ाई है। इसका मतलब: बैंक FD पर ज्यादा रिटर्न मिलेगा, लेकिन कंपनियों का लोन महंगा होगा। आपके mutual fund पर असर: debt funds में थोड़ा फायदा, equity funds में शॉर्ट-टर्म में गिरावट हो सकती है। सरल शब्दों में - जब RBI interest rate बढ़ाता है, तो saving accounts/FD का रिटर्न बढ़ता है, पर loan (होम लोन, कार लोन) की EMI बढ़ सकती है।"`;

    const resolvedModel = resolveModel(model);
    logger.debug(`adaptToHindi using model: ${resolvedModel}`);
    const completion = await groq.chat.completions.create({
      model: resolvedModel,
      messages: [
        {
          role: 'system',
          content: 'You are a Hindi localization expert for business news. You translate with cultural context.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.5,
      response_format: { type: 'json_object' }
    });

    const adapted = JSON.parse(completion.choices[0].message.content);

    return {
      original: content,
      ...adapted,
      language: 'hindi',
      adapted_at: new Date().toISOString()
    };

  } catch (error) {
    logger.error('Adaptation error:', error.message);

    // Fallback: Basic translation attempt
    return {
      original: content,
      literal_translation: content,
      culturally_adapted: content + ' (अनुवाद उपलब्ध नहीं)',
      key_terms_explained: {},
      local_examples: [],
      readability_score: 'moderate',
      error: 'adaptation_failed'
    };
  }
}

/**
 * Get side-by-side comparison: Google Translate vs ET Nucleus
 */
export async function getTranslationComparison(content, context, model) {
  try {
    // Get our culturally adapted version
    const etNucleus = await adaptToHindi(content, context, model);

    // Simulate Google Translate (literal translation)
    const googleTranslate = etNucleus.literal_translation;

    return {
      original_english: content,
      google_translate: {
        translation: googleTranslate,
        type: 'literal',
        explanation: 'Direct word-to-word translation'
      },
      et_nucleus: {
        translation: etNucleus.culturally_adapted,
        type: 'cultural_adaptation',
        explanation: 'Translated with local context and examples',
        key_terms: etNucleus.key_terms_explained,
        local_examples: etNucleus.local_examples
      },
      comparison_highlights: [
        'ET Nucleus explains financial terms in familiar language',
        'Uses Indian context (EMI, FD, dal prices) vs abstract concepts',
        'Keeps commonly-used English terms instead of forcing Hindi'
      ]
    };

  } catch (error) {
    logger.error('Comparison error:', error.message);

    return {
      original_english: content,
      google_translate: { translation: content, type: 'literal' },
      et_nucleus: { translation: content, type: 'cultural_adaptation' },
      error: 'comparison_failed'
    };
  }
}

/**
 * Adapt an entire personalized article to Hindi
 */
export async function adaptArticle(article, context, model) {
  try {
    const [headline, lead, takeaway] = await Promise.all([
      adaptToHindi(article.personalized_headline || article.title, context, model),
      adaptToHindi(article.personalized_lead || article.description, context, model),
      adaptToHindi(article.key_takeaway || '', context, model)
    ]);

    return {
      ...article,
      hindi: {
        headline: headline.culturally_adapted,
        lead: lead.culturally_adapted,
        takeaway: takeaway.culturally_adapted,
        key_terms: {
          ...headline.key_terms_explained,
          ...lead.key_terms_explained
        }
      },
      language: 'hindi'
    };

  } catch (error) {
    logger.error('Article adaptation error:', error.message);

    return {
      ...article,
      hindi: {
        headline: article.personalized_headline || article.title,
        lead: article.personalized_lead || article.description,
        takeaway: article.key_takeaway || ''
      },
      error: 'article_adaptation_failed'
    };
  }
}
