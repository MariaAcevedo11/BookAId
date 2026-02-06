import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const formData = await req.formData();
  const image = formData.get("image");

  if (!image || !(image instanceof File)) {
    return NextResponse.json(
      { error: "No image received" },
      { status: 400 }
    );
  }

  const ocrFormData = new FormData();
  ocrFormData.append("file", image);

  const response = await fetch(process.env.OCR_SERVICE_URL!, {
    method: "POST",
    body: ocrFormData,
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: "OCR service failed" },
      { status: 500 }
    );
  }

  const data = await response.json();
  console.log("FASTAPI RAW RESPONSE:", data);

  return NextResponse.json({
    recommendations: data.recommendations,
  });
}
