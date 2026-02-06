from fastapi import FastAPI, File, UploadFile
from PIL import Image, ImageEnhance
import pytesseract
import io
import re

app = FastAPI(title = "OCR Service")

pytesseract.pytesseract.tesseract_cmd = (r"C:\Program Files\Tesseract-OCR\tesseract.exe")

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
    
