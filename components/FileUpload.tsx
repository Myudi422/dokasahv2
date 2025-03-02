import { useDropzone } from 'react-dropzone';

export const FileUpload = ({ accept, onFileSelect }) => {
  const { getRootProps, getInputProps } = useDropzone({
    accept: accept || 'image/*',
    multiple: false,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
  });

  return (
    <div 
      {...getRootProps()} 
      className="border-2 border-dashed rounded-md p-4 cursor-pointer hover:bg-muted transition"
    >
      <input {...getInputProps()} />
      <p className="text-center text-muted-foreground">
        Drag & drop file di sini, atau klik untuk memilih
      </p>
    </div>
  );
};