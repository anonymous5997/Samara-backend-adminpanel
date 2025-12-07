'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, ZoomIn, ZoomOut, Move } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface ProductTryOnModalProps {
  isOpen: boolean;
  onClose: () => void;
  productImage: string;
  productName: string;
}

export function ProductTryOnModal({
  isOpen,
  onClose,
  productImage,
  productName,
}: ProductTryOnModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string>('');
  const [overlayScale, setOverlayScale] = useState(1);
  const [overlayPosition, setOverlayPosition] = useState({ x: 0, y: 0 });
  const [cameraStarted, setCameraStarted] = useState(false);

  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      startCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera access is not supported in your browser');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraStarted(true);
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraError(
        'Unable to access camera. Please grant camera permissions and try again.'
      );
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraStarted(false);
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  const adjustScale = (delta: number) => {
    setOverlayScale((prev) => Math.max(0.5, Math.min(2, prev + delta)));
  };

  const moveOverlay = (direction: 'up' | 'down' | 'left' | 'right') => {
    const step = 10;
    setOverlayPosition((prev) => {
      switch (direction) {
        case 'up':
          return { ...prev, y: prev.y - step };
        case 'down':
          return { ...prev, y: prev.y + step };
        case 'left':
          return { ...prev, x: prev.x - step };
        case 'right':
          return { ...prev, x: prev.x + step };
        default:
          return prev;
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl w-full h-[90vh] bg-black border-2 border-[#D4AF37] p-0 overflow-hidden">
        <div className="relative w-full h-full flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-[#D4AF37]/30 bg-black/90 backdrop-blur-sm">
            <h2 className="font-serif text-2xl font-bold text-[#D4AF37]">
              Try On: {productName}
            </h2>
            <Button
              onClick={handleClose}
              variant="ghost"
              size="icon"
              className="text-[#D4AF37] hover:bg-[#D4AF37]/10"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>

          <div className="flex-1 relative overflow-hidden bg-black">
            {cameraError ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center max-w-md px-6">
                  <p className="text-red-400 mb-4">{cameraError}</p>
                  <Button
                    onClick={startCamera}
                    className="bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-black font-semibold"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover transform -scale-x-100"
                />

                {cameraStarted && (
                  <div
                    className="absolute pointer-events-none"
                    style={{
                      top: '15%',
                      left: '50%',
                      transform: `translate(-50%, 0) translate(${overlayPosition.x}px, ${overlayPosition.y}px) scale(${overlayScale})`,
                      width: '300px',
                      height: '400px',
                      opacity: 0.7,
                    }}
                  >
                    <img
                      src={productImage}
                      alt="Try-on overlay"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}

                {!cameraStarted && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-pulse text-[#D4AF37] mb-4">
                        <div className="w-16 h-16 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto"></div>
                      </div>
                      <p className="text-gray-400">Starting camera...</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {cameraStarted && !cameraError && (
            <div className="p-4 bg-black/90 backdrop-blur-sm border-t border-[#D4AF37]/30">
              <div className="flex flex-wrap gap-3 justify-center items-center">
                <div className="flex gap-2">
                  <Button
                    onClick={() => adjustScale(-0.1)}
                    size="sm"
                    variant="outline"
                    className="border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/10"
                  >
                    <ZoomOut className="h-4 w-4 mr-1" />
                    Smaller
                  </Button>
                  <Button
                    onClick={() => adjustScale(0.1)}
                    size="sm"
                    variant="outline"
                    className="border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/10"
                  >
                    <ZoomIn className="h-4 w-4 mr-1" />
                    Larger
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => moveOverlay('up')}
                    size="sm"
                    variant="outline"
                    className="border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/10"
                  >
                    <Move className="h-4 w-4 mr-1" />
                    Up
                  </Button>
                  <Button
                    onClick={() => moveOverlay('down')}
                    size="sm"
                    variant="outline"
                    className="border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/10"
                  >
                    <Move className="h-4 w-4 mr-1" />
                    Down
                  </Button>
                  <Button
                    onClick={() => moveOverlay('left')}
                    size="sm"
                    variant="outline"
                    className="border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/10"
                  >
                    <Move className="h-4 w-4 mr-1" />
                    Left
                  </Button>
                  <Button
                    onClick={() => moveOverlay('right')}
                    size="sm"
                    variant="outline"
                    className="border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/10"
                  >
                    <Move className="h-4 w-4 mr-1" />
                    Right
                  </Button>
                </div>

                <Button
                  onClick={() => {
                    setOverlayScale(1);
                    setOverlayPosition({ x: 0, y: 0 });
                  }}
                  size="sm"
                  className="bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-black font-semibold"
                >
                  Reset Position
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
