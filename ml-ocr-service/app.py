from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import pytesseract
import io
import os
from dotenv import load_dotenv
from recommender import BookRecommender

load_dotenv()

pytesseract.pytesseract.tesseract_cmd = os.getenv("TESSERACT_CMD_PATH")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_methods=["*"],
    allow_headers=["*"],
)


recommender = BookRecommender()


@app.post("/recommend")
async def recommend(file: UploadFile = File(...)):
    # --- OCR ---
    image_bytes = await file.read()
    image = Image.open(io.BytesIO(image_bytes))
    ocr_text = pytesseract.image_to_string(image)

    # --- Recommendation ---
    recommendations = recommender.recommend(ocr_text)

    return {
        "query": ocr_text.strip(),
        "recommendations": recommendations
    }
