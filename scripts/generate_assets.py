"""One-off script to generate Mughal-royal themed game assets via Gemini Nano Banana.

Run:
  cd /app && python scripts/generate_assets.py

Outputs go to /app/src/assets/ (overwriting existing files).
"""

import asyncio
import base64
import os
from pathlib import Path

from emergentintegrations.llm.chat import LlmChat, UserMessage

API_KEY = os.environ.get("EMERGENT_LLM_KEY", "sk-emergent-59cC9D2Ec952e45D4C")
MODEL_ID = "gemini-3.1-flash-image-preview"
OUT_DIR = Path(__file__).resolve().parent.parent / "src" / "assets"
OUT_DIR.mkdir(parents=True, exist_ok=True)


PROMPTS = {
    # The big one — central board background (map)
    "hero-warroom.jpg": (
        "A top-down photograph of an antique Mughal-era parchment map of the Indian subcontinent "
        "resting on dark hand-carved wood. The parchment is warm ivory and tea-stained, with "
        "hand-drawn provincial borders in sepia ink and delicate gold-leaf filigree corners "
        "(Islamic geometric patterns and paisley motifs). The lighting is a single warm oil-lamp "
        "glow from the upper-right, casting soft shadows; the background is deep indigo-black and "
        "fades to black at the edges. Mood: regal, cinematic, mysterious, Mughal royal war-room. "
        "No text, no labels, no people, no modern objects. Photorealistic, 16:9, high detail, "
        "cinematic color grading, slight film grain."
    ),
    # Emblem / seal (used in header)
    "emblem-seal.png": (
        "A single ornate Mughal royal wax seal emblem on a transparent-looking dark background. "
        "The seal is a circular medallion of antique gold with intricate Islamic geometric "
        "filigree, a central paisley (boteh) motif and a peacock feather fan behind it. Deep "
        "crimson enamel accents, worn gold patina, small pearl border. Front-facing, perfectly "
        "centered, soft rim light, studio photograph. No text, no letters, no calligraphy. "
        "Square 1:1 composition."
    ),
    # Parchment texture (backup / panels)
    "parchment-texture.jpg": (
        "A seamless texture of aged ivory parchment paper, tea-stained with soft brown mottling, "
        "faint gold-leaf speckles, and very subtle Mughal-style floral watermark patterns barely "
        "visible. Warm, slightly desaturated, no text, no drawings, no borders, evenly lit, "
        "high-resolution photograph. Square."
    ),
    # New: gold coin for tile prices / currency
    "mughal-coin.png": (
        "A single ornate Mughal gold mohur coin photographed top-down on pure black background. "
        "The coin is warm antique gold with a raised rim, intricate Islamic geometric pattern "
        "around the edge, and a central paisley / sun-burst medallion. Soft studio lighting with "
        "gentle highlights, subtle wear and patina. No text, no lettering, no calligraphy. "
        "Square 1:1, tightly cropped, transparent-looking black backdrop."
    ),
    # New: Mughal palace silhouette for "office" marker
    "mughal-chhatri.png": (
        "A single ornate Mughal chhatri (domed pavilion) silhouette rendered as a clean flat "
        "emblem: warm antique gold gradient fill, deep brown outline, centered on pure black "
        "background. Symmetrical, onion-dome on top, four slender pillars, decorative finial. "
        "Minimal, icon-like, no shadows, no text, no other objects. Square 1:1."
    ),
}


async def generate_one(filename: str, prompt: str):
    out_path = OUT_DIR / filename
    print(f"[gen] {filename} -> {out_path}")
    chat = (
        LlmChat(
            api_key=API_KEY,
            session_id=f"assets-{filename}",
            system_message="You generate high-quality royalty-free game art.",
        )
        .with_model("gemini", MODEL_ID)
        .with_params(modalities=["image", "text"])
    )
    msg = UserMessage(text=prompt)
    try:
        _text, images = await chat.send_message_multimodal_response(msg)
    except Exception as e:  # noqa: BLE001
        print(f"  !! failed: {e}")
        return False
    if not images:
        print("  !! no image returned")
        return False
    image_bytes = base64.b64decode(images[0]["data"])
    out_path.write_bytes(image_bytes)
    print(f"  ok ({len(image_bytes)} bytes)")
    return True


async def main():
    # Run sequentially to be gentle on rate limits
    results = {}
    for fname, prompt in PROMPTS.items():
        results[fname] = await generate_one(fname, prompt)
    print("\nSummary:")
    for k, v in results.items():
        print(f"  {k}: {'OK' if v else 'FAIL'}")


if __name__ == "__main__":
    asyncio.run(main())
