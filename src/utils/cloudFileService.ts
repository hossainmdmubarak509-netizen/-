import { collection, doc, getDocs, limit, query, setDoc, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { saveFileBlob, getAllFileBlobs } from './fileStorage';
import { triggerFileDownload } from './pdfHelper';

const CHUNK_SIZE = 550000; // Safe under Firestore 1MB per document limit

export interface PortalFileChunkDoc {
  id: string;
  fileId: string;
  chunkIndex: number;
  totalChunks: number;
  fileName: string;
  fileSize?: string;
  fileType?: string;
  chunkData: string;
  createdAt: string;
}

/**
 * Splits a base64 DataURL into safe <=550KB chunks and uploads them to Firestore `portal_files`,
 * while also caching locally in IndexedDB for instant repeat access.
 */
export async function uploadCloudFile(params: {
  fileId: string;
  fileName: string;
  fileSize?: string;
  fileType?: string;
  dataUrl: string;
}): Promise<void> {
  const { fileId, fileName, fileSize, fileType, dataUrl } = params;
  if (!dataUrl) return;

  await saveFileBlob(fileId, dataUrl);

  const totalChunks = Math.max(1, Math.ceil(dataUrl.length / CHUNK_SIZE));
  if (totalChunks > 30) {
    throw new Error(`"${fileName}" ফাইলটি অনেক বড়। অনুগ্রহ করে ১০ MB-এর কম সাইজের ফাইল আপলোড করুন।`);
  }

  const createdAt = new Date().toISOString();
  for (let i = 0; i < totalChunks; i++) {
    const chunkData = dataUrl.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
    const chunkId = `${fileId}_chunk_${i}`;
    const docPayload: PortalFileChunkDoc = {
      id: chunkId,
      fileId,
      chunkIndex: i,
      totalChunks,
      fileName: fileName.slice(0, 255),
      fileSize: fileSize || '',
      fileType: fileType || 'application/octet-stream',
      chunkData,
      createdAt,
    };

    try {
      await setDoc(doc(db, 'portal_files', chunkId), docPayload);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `portal_files/${chunkId}`);
    }
  }
}

/**
 * Fetches chunked file data from Firestore (or IndexedDB cache) and reassembles full DataURL.
 */
export async function fetchCloudFileDataUrl(fileId: string): Promise<string | null> {
  if (!fileId) return null;

  const localBlobs = await getAllFileBlobs();
  if (localBlobs[fileId]) {
    return localBlobs[fileId];
  }

  try {
    const q = query(collection(db, 'portal_files'), where('fileId', '==', fileId), limit(50));
    const snap = await getDocs(q);
    if (snap.empty) return null;

    const chunks = snap.docs
      .map((d) => d.data() as PortalFileChunkDoc)
      .sort((a, b) => a.chunkIndex - b.chunkIndex);

    const reassembled = chunks.map((c) => c.chunkData).join('');
    if (reassembled) {
      await saveFileBlob(fileId, reassembled);
    }
    return reassembled || null;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `portal_files?fileId=${fileId}`);
  }
}

/**
 * Unified download handler that works across devices via Firestore cloud chunks or inline DataURL.
 */
export async function downloadOrderFile(options: {
  fileId?: string;
  fileName: string;
  dataUrl?: string;
  fallbackUrl?: string;
}): Promise<boolean> {
  const { fileId, fileName, dataUrl, fallbackUrl } = options;

  if (dataUrl && dataUrl.length > 0) {
    triggerFileDownload(dataUrl, fileName);
    return true;
  }

  if (fileId) {
    const cloudDataUrl = await fetchCloudFileDataUrl(fileId);
    if (cloudDataUrl) {
      triggerFileDownload(cloudDataUrl, fileName);
      return true;
    }
  }

  if (fallbackUrl && fallbackUrl !== '#') {
    const link = document.createElement('a');
    link.href = fallbackUrl;
    link.download = fileName;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  }

  return false;
}
