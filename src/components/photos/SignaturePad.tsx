/**
 * SignaturePad — PR-15
 *
 * Lightweight canvas-based signature pad (no external dependencies).
 * Actions: Clear | Save
 * Stores signature as PNG blob → passed to useSaveSignature.
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Eraser, Save, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SignaturePadProps {
  onSave: (blob: Blob) => Promise<void>;
  savedSignatureUrl?: string;
  className?: string;
}

export function SignaturePad({ onSave, savedSignatureUrl, className }: SignaturePadProps) {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasStrokes, setHasStrokes] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  // Setup canvas context
  const getCtx = useCallback((): CanvasRenderingContext2D | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    return ctx;
  }, []);

  // Resize canvas to match display size
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeObserver = new ResizeObserver(() => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      clearCanvas();
    });

    resizeObserver.observe(canvas);
    return () => resizeObserver.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasStrokes(false);
    setSaved(false);
  }, [getCtx]);

  // Get position relative to canvas
  const getPos = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      const touch = e.touches[0];
      if (!touch) return null;
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    }
    return {
      x: (e as React.MouseEvent).clientX - rect.left,
      y: (e as React.MouseEvent).clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const pos = getPos(e);
    if (!pos) return;
    setIsDrawing(true);
    setHasStrokes(true);
    setSaved(false);
    lastPos.current = pos;
    const ctx = getCtx();
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const pos = getPos(e);
    if (!pos || !lastPos.current) return;
    const ctx = getCtx();
    if (!ctx) return;
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
  };

  const endDrawing = () => {
    setIsDrawing(false);
    lastPos.current = null;
  };

  const handleSave = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasStrokes) return;
    setSaving(true);
    try {
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error('Failed to create blob'));
        }, 'image/png');
      });
      await onSave(blob);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Saved signature preview */}
      {savedSignatureUrl && !hasStrokes && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">{t('signature.currentSignature')}</p>
          <img
            src={savedSignatureUrl}
            alt={t('signature.savedAlt')}
            className="h-20 border rounded-md bg-white object-contain"
          />
        </div>
      )}

      <p className="text-xs text-muted-foreground">{t('signature.instruction')}</p>

      {/* Canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          className={cn(
            'w-full h-36 border-2 rounded-lg bg-white touch-none cursor-crosshair',
            isDrawing ? 'border-primary' : 'border-dashed border-muted-foreground/50'
          )}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={endDrawing}
          aria-label={t('signature.canvasAriaLabel')}
          role="img"
        />
        {!hasStrokes && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-xs text-muted-foreground/60">{t('signature.placeholder')}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={clearCanvas}
          disabled={!hasStrokes && !savedSignatureUrl}
          className="gap-1.5"
        >
          <Eraser className="h-3.5 w-3.5" />
          {t('signature.clear')}
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!hasStrokes || saving || saved}
          className="gap-1.5"
        >
          {saving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : saved ? (
            <CheckCircle2 className="h-3.5 w-3.5" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          {saved ? t('signature.saved') : t('signature.save')}
        </Button>
      </div>
    </div>
  );
}
