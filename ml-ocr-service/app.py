from fastapi import FastAPI, File, UploadFile
from PIL import Image, ImageEnhance
from dotenv import load_dotenv
import pytesseract
import io
import re
import os 

load_dotenv() 

app = FastAPI(title = "OCR Service")

tesseract_path = os.getenv("TESSERACT_CMD_PATH")
if tesseract_path:
    pytesseract.pytesseract.tesseract_cmd = tesseract_path


@app.post("/ocr")

async def ocr_image(file: UploadFile = File(...)):
    image_bytes = await file.read()
    image = Image.open(io.BytesIO(image_bytes)).convert("L")
    
    
    enhacner = ImageEnhance.Contrast(image)
    image = enhacner.enhance(2)
    
    text = pytesseract.image_to_string(image, lang = "eng+spa+por")
    
    text = re.sub(r"[^a-zA-Z0-9\s]", "", text)
    text = " ".join(text.split())

    return {
        "text": text
    }
    
