import { useDropzone } from 'react-dropzone';

export const FileUpload = ({ accept, onFileSelect, disabled }) => {
  const { getRootProps, getInputProps } = useDropzone({
    accept: accept || 'image/*,application/pdf',
    multiple: false,
    disabled: disabled, // Tambahkan disabled config
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0 && !disabled) { // Tambahkan pengecekan disabled
        onFileSelect(acceptedFiles[0]);
      }
    },
  });

  return (
    <div 
      {...getRootProps()} 
      className={`border-2 border-dashed rounded-md p-4 transition
        ${disabled 
          ? "bg-gray-100 cursor-not-allowed opacity-50" 
          : "cursor-pointer hover:bg-muted"}`}
    >
      <input {...getInputProps()} />
      <p className="text-center text-muted-foreground">
        {disabled ? "Upload dinonaktifkan" : "Drag & drop file di sini, atau klik untuk memilih"}
      </p>
    </div>
  );
};