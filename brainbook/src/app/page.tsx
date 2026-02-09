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
import { useRef, useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [status, setStatus] = useState<Status>("idle");
  const [recommendations, setRecommendations] = useState<any[]>([]);

  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  };

  const takePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setStatus("loading");
    setRecommendations([]);

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx?.drawImage(video, 0, 0);

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
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            BookAId
          </CardTitle>
          <CardDescription>
            Scan a book cover to get recommendations
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full max-w-sm rounded-xl border"
            />
          </div>

          <canvas ref={canvasRef} className="hidden" />

          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={startCamera}>
              Open Camera
            </Button>
            <Button onClick={takePhoto} variant="bookaid">
              Scan Book
            </Button>
          </div>

          {status === "loading" && (
            <div className="flex justify-center">
              <Badge variant="secondary">Scanning and analyzing…</Badge>
            </div>
          )}

          {status === "error" && (
            <div className="flex justify-center">
              <Badge variant="destructive">Something went wrong</Badge>
            </div>
          )}

          {status === "success" && (
            <>
              <Separator />

              <div className="space-y-2">
                <h2 className="text-lg font-semibold flex items-center gap-2">
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
                        className="flex justify-between items-center rounded-lg border p-3"
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
