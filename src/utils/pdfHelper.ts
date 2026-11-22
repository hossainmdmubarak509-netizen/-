/**
 * Minimal dynamic PDF generator for simulated NID vouchers and official documents.
 * Produces genuine compliant PDF-1.4 files encoded as persistent base64 data URLs.
 */
export function generateSampleNidPdf(data: {
  serviceTitle: string;
  name?: string;
  nidNumber: string;
  dateOfBirth: string;
  upazila?: string;
  district?: string;
  trxId: string;
  deliveryDate: string;
}): { dataUrl: string; fileName: string; fileSize: string } {
  const safeName = (data.name || 'CITIZEN').replace(/[^\x20-\x7E]/g, ' ');
  const cleanNid = (data.nidNumber || '0000000000').replace(/[^\x20-\x7E]/g, '');
  const cleanDob = (data.dateOfBirth || 'N/A').replace(/[^\x20-\x7E]/g, '');
  const cleanService = data.serviceTitle.replace(/[^\x20-\x7E]/g, '').trim() || 'DIGITAL SERVICE';
  const fileName = `${data.serviceTitle.replace(/\s+/g, '_')}_${cleanNid || 'COPY'}.pdf`;

  // Standard compliant PDF header and text objects (ASCII safe)
  const title = `PEOPLE'S REPUBLIC OF BANGLADESH`;
  const subTitle = `ELECTION COMMISSION / NATIONAL ID SERVICES`;
  const line1 = `DOCUMENT TYPE: ${cleanService.toUpperCase()}`;
  const line2 = `NID NUMBER: ${cleanNid}`;
  const line3 = `NAME: ${safeName}`;
  const line4 = `DATE OF BIRTH: ${cleanDob}`;
  const line5 = `LOCATION: ${(data.upazila || 'N/A').replace(/[^\x20-\x7E]/g, '')}, ${(data.district || 'BANGLADESH').replace(/[^\x20-\x7E]/g, '')}`;
  const line6 = `TRANSACTION ID: ${data.trxId}`;
  const line7 = `DELIVERY TIMESTAMP: ${new Date().toISOString()}`;
  const line8 = `STATUS: OFFICIALLY VERIFIED AND PROCESSED`;

  const contentStream = `
BT
/F1 16 Tf
50 720 Td
(${title}) Tj
/F1 11 Tf
0 -22 Td
(${subTitle}) Tj
/F1 13 Tf
0 -30 Td
(${line1}) Tj
/F1 10 Tf
0 -25 Td
(${line2}) Tj
0 -18 Td
(${line3}) Tj
0 -18 Td
(${line4}) Tj
0 -18 Td
(${line5}) Tj
0 -18 Td
(${line6}) Tj
0 -18 Td
(${line7}) Tj
0 -24 Td
(${line8}) Tj
/F1 8 Tf
0 -40 Td
(This digital copy is authenticated by Bangladesh Telecom & Digital Services Portal.) Tj
ET
`;

  const streamLength = contentStream.length;

  const pdfData = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length ${streamLength} >>
stream
${contentStream}
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000227 00000 n 
0000000${(300 + streamLength).toString().padStart(3, '0')} 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
${450 + streamLength}
%%EOF`;

  const base64 = btoa(pdfData);
  const dataUrl = `data:application/pdf;base64,${base64}`;
  const sizeKb = (new Blob([pdfData]).size / 1024).toFixed(1);

  return {
    dataUrl,
    fileName,
    fileSize: `${sizeKb} KB`,
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function readFileAsDataUrl(file: File): Promise<{
  dataUrl: string;
  fileName: string;
  fileSize: string;
  fileType: string;
}> {
  return new Promise((resolve, reject) => {
    const maxBytes = 10 * 1024 * 1024; // 10MB max per file
    if (file.size > maxBytes) {
      reject(new Error(`"${file.name}" ফাইলটি ১০ MB-এর বেশি বড়। অনুগ্রহ করে ১০ MB-এর কম সাইজের ফাইল দিন।`));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve({
          dataUrl: reader.result,
          fileName: file.name,
          fileSize: formatFileSize(file.size),
          fileType: file.type || 'application/octet-stream',
        });
      } else {
        reject(new Error('ফাইল রিড করতে সমস্যা হয়েছে।'));
      }
    };
    reader.onerror = () => reject(new Error(`"${file.name}" ফাইলটি পড়া যায়নি। আবার চেষ্টা করুন।`));
    reader.onabort = () => reject(new Error('ফাইল আপলোড বাতিল হয়েছে।'));
    reader.readAsDataURL(file);
  });
}

/**
 * Triggers direct browser download of any data URL or blob reliably across desktop & mobile
 */
export function triggerFileDownload(dataUrl: string, fileName: string) {
  try {
    // Convert large data URLs to Blob URLs for more reliable Chrome/Android/iOS downloads
    if (dataUrl.startsWith('data:')) {
      const parts = dataUrl.split(',');
      const mimeMatch = parts[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
      const byteString = atob(parts[1]);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mime });
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
      return;
    }
  } catch {
    // Fallback to direct link below
  }

  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
