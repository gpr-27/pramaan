import Groq from "groq-sdk";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

dotenv.config({
  path: path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../../.env",
  ),
});

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";
const TEXT_MODEL = "openai/gpt-oss-120b";

export async function analyzeImage(imagePath, prompt) {
  try {
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString("base64");
    const ext = path.extname(imagePath).toLowerCase().replace(".", "");
    const mimeType =
      ext === "jpg" || ext === "jpeg" ? "image/jpeg" : `image/${ext}`;

    const response = await groq.chat.completions.create({
      model: VISION_MODEL,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${base64Image}` },
            },
            { type: "text", text: prompt },
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 1024,
    });

    const text = response.choices[0]?.message?.content || "{}";
    return JSON.parse(text);
  } catch (err) {
    console.error("[groq.analyzeImage] Error:", err.message);
    return null;
  }
}

export async function chatGroq(systemPrompt, userPrompt) {
  try {
    const response = await groq.chat.completions.create({
      model: TEXT_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 1024,
    });
    return response.choices[0]?.message?.content || "";
  } catch (err) {
    console.error("[groq.chatGroq] Error:", err.message);
    return "";
  }
}

export async function chatGroqJSON(systemPrompt, userPrompt) {
  try {
    const response = await groq.chat.completions.create({
      model: TEXT_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      max_tokens: 1024,
    });
    const text = response.choices[0]?.message?.content || "{}";
    return JSON.parse(text);
  } catch (err) {
    console.error("[groq.chatGroqJSON] Error:", err.message);
    return {};
  }
}
