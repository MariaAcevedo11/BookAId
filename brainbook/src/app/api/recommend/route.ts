import { NextResponse } from "next/server";

export async function POST(req: Request) {

  const formData = await req.formData();
  const image = formData.get("image") as File; 

  if (!image) {
    return NextResponse.json(
        { error : "Image not received"},
        { status : 400 }
    );
  }

  return NextResponse.json({
    message: `Received image: ${image.name} (${image.size} bytes)`,
  });
}
