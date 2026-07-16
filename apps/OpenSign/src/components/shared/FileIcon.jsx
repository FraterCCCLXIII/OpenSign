import { FileText } from "lucide-react";

const FileIcon = ({ className = "h-5 w-5", size }) => (
  <FileText
    className={`shrink-0 text-base-content/70 ${className}`}
    size={size}
    strokeWidth={1.75}
    aria-hidden="true"
  />
);

export default FileIcon;
