import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const formData = await req.formData();
  const image = formData.get("image");

  if (!image || !(image instanceof File)) {
    return NextResponse.json(
      { error: "Image was not received" },
      { status: 400 },
    );
  }

  
  const ocrFormData = new FormData();
  ocrFormData.append("file", image);
  
  const ocrServiceUrl = process.env.OCR_SERVICE_URL;
  const ocrResponse = await fetch(`${ocrServiceUrl}/ocr`, {
    method: "POST",
    body: ocrFormData,
  });

  if (!ocrResponse.ok) {
    return NextResponse.json({ error: "Error service OCR" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
