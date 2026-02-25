import {
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
  getMetadata,
  updateMetadata,
  type UploadMetadata,
  type UploadTask,
  type StorageReference,
  type FullMetadata,
  type ListResult,
} from "firebase/storage";
import { storage } from "./client";

/**
 * Upload a file to Firebase Storage
 * Returns the download URL after upload completes
 */
export async function uploadFile(
  path: string,
  file: Blob | Uint8Array | ArrayBuffer,
  metadata?: UploadMetadata
): Promise<string> {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file, metadata);
  return getDownloadURL(storageRef);
}

/**
 * Upload a file with progress tracking
 * Returns an UploadTask for monitoring progress
 *
 * @example
 * const task = uploadFileWithProgress('images/photo.jpg', file);
 * task.on('state_changed',
 *   (snapshot) => {
 *     const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
 *     console.log(`Upload is ${progress}% done`);
 *   },
 *   (error) => console.error(error),
 *   async () => {
 *     const url = await getDownloadURL(task.snapshot.ref);
 *     console.log('File available at', url);
 *   }
 * );
 */
export function uploadFileWithProgress(
  path: string,
  file: Blob | Uint8Array | ArrayBuffer,
  metadata?: UploadMetadata
): UploadTask {
  const storageRef = ref(storage, path);
  return uploadBytesResumable(storageRef, file, metadata);
}

/**
 * Get the download URL for a file
 */
export async function getFileUrl(path: string): Promise<string> {
  const storageRef = ref(storage, path);
  return getDownloadURL(storageRef);
}

/**
 * Delete a file from storage
 */
export async function deleteFile(path: string): Promise<void> {
  const storageRef = ref(storage, path);
  return deleteObject(storageRef);
}

/**
 * List all files in a directory
 */
export async function listFiles(path: string): Promise<ListResult> {
  const storageRef = ref(storage, path);
  return listAll(storageRef);
}

/**
 * Get file metadata
 */
export async function getFileMetadata(path: string): Promise<FullMetadata> {
  const storageRef = ref(storage, path);
  return getMetadata(storageRef);
}

/**
 * Update file metadata
 */
export async function updateFileMetadata(
  path: string,
  metadata: Partial<UploadMetadata>
): Promise<FullMetadata> {
  const storageRef = ref(storage, path);
  return updateMetadata(storageRef, metadata);
}

/**
 * Get a storage reference for advanced operations
 */
export function getStorageRef(path: string): StorageReference {
  return ref(storage, path);
}

// Re-export storage utilities for convenience
export { ref, getDownloadURL };
