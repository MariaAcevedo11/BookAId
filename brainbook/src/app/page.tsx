"use client";

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
    <main style={{ padding: 20 }}>
      <h1>📚 Book Recommender</h1>

      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{ width: "100%", maxWidth: 400 }}
      />

      <canvas ref={canvasRef} style={{ display: "none" }} />

      <div style={{ marginTop: 10 }}>
        <button onClick={startCamera}>Open Camera</button>
        <button onClick={takePhoto} style={{ marginLeft: 10 }}>
          Scan Book
        </button>
      </div>

      {status === "loading" && <p>Scanning and analyzing…</p>}
      {status === "error" && <p>Something went wrong</p>}

      {status === "success" && (
        <div style={{ marginTop: 20 }}>
          <h2>📖 Recommended Books</h2>

          <ul>
            {recommendations.map((rec, idx) => (
              <li key={idx}>
                <strong>{rec.title}</strong> — score:{" "}
                {Number(rec.score).toFixed(3)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
