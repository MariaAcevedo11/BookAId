"use client";

import React, { useState } from "react";
import { useRef } from "react";

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [message, setMessage] = useState("");

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

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx?.drawImage(video, 0, 0);

    canvas.toBlob(async (blob) => {
      if (!blob) return;

      const formData = new FormData();
      formData.append("image", blob, "book.jpg");

      const res = await fetch("/api/recommend", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setMessage(data.message);
    }, "image/jpeg");
  };

   return (
    <main style={{ padding: 20 }}>
      <h1>📚 Recomendador de Libros</h1>

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

      {message && <p>{message}</p>}
    </main>
  );
}
