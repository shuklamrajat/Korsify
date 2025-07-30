import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { 
  Upload, 
  File, 
  X, 
  CheckCircle, 
  AlertCircle,
  FileText,
  Image as ImageIcon,
  Video
} from "lucide-react";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number;
  className?: string;
  multiple?: boolean;
  disabled?: boolean;
}

interface UploadedFile {
  file: File;
  status: 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

export default function FileUpload({
  onFileSelect,
  accept = ".pdf,.doc,.docx,.txt,.md",
  maxSize = 50 * 1024 * 1024, // 50MB
  className,
  multiple = false,
  disabled = false,
}: FileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      // Handle rejected files
      if (rejectedFiles.length > 0) {
        rejectedFiles.forEach((rejection) => {
          const error = rejection.errors[0];
          console.error("File rejected:", error.message);
        });
        return;
      }

      // Process accepted files
      acceptedFiles.forEach((file) => {
        const uploadedFile: UploadedFile = {
          file,
          status: 'uploading',
          progress: 0,
        };

        setUploadedFiles(prev => [...prev, uploadedFile]);

        // Simulate upload progress
        const interval = setInterval(() => {
          setUploadedFiles(prev => 
            prev.map(f => 
              f.file === file && f.status === 'uploading'
                ? { ...f, progress: Math.min(f.progress + 10, 100) }
                : f
            )
          );
        }, 100);

        // Complete upload after progress reaches 100%
        setTimeout(() => {
          clearInterval(interval);
          setUploadedFiles(prev => 
            prev.map(f => 
              f.file === file 
                ? { ...f, status: 'success', progress: 100 }
                : f
            )
          );
          onFileSelect(file);
        }, 1100);
      });
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
    },
    maxSize,
    multiple,
    disabled,
  });

  const removeFile = (fileToRemove: File) => {
    setUploadedFiles(prev => prev.filter(f => f.file !== fileToRemove));
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return <FileText className="w-8 h-8 text-red-500" />;
      case 'doc':
      case 'docx':
        return <FileText className="w-8 h-8 text-blue-500" />;
      case 'txt':
      case 'md':
        return <FileText className="w-8 h-8 text-gray-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <ImageIcon className="w-8 h-8 text-green-500" />;
      case 'mp4':
      case 'avi':
      case 'mov':
        return <Video className="w-8 h-8 text-purple-500" />;
      default:
        return <File className="w-8 h-8 text-gray-400" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={cn("space-y-4", className)}>
      <Card 
        {...getRootProps()} 
        className={cn(
          "border-2 border-dashed transition-colors cursor-pointer",
          isDragActive ? "border-primary bg-primary/5" : "border-gray-300 hover:border-gray-400",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <CardContent className="p-8 text-center">
          <input {...getInputProps()} />
          
          <div className="flex flex-col items-center space-y-4">
            <div className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center",
              isDragActive ? "bg-primary/10" : "bg-gray-100"
            )}>
              <Upload className={cn(
                "w-8 h-8",
                isDragActive ? "text-primary" : "text-gray-400"
              )} />
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {isDragActive ? "Drop your files here" : "Upload your documents"}
              </h3>
              <p className="text-gray-600 mb-4">
                Drag and drop files here, or click to browse
              </p>
              <div className="flex flex-wrap justify-center gap-2 mb-4">
                <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">PDF</span>
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">DOC</span>
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">DOCX</span>
                <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">TXT</span>
                <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">MD</span>
              </div>
              <p className="text-sm text-gray-500">
                Maximum file size: {formatFileSize(maxSize)}
              </p>
            </div>
            
            <Button variant="outline" type="button" disabled={disabled}>
              <Upload className="w-4 h-4 mr-2" />
              Choose Files
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* File Rejections */}
      {fileRejections.length > 0 && (
        <div className="space-y-2">
          {fileRejections.map(({ file, errors }) => (
            <Card key={file.name} className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <div className="flex-1">
                    <p className="font-medium text-red-900">{file.name}</p>
                    <p className="text-sm text-red-700">{errors[0]?.message}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          {uploadedFiles.map((uploadedFile, index) => (
            <Card key={index} className={cn(
              "border transition-colors",
              uploadedFile.status === 'success' ? "border-green-200 bg-green-50" :
              uploadedFile.status === 'error' ? "border-red-200 bg-red-50" :
              "border-blue-200 bg-blue-50"
            )}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  {getFileIcon(uploadedFile.file.name)}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-gray-900 truncate">
                        {uploadedFile.file.name}
                      </p>
                      <div className="flex items-center space-x-2">
                        {uploadedFile.status === 'success' && (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                        {uploadedFile.status === 'error' && (
                          <AlertCircle className="w-5 h-5 text-red-500" />
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(uploadedFile.file)}
                          className="p-1 h-auto"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                      <span>{formatFileSize(uploadedFile.file.size)}</span>
                      {uploadedFile.status === 'uploading' && (
                        <span>{uploadedFile.progress}%</span>
                      )}
                    </div>
                    
                    {uploadedFile.status === 'uploading' && (
                      <Progress value={uploadedFile.progress} className="h-2" />
                    )}
                    
                    {uploadedFile.status === 'error' && uploadedFile.error && (
                      <p className="text-sm text-red-600">{uploadedFile.error}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
