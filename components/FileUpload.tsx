"use client";
import { useState } from 'react';

export const FileUpload = ({ accept, onFileSelect, className, formConfig }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // 1. Dapatkan presigned URL dari backend
      const presignedRes = await fetch(
        'https://improved-lamp-vq6j9gjvjpxfp6jx-3001.app.github.dev/api/files/presigned-url',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type
          })
        }
      );

      if (!presignedRes.ok) {
        throw new Error('Gagal mendapatkan URL upload');
      }

      const { presignedUrl, fields, fileId, fileUrl } = await presignedRes.json();

      // 2. Siapkan form data untuk upload
      const formData = new FormData();
      Object.entries(fields).forEach(([key, value]) => {
        formData.append(key, value);
      });
      formData.append('file', file);

      // 3. Lakukan upload ke B2
      const xhr = new XMLHttpRequest();
      xhr.open('POST', presignedUrl);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      };

      xhr.onload = async () => {
        if (xhr.status === 204) {
          // 4. Konfirmasi ke backend
          await fetch(
            'https://improved-lamp-vq6j9gjvjpxfp6jx-3001.app.github.dev/api/files/confirm-upload',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              body: JSON.stringify({
                fileId,
                formId: formConfig.id
              })
            }
          );

          // 5. Update form data
          onFileSelect(fileUrl);
        } else {
          throw new Error('Upload gagal');
        }
      };

      xhr.onerror = () => {
        throw new Error('Error dalam upload');
      };

      xhr.send(formData);

    } catch (error) {
      console.error('Upload error:', error);
      alert(`Gagal upload: ${error.message}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <input
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="w-full p-2 border rounded"
        disabled={isUploading}
      />
      
      {isUploading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center p-2">
          <span className="text-white mb-2">Mengunggah... {uploadProgress}%</span>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};