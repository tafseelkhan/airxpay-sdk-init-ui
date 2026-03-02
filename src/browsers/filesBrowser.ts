// browsers/fileBrowser.ts
import * as ImagePicker from 'expo-image-picker';
import { File, Paths } from 'expo-file-system'; // Modern API - no deprecation warnings!

export const allowedTypes = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/pdf'
] as const;

export type AllowedMimeType = typeof allowedTypes[number];

/**
 * Get file extension from URI
 */
const getFileExtension = (uri: string): string => {
  return uri.split('.').pop()?.toLowerCase() || '';
};

/**
 * Map file extension to MIME type
 */
const extensionToMimeType = (extension: string): string => {
  const map: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'pdf': 'application/pdf'
  };
  return map[extension] || 'application/octet-stream';
};

/**
 * Convert ImagePickerAsset to proper MIME type
 */
export const getMimeTypeFromAsset = (asset: ImagePicker.ImagePickerAsset): string => {
  // Priority 1: Use explicit mimeType if provided and valid
  if (asset.mimeType) {
    const mimeType = asset.mimeType.toLowerCase();
    if (allowedTypes.includes(mimeType as AllowedMimeType)) {
      return mimeType;
    }
  }

  // Priority 2: Check file extension
  const extension = getFileExtension(asset.uri);
  const mimeFromExt = extensionToMimeType(extension);

  if (allowedTypes.includes(mimeFromExt as AllowedMimeType)) {
    return mimeFromExt;
  }

  // Priority 3: Default image handling
  if (asset.type === 'image') return 'image/jpeg';

  if (asset.type === 'video') {
    throw new Error('Video files are not supported. Please select an image or PDF.');
  }

  throw new Error(`Unsupported file type. Allowed types: ${allowedTypes.join(', ')}`);
};

/**
 * MODERN APPROACH: Convert a file URI to base64 using the new File class
 * This uses the official Expo FileSystem API without any deprecation warnings
 */
export const convertFileToBase64 = async (file: { uri: string; type?: string }): Promise<string> => {
  if (!file.uri) throw new Error('File URI is required');

  try {
    // Step 1: Create a File instance from the URI
    // The File constructor can accept a URI string directly
    const fileObject = new File(file.uri);
    
    // Step 2: Check if file exists using the modern API
    if (!fileObject.exists) {
      throw new Error('File does not exist');
    }

    // Step 3: Determine MIME type
    let mimeType = file.type;
    if (!mimeType) {
      // Try to get from fileObject first, then fallback to extension
      mimeType = fileObject.type || extensionToMimeType(getFileExtension(file.uri));
    }

    // Step 4: Validate MIME type
    if (!allowedTypes.includes(mimeType as AllowedMimeType)) {
      throw new Error(
        `Invalid file type: ${mimeType}. Allowed types: ${allowedTypes.join(', ')}`
      );
    }

    // Step 5: Read file as base64 using the modern File.base64() method
    // This is the recommended approach in Expo SDK 54+
    const base64Content = await fileObject.base64();
    
    // Step 6: Return as data URL with proper prefix
    return `data:${mimeType};base64,${base64Content}`;
    
  } catch (error: any) {
    console.error('File conversion failed:', error);
    throw new Error(error.message || 'Failed to convert file to base64');
  }
};

/**
 * FALLBACK METHOD: Using fetch + blob (works everywhere, no deprecation warnings)
 * Use this if you encounter any issues with the File.base64() method
 */
export const convertFileToBase64Fallback = async (file: { uri: string; type?: string }): Promise<string> => {
  if (!file.uri) throw new Error('File URI is required');

  try {
    // Fetch the file as blob
    const response = await fetch(file.uri);
    const blob = await response.blob();
    
    // Determine MIME type
    const mimeType = file.type || blob.type || extensionToMimeType(getFileExtension(file.uri));
    
    // Validate MIME type
    if (!allowedTypes.includes(mimeType as AllowedMimeType)) {
      throw new Error(
        `Invalid file type: ${mimeType}. Allowed types: ${allowedTypes.join(', ')}`
      );
    }

    // Convert to base64 using FileReader
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result); // Already includes data:image/jpeg;base64, prefix
        } else {
          reject(new Error('Failed to convert file: Invalid result type'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('FileReader error: ' + (reader.error?.message || 'Unknown error')));
      };
      
      reader.readAsDataURL(blob);
    });
  } catch (error: any) {
    console.error('Fallback conversion failed:', error);
    throw new Error(error.message || 'Failed to convert file to base64');
  }
};