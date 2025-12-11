import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll,
  UploadMetadata,
} from 'firebase/storage';
import { storage } from './firebase';
import { Timestamp } from 'firebase/firestore';
import { Attachment } from './types';

/**
 * Storage path helpers for organized file structure
 */
export const StoragePaths = {
  shipment: (shipmentId: string) => `shipments/${shipmentId}`,
  shipmentBol: (shipmentId: string) => `shipments/${shipmentId}/bol`,
  shipmentLabels: (shipmentId: string) => `shipments/${shipmentId}/labels`,
  shipmentPhotos: (shipmentId: string) => `shipments/${shipmentId}/photos`,

  goodsReceived: (receivedId: string) => `goodsReceived/${receivedId}`,
  goodsReceivedPhotos: (receivedId: string) => `goodsReceived/${receivedId}/photos`,
  goodsReceivedDocs: (receivedId: string) => `goodsReceived/${receivedId}/docs`,

  inventory: (inventoryId: string) => `inventory/${inventoryId}`,
  client: (clientId: string) => `clients/${clientId}`,
  user: (userId: string) => `users/${userId}`,
};

/**
 * Generate a unique file name to avoid collisions
 */
function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop() || '';
  const baseName = originalName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '_');
  return `${baseName}_${timestamp}_${randomStr}.${extension}`;
}

/**
 * Upload a file to Firebase Storage
 * @param file - The file to upload
 * @param path - The storage path (e.g., 'shipments/abc123')
 * @param type - The type of attachment
 * @returns Attachment object with file info and download URL
 */
export async function uploadFile(
  file: File,
  path: string,
  type: 'bol' | 'label' | 'photo' | 'other' = 'other'
): Promise<Attachment> {
  const uniqueFileName = generateUniqueFileName(file.name);
  const fullPath = `${path}/${uniqueFileName}`;
  const storageRef = ref(storage, fullPath);

  const metadata: UploadMetadata = {
    contentType: file.type,
    customMetadata: {
      originalName: file.name,
      type: type,
    },
  };

  // Upload the file
  const snapshot = await uploadBytes(storageRef, file, metadata);

  // Get the download URL
  const url = await getDownloadURL(snapshot.ref);

  return {
    id: uniqueFileName,
    name: file.name,
    url,
    type,
    size: file.size,
    uploadedAt: Timestamp.now(),
  };
}

/**
 * Upload multiple files
 */
export async function uploadFiles(
  files: File[],
  path: string,
  type: 'bol' | 'label' | 'photo' | 'other' = 'other'
): Promise<Attachment[]> {
  const uploadPromises = files.map(file => uploadFile(file, path, type));
  return Promise.all(uploadPromises);
}

/**
 * Delete a file from Firebase Storage
 */
export async function deleteFile(path: string, fileName: string): Promise<void> {
  const fullPath = `${path}/${fileName}`;
  const storageRef = ref(storage, fullPath);

  try {
    await deleteObject(storageRef);
  } catch (error: any) {
    // Ignore 'object-not-found' errors
    if (error.code !== 'storage/object-not-found') {
      throw error;
    }
  }
}

/**
 * Get the download URL for a file
 */
export async function getFileUrl(path: string): Promise<string> {
  const storageRef = ref(storage, path);
  return getDownloadURL(storageRef);
}

/**
 * Check if storage is available (Blaze plan required)
 */
export async function isStorageAvailable(): Promise<boolean> {
  try {
    // Try to get a reference - this will fail if storage isn't configured
    const testRef = ref(storage, 'test');
    return true;
  } catch (error) {
    console.warn('Firebase Storage may not be available. Blaze plan required.');
    return false;
  }
}

// ==================== SHIPMENT SPECIFIC FUNCTIONS ====================

/**
 * Upload BOL document for a shipment
 */
export async function uploadShipmentBol(
  file: File,
  shipmentId: string
): Promise<Attachment> {
  return uploadFile(file, StoragePaths.shipmentBol(shipmentId), 'bol');
}

/**
 * Upload shipping label for a shipment
 */
export async function uploadShipmentLabel(
  file: File,
  shipmentId: string
): Promise<Attachment> {
  return uploadFile(file, StoragePaths.shipmentLabels(shipmentId), 'label');
}

/**
 * Upload pickup/delivery photo for a shipment
 */
export async function uploadShipmentPhoto(
  file: File,
  shipmentId: string
): Promise<Attachment> {
  return uploadFile(file, StoragePaths.shipmentPhotos(shipmentId), 'photo');
}

/**
 * Delete all attachments for a shipment
 */
export async function deleteAllShipmentAttachments(shipmentId: string): Promise<void> {
  const shipmentRef = ref(storage, StoragePaths.shipment(shipmentId));
  try {
    const result = await listAll(shipmentRef);
    // Delete all files in the shipment folder
    await Promise.all([
      ...result.items.map(item => deleteObject(item)),
      // Recursively delete files in subfolders
      ...result.prefixes.map(async (prefix) => {
        const subResult = await listAll(prefix);
        return Promise.all(subResult.items.map(item => deleteObject(item)));
      })
    ]);
  } catch (error: any) {
    if (error.code !== 'storage/object-not-found') {
      console.error('Error deleting shipment attachments:', error);
    }
  }
}

// ==================== GOODS RECEIVED SPECIFIC FUNCTIONS ====================

/**
 * Upload receiving photo for goods received
 */
export async function uploadGoodsReceivedPhoto(
  file: File,
  receivedId: string
): Promise<Attachment> {
  return uploadFile(file, StoragePaths.goodsReceivedPhotos(receivedId), 'photo');
}

/**
 * Upload documentation for goods received
 */
export async function uploadGoodsReceivedDocument(
  file: File,
  receivedId: string
): Promise<Attachment> {
  return uploadFile(file, StoragePaths.goodsReceivedDocs(receivedId), 'other');
}

/**
 * Delete all attachments for goods received entry
 */
export async function deleteAllGoodsReceivedAttachments(receivedId: string): Promise<void> {
  const receivedRef = ref(storage, StoragePaths.goodsReceived(receivedId));
  try {
    const result = await listAll(receivedRef);
    await Promise.all([
      ...result.items.map(item => deleteObject(item)),
      ...result.prefixes.map(async (prefix) => {
        const subResult = await listAll(prefix);
        return Promise.all(subResult.items.map(item => deleteObject(item)));
      })
    ]);
  } catch (error: any) {
    if (error.code !== 'storage/object-not-found') {
      console.error('Error deleting goods received attachments:', error);
    }
  }
}
