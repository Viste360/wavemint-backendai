import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate artwork (square + vertical).
 * Uses GPT-Image-1 with strong guidance.
 */
export async function generateArtwork({
  artistName,
  trackName,
  color,
  style = "modern music promo aesthetic, bold, cinematic, sharp lighting, high contrast",
}) {
  const prompt = `
Generate two cohesive artwork images for a music release.

Artist: ${artistName}
Track: ${trackName}
Primary color theme: ${color}

Visual style:
${style}
Digital art, high detail, clean typography, bold contrast, dynamic composition.
Return ONLY image output, no text.

Output 1: Square album cover (1024x1024)
Output 2: Vertical social promo (1080x1920)
`;

  const response = await openai.images.generate({
    model: "gpt-image-1",
    prompt,
    size: "1024x1024",
    n: 1,
    response_format: "b64_json",
  });

  const responseVertical = await openai.images.generate({
    model: "gpt-image-1",
    prompt,
    size: "1080x1920",
    n: 1,
    response_format: "b64_json",
  });

  return {
    square: response.data[0].b64_json,
    vertical: responseVertical.data[0].b64_json,
  };
}

/**
 * Smart cropping & subject detection via GPT-4o Vision
 */
export async function detectSubjectBase64(base64) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You detect the subject location inside images.",
      },
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: `data:image/png;base64,${base64}`,
          },
          {
            type: "text",
            text: "Locate the subject or main focal point. Return JSON { x, y, width, height } as percentages.",
          },
        ],
      },
    ],
    response_format: { type: "json_object" },
  });

  return response.choices[0].message.parsed;
}
