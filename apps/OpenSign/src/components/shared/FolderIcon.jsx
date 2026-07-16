import { Folder } from "lucide-react";

const FolderIcon = ({ className = "h-5 w-5", size }) => (
  <Folder
    className={`shrink-0 text-base-content/70 ${className}`}
    size={size}
    strokeWidth={1.75}
    aria-hidden="true"
  />
);

export default FolderIcon;
