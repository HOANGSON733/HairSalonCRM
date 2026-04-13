export interface ImageUploadOptions {
  maxSizeMb?: number;
  allowedMimeTypes?: string[];
}

const DEFAULT_ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const DEFAULT_MAX_SIZE_MB = 5;

export function validateImageFile(file: File, options?: ImageUploadOptions): string | null {
  const allowedMimeTypes = options?.allowedMimeTypes || DEFAULT_ALLOWED_MIME_TYPES;
  const maxSizeMb = options?.maxSizeMb ?? DEFAULT_MAX_SIZE_MB;

  if (!allowedMimeTypes.includes(file.type)) {
    return 'Vui long chon anh JPG, PNG hoac WEBP.';
  }

  if (file.size > maxSizeMb * 1024 * 1024) {
    return `Anh vuot qua ${maxSizeMb}MB. Vui long chon anh nho hon.`;
  }

  return null;
}

export function readImageAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Khong the doc file anh.'));
    reader.readAsDataURL(file);
  });
}

export async function prepareImageFromFile(file: File, options?: ImageUploadOptions): Promise<string> {
  const validationError = validateImageFile(file, options);
  if (validationError) {
    throw new Error(validationError);
  }
  return readImageAsDataUrl(file);
}
