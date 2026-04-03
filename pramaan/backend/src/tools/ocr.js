import Tesseract from 'tesseract.js';

export async function runOCR(imagePath) {
  try {
    const result = await Tesseract.recognize(imagePath, 'eng+hin', {
      logger: () => {}, // suppress progress logs
    });

    const text = result.data.text.trim();
    const confidence = result.data.confidence;

    if (!text || text.length < 3) {
      return { text: '', words: [], confidence: 0, hasText: false };
    }

    const words = result.data.words
      .filter(w => w.confidence > 60 && w.text.length > 2)
      .map(w => w.text);

    return {
      text,
      words,
      confidence: Math.round(confidence),
      hasText: text.length > 5,
    };
  } catch (err) {
    console.error('[ocr] Error:', err.message);
    return { text: '', words: [], confidence: 0, hasText: false };
  }
}
