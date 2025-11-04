import React from 'react';
import { FaSpinner, FaCheckCircle, FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import Image from 'next/image';

interface FileUploadProgressProps {
  fileName: string;
  progress: number;
  thumbnailUrl: string;
  onRemove: () => void;
  isUploading: boolean;
  error: string | null;
}

const FileUploadProgress: React.FC<FileUploadProgressProps> = ({
  fileName,
  progress,
  thumbnailUrl,
  onRemove,
  isUploading,
  error,
}) => {
  const isComplete = progress === 100 && !isUploading && error === null;
  const isError = error !== null;

  return (
    <div className="flex items-center space-x-4 p-3 border border-gray-700 rounded-lg bg-gray-800 text-gray-200">
      <div className="relative w-16 h-16 flex-shrink-0">
        {thumbnailUrl ? (
          <Image
            src={thumbnailUrl}
            alt="Thumbnail"
            layout="fill"
            objectFit="cover"
            className="rounded"
          />
        ) : (
          <div className="w-full h-full bg-gray-700 rounded flex items-center justify-center text-xs text-gray-400">
            No Preview
          </div>
        )}
      </div>

      <div className="flex-grow">
        <p className="text-sm font-medium truncate">{fileName}</p>
        <div className="w-full bg-gray-700 rounded-full h-2.5 mt-1">
          <div
            className={`h-2.5 rounded-full ${isError ? 'bg-red-500' : isComplete ? 'bg-green-500' : 'bg-blue-500'}`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          {isError ? (
            <span className="text-red-400 flex items-center">
              <FaExclamationTriangle className="mr-1" /> Error
            </span>
          ) : isUploading ? (
            <span className="flex items-center">
              <FaSpinner className="animate-spin mr-1" /> Uploading ({progress.toFixed(0)}%)
            </span>
          ) : isComplete ? (
            <span className="text-green-400 flex items-center">
              <FaCheckCircle className="mr-1" /> Complete
            </span>
          ) : (
            <span>{progress.toFixed(0)}%</span>
          )}
        </div>
        {isError && <p className="text-red-400 text-xs mt-1">{error}</p>}
      </div>

      <button
        onClick={onRemove}
        className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 p-1"
        title="Remove file"
      >
        <FaTimes className="h-4 w-4" />
      </button>
    </div>
  );
};

export default FileUploadProgress;