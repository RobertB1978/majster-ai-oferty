/**
 * Image Compression Utility
 * Compresses images before upload to reduce storage costs and improve performance
 */

interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  outputFormat?: 'image/jpeg' | 'image/webp' | 'image/png';
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.85,
  outputFormat: 'image/webp',
};

/**
 * Compresses an image file to reduce file size
 * Also strips EXIF metadata in the process
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  // Only process image files
  if (!file.type.startsWith('image/')) {
    return file;
  }

  // Skip SVG files
  if (file.type === 'image/svg+xml') {
    return file;
  }

  const opts = { ...DEFAULT_OPTIONS, ...options };

  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions maintaining aspect ratio
        let { width, height } = img;
        const maxW = opts.maxWidth!;
        const maxH = opts.maxHeight!;

        if (width > maxW || height > maxH) {
          const ratio = Math.min(maxW / width, maxH / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        // Create canvas for compression
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(file);
          return;
        }

        canvas.width = width;
        canvas.height = height;

        // Enable image smoothing for better quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw resized image
        ctx.drawImage(img, 0, 0, width, height);

        // Determine output format
        let outputType = opts.outputFormat!;
        
        // Check if browser supports WebP, fallback to JPEG
        if (outputType === 'image/webp' && !supportsWebP()) {
          outputType = 'image/jpeg';
        }

        // Keep PNG for images with transparency
        if (file.type === 'image/png' && hasTransparency(ctx, width, height)) {
          outputType = 'image/png';
        }

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }

            // Only use compressed version if it's smaller
            if (blob.size >= file.size) {
              console.log('Compression did not reduce size, using original');
              resolve(file);
              return;
            }

            // Generate new filename with correct extension
            const ext = outputType === 'image/png' ? '.png' : 
                       outputType === 'image/webp' ? '.webp' : '.jpg';
            const baseName = file.name.replace(/\.[^.]+$/, '');
            const newFileName = `${baseName}${ext}`;

            const compressedFile = new File([blob], newFileName, {
              type: outputType,
              lastModified: Date.now(),
            });

            const reduction = ((1 - blob.size / file.size) * 100).toFixed(1);
            console.log(`Image compressed: ${formatFileSize(file.size)} → ${formatFileSize(blob.size)} (${reduction}% reduction)`);

            resolve(compressedFile);
          },
          outputType,
          opts.quality
        );
      };

      img.onerror = () => {
        resolve(file);
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = () => {
      resolve(file);
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Check if browser supports WebP
 */
function supportsWebP(): boolean {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/webp').startsWith('data:image/webp');
}

/**
 * Check if image has transparent pixels
 */
function hasTransparency(ctx: CanvasRenderingContext2D, width: number, height: number): boolean {
  try {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Check every 100th pixel for transparency (performance optimization)
    for (let i = 3; i < data.length; i += 400) {
      if (data[i] < 255) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Compress multiple images in batch
 */
export async function compressImageBatch(
  files: File[],
  options: CompressionOptions = {}
): Promise<File[]> {
  return Promise.all(files.map(file => compressImage(file, options)));
}

/**
 * Calculate potential size savings
 */
export function estimateSavings(files: File[]): { totalSize: number; estimatedCompressed: number } {
  const totalSize = files.reduce((acc, file) => acc + file.size, 0);
  // Estimate ~60% reduction on average
  const estimatedCompressed = Math.round(totalSize * 0.4);
  return { totalSize, estimatedCompressed };
}
