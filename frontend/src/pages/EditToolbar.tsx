// EditToolbar.tsx
import React from "react";
import { IconButton } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import ImageIcon from "@mui/icons-material/Image";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import AddIcon from "@mui/icons-material/Add";

interface EditToolbarProps {
  onSend?: () => void;
  onAddImage?: () => void;
  onCopy?: () => void;
  onComment?: () => void;
  onAdd?: () => void;
}

/**
 * A pill-shaped toolbar that is positioned at the bottom-center of the screen,
 * containing various action icons.
 */
const EditToolbar: React.FC<EditToolbarProps> = ({
  onSend,
  onAddImage,
  onCopy,
  onComment,
  onAdd,
}) => {
  return (
    <div
      className="
        fixed
        bottom-5
        left-1/2
        -translate-x-1/2
        flex
        items-center
        gap-3
        px-4
        py-2
        bg-white
        shadow-md
        rounded-full
        z-50
      "
    >
      <IconButton onClick={onSend}>
        <SendIcon />
      </IconButton>
      <IconButton onClick={onAddImage}>
        <ImageIcon />
      </IconButton>
      <IconButton onClick={onCopy}>
        <ContentCopyIcon />
      </IconButton>
      <IconButton onClick={onComment}>
        <ChatBubbleOutlineIcon />
      </IconButton>
      <IconButton onClick={onAdd}>
        <AddIcon />
      </IconButton>
    </div>
  );
};

export default EditToolbar;
