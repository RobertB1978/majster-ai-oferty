/**
 * EXIF Metadata Stripping Utility
 * Removes GPS and other sensitive metadata from images before upload
 */

/**
 * Strips EXIF metadata from an image file
 * Creates a new clean image without GPS, camera info, or other metadata
 */
export async function stripExifData(file: File): Promise<File> {
  // Only process image files
  if (!file.type.startsWith('image/')) {
    return file;
  }

  // Skip SVG files - they don't have EXIF data
  if (file.type === 'image/svg+xml') {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const img = new Image();
      
      img.onload = () => {
        // Create canvas to redraw image without EXIF
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          resolve(file); // Fallback to original if canvas not available
          return;
        }

        // Set canvas size to image dimensions
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        
        // Draw image onto canvas (this strips all EXIF data)
        ctx.drawImage(img, 0, 0);
        
        // Determine output format and quality
        let outputType = file.type;
        let quality = 0.92;

        // Force JPEG for most formats for better compression
        if (outputType === 'image/png') {
          // Keep PNG for transparency
          outputType = 'image/png';
        } else if (outputType === 'image/webp') {
          outputType = 'image/webp';
          quality = 0.92;
        } else {
          // Default to JPEG for everything else
          outputType = 'image/jpeg';
          quality = 0.92;
        }

        // Convert canvas to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file); // Fallback to original
              return;
            }

            // Create new file with same name but clean data
            const cleanFileName = file.name.replace(/\.[^.]+$/, '') + 
              (outputType === 'image/png' ? '.png' : 
               outputType === 'image/webp' ? '.webp' : '.jpg');
            
            const cleanFile = new File([blob], cleanFileName, {
              type: outputType,
              lastModified: Date.now(),
            });

            resolve(cleanFile);
          },
          outputType,
          quality
        );
      };

      img.onerror = () => {
        resolve(file); // Fallback to original on error
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = () => {
      resolve(file); // Fallback to original on error
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Batch strip EXIF data from multiple files
 */
export async function stripExifDataBatch(files: File[]): Promise<File[]> {
  return Promise.all(files.map(stripExifData));
}

/**
 * Check if a file likely contains EXIF data
 * (JPEG and TIFF formats commonly contain EXIF)
 */
export function mayContainExifData(file: File): boolean {
  const exifTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/tiff',
    'image/heic',
    'image/heif',
  ];
  return exifTypes.includes(file.type.toLowerCase());
}
