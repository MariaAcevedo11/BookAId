"use client";

import React, { useState, useRef } from "react";

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");

  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  };

  const takePhoto = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    setStatus("loading"); 

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

        if (!res.ok) throw new Error("Error en backend");

        setStatus("done"); 
      } catch (error) {
        console.error(error);
        setStatus("idle");
      }
    }, "image/jpeg");
  };

  return (
    <main style={{ padding: 20 }}>
      <h1>BookAId</h1>

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
          Take Photo
        </button>
      </div>

      
      {status === "idle" && (
        <p style={{ color: "#888" }}>Take a photo of your book</p>
      )}

      {status === "loading" && (
        <p style={{ color: "#0070f3" }}>Analizing...</p>
      )}

      {status === "done" && (
        <p style={{ color: "green" }}>Page Analized</p>
      )}
    </main>
  );
}
