// components/AITryOnModal.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button'; // adapt to your button component path
import { X, ZoomIn, ZoomOut, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  productImageUrl: string | null; // image to overlay (saree)
};

export default function AITryOnModal({ isOpen, onClose, productImageUrl }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<HTMLCanvasElement | null>(null); // draw saree overlay here
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [tf, setTf] = useState<any>(null);
  const [blazeface, setBlazeface] = useState<any>(null);
  const [bodyPix, setBodyPix] = useState<any>(null);
  const [faceBox, setFaceBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  // overlay transform state
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  // load TF & models dynamically on client
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const tfLib = await import('@tensorflow/tfjs');
        // prefer CPU backends for local dev; if you want webgl use '@tensorflow/tfjs-backend-webgl'
        await tfLib.setBackend?.('webgl').catch(() => {});
        await tfLib.ready();
        const bf = await import('@tensorflow-models/blazeface');
        const bp = await import('@tensorflow-models/body-pix');

        // load models
        const bfModel = await bf.load();
        const bpModel = await bp.load({
          architecture: 'MobileNetV1',
          outputStride: 16,
          multiplier: 0.75,
        });

        if (cancelled) return;

        setTf(tfLib);
        setBlazeface(() => bfModel);
        setBodyPix(() => bpModel);
        setModelsLoaded(true);
      } catch (err) {
        console.error('Error loading TF/models:', err);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  // start/stop camera
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }
    startCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        requestAnimationFrame(renderLoop);
      }
    } catch (err) {
      console.error('Camera error:', err);
    }
  }

  function stopCamera() {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
  }

  // core render loop: draw video -> optional background removal -> detect face -> draw overlay
  async function renderLoop() {
    const v = videoRef.current;
    const c = canvasRef.current;
    const overlay = overlayRef.current;
    if (!v || !c || !modelsLoaded) {
      requestAnimationFrame(renderLoop);
      return;
    }

    // make canvas same size as video
    if (c.width !== v.videoWidth || c.height !== v.videoHeight) {
      c.width = v.videoWidth;
      c.height = v.videoHeight;
      if (overlay) {
        overlay.width = v.videoWidth;
        overlay.height = v.videoHeight;
      }
    }

    const ctx = c.getContext('2d')!;
    ctx.clearRect(0, 0, c.width, c.height);

    // Draw video into canvas
    ctx.drawImage(v, 0, 0, c.width, c.height);

    // BodyPix segmentation -> create alpha mask (transparent background)
    try {
      if (bodyPix) {
        const segmentation = await bodyPix.segmentPerson(v, {
          internalResolution: 'medium',
          segmentationThreshold: 0.7,
        });

        const mask = bodyPix.toMask(segmentation, { r: 0, g: 0, b: 0, a: 0 }, { r: 0, g: 0, b: 0, a: 255 });
        // draw mask onto separate canvas and composite - we want person opaque and background transparent
        const temp = document.createElement('canvas');
        temp.width = c.width;
        temp.height = c.height;
        const tctx = temp.getContext('2d')!;
        tctx.putImageData(mask, 0, 0);
        // multiply alpha from mask to main canvas
        ctx.globalCompositeOperation = 'destination-in';
        ctx.drawImage(temp, 0, 0);
        ctx.globalCompositeOperation = 'source-over';
      }
    } catch (err) {
      // segmentation is expensive — ignore if fails
      // console.warn('segmentation error', err);
    }

    // detect face using blazeface
    try {
      if (blazeface) {
        const returnTensors = false;
        const predictions = await blazeface.estimateFaces(v, returnTensors);

        if (predictions && predictions.length > 0) {
          // use the first face
          const p = predictions[0];
          // p.topLeft & p.bottomRight are [x,y]
          const tl = p.topLeft as [number, number];
          const br = p.bottomRight as [number, number];
          const x = tl[0];
          const y = tl[1];
          const w = br[0] - tl[0];
          const h = br[1] - tl[1];

          // convert to canvas coordinates (video and canvas are same size)
          setFaceBox({ x, y, w, h });
        } else {
          setFaceBox(null);
        }
      }
    } catch (err) {
      // ignore
    }

    // draw overlay saree on overlay canvas
    if (overlay) {
      const oc = overlay.getContext('2d')!;
      oc.clearRect(0, 0, overlay.width, overlay.height);
      if (productImageUrl && faceBox) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = productImageUrl;
        // draw when loaded
        img.onload = () => {
          // target size relative to face; you can tune multiplier to position saree on face
          const targetW = faceBox.w * 1.8 * scale;
          const targetH = targetW * (img.height / img.width);
          // center on face center plus offset
          const cx = faceBox.x + faceBox.w / 2 + offset.x;
          const cy = faceBox.y + faceBox.h / 2 + offset.y;

          const dx = cx - targetW / 2;
          const dy = cy - targetH / 2;

          oc.save();
          // optionally make overlay semi transparent; adjust alpha or use multiply composite if you prefer
          oc.globalAlpha = 0.95;
          oc.drawImage(img, dx, dy, targetW, targetH);
          oc.restore();
        };
      }
    }

    requestAnimationFrame(renderLoop);
  }

  // overlay controls
  function zoomIn() {
    setScale((s) => Math.min(3, +(s + 0.05).toFixed(2)));
  }
  function zoomOut() {
    setScale((s) => Math.max(0.2, +(s - 0.05).toFixed(2)));
  }
  function move(dx: number, dy: number) {
    setOffset((o) => ({ x: o.x + dx, y: o.y + dy }));
  }
  function resetTransform() {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-black max-w-[1100px] w-full rounded-lg border-2 border-gold p-2">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gold/20">
          <h3 className="text-lg font-serif text-gold">Try On</h3>
          <button onClick={() => { stopCamera(); onClose(); }} aria-label="Close" className="text-gold"><X /></button>
        </div>

        <div className="relative bg-[#111] mt-4">
          <video ref={videoRef} autoPlay muted playsInline className="w-full max-h-[640px] object-cover" style={{ display: 'none' }} />
          <canvas ref={canvasRef} style={{ width: '100%', height: 'auto', display: 'block' }} />
          <canvas ref={overlayRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
        </div>

        <div className="flex items-center justify-between gap-3 p-4 border-t border-gold/20">
          <div className="flex items-center gap-2">
            <button onClick={zoomOut} className="px-4 py-2 bg-gold/10 rounded"> <ZoomOut /> Smaller </button>
            <button onClick={zoomIn} className="px-4 py-2 bg-gold/10 rounded"> <ZoomIn /> Larger </button>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => move(0, -10)} className="px-3 py-2 bg-gold/10 rounded"><ChevronUp /></button>
            <button onClick={() => move(0, 10)} className="px-3 py-2 bg-gold/10 rounded"><ChevronDown /></button>
            <button onClick={() => move(-10, 0)} className="px-3 py-2 bg-gold/10 rounded"><ChevronLeft /></button>
            <button onClick={() => move(10, 0)} className="px-3 py-2 bg-gold/10 rounded"><ChevronRight /></button>
            <button onClick={resetTransform} className="px-4 py-2 bg-gold rounded">Reset Position</button>
          </div>
        </div>
      </div>
    </div>
  );
}
