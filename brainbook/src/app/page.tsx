"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  BookOpen,
  Camera,
  CheckCircle2,
  Loader2,
  ScanLine,
} from "lucide-react";
import { useRef, useState, useEffect } from "react";

type Status = "idle" | "loading" | "success" | "error";
type Quality = "ok" | "too dark" | "too bright" | "blurry";

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [status, setStatus] = useState<Status>("idle");
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [quality, setQuality] = useState<Quality>("ok");

  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current?.play();
      };
    }
  };

  // --- Quality Checks ---
  const checkBrightness = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
  ): Quality => {
    if (canvas.width === 0 || canvas.height === 0) return "ok"; // protección
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    let totalBrightness = 0;

    for (let i = 0; i < pixels.length; i += 4) {
      const brightness = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
      totalBrightness += brightness;
    }

    const avgBrightness = totalBrightness / (pixels.length / 4);

    if (avgBrightness < 50) return "too dark";
    if (avgBrightness > 200) return "too bright";
    return "ok";
  };

  const checkBlur = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
  ): Quality => {
    if (canvas.width === 0 || canvas.height === 0) return "ok"; // protección
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    let grayValues: number[] = [];

    for (let i = 0; i < pixels.length; i += 4) {
      const gray = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
      grayValues.push(gray);
    }

    const mean = grayValues.reduce((a, b) => a + b, 0) / grayValues.length;
    const variance =
      grayValues.reduce((a, b) => a + (b - mean) ** 2, 0) / grayValues.length;

    if (variance < 500) return "blurry";
    return "ok";
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (!videoRef.current || !canvasRef.current) return;
      const video = videoRef.current;
      if (video.videoWidth === 0 || video.videoHeight === 0) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);

      const brightnessResult = checkBrightness(ctx, canvas);
      const blurResult = checkBlur(ctx, canvas);

      if (brightnessResult !== "ok") {
        setQuality(brightnessResult);
      } else if (blurResult !== "ok") {
        setQuality("blurry");
      } else {
        setQuality("ok");
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const takePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setStatus("loading");
    setRecommendations([]);

    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      setStatus("error");
      alert("La cámara aún no está lista. Intenta de nuevo.");
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx?.drawImage(video, 0, 0);

    // Final quality check before upload
    if (quality !== "ok") {
      setStatus("error");
      alert(`Problema de calidad: ${quality}. Por favor retoma la foto.`);
      return;
    }

    canvas.toBlob(async (blob) => {
      if (!blob) return;

      const formData = new FormData();
      formData.append("image", blob, "book.jpg");

      try {
        const res = await fetch("/api/recommend", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error("Request failed");

        const data = await res.json();

        setRecommendations(data.recommendations);
        setStatus("success");
      } catch (err) {
        console.error(err);
        setStatus("error");
      }
    }, "image/jpeg");
  };

  return (
    <main className="min-h-screen flex justify-center items-start p-6 bg-muted/40">
      <Card className="w-full max-w-xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            BookAId
          </CardTitle>
          <CardDescription>
            Scan a book cover to get personalized recommendations
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="relative flex justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full max-w-sm rounded-xl border shadow-md"
            />

            <div className="absolute top-2 left-2">
              {quality === "ok" && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  Good Quality
                </Badge>
              )}
              {quality === "too dark" && (
                <Badge
                  variant="destructive"
                  className="flex items-center gap-1"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Too Dark
                </Badge>
              )}
              {quality === "too bright" && (
                <Badge
                  variant="destructive"
                  className="flex items-center gap-1"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Too Bright
                </Badge>
              )}
              {quality === "blurry" && (
                <Badge
                  variant="destructive"
                  className="flex items-center gap-1"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Blurry
                </Badge>
              )}
            </div>
          </div>

          <canvas ref={canvasRef} className="hidden" />

          <div className="flex justify-center gap-4">
            <Button
              variant="outline"
              onClick={startCamera}
              className="flex items-center gap-2"
            >
              <Camera className="w-4 h-4" />
              Open Camera
            </Button>
            <Button
              onClick={takePhoto}
              variant="bookaid"
              className="flex items-center gap-2"
            >
              <ScanLine className="w-4 h-4" />
              Scan Book
            </Button>
          </div>

          {status === "loading" && (
            <div className="flex justify-center">
              <Badge variant="secondary" className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Scanning and analyzing…
              </Badge>
            </div>
          )}

          {status === "error" && (
            <div className="flex justify-center">
              <Badge variant="destructive" className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Something went wrong
              </Badge>
            </div>
          )}

          {status === "success" && (
            <>
              <Separator />
              <div className="space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  Recommended Books
                </h2>

                {recommendations.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No recommendations found.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {recommendations.map((rec, idx) => (
                      <li
                        key={idx}
                        className="flex justify-between items-center rounded-lg border p-3 shadow-sm"
                      >
                        <span className="font-medium">{rec.title}</span>
                        <Badge variant="outline">
                          {Number(rec.score).toFixed(3)}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
