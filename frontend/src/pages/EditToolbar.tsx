import React from "react";
import { IconButton } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SaveIcon from '@mui/icons-material/Save';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';


interface EditToolbarProps {
  onUndo?: () => void;
  onRedo?: () => void;
  onSave?: () => void;
  onSaveNew?: () => void;
  onAdd?: () => void;
}

const EditToolbar: React.FC<EditToolbarProps> = ({
  onUndo,
  onRedo,
  onSave,
  onSaveNew,
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
      <IconButton onClick={onUndo}>
        <UndoIcon />
      </IconButton>
      <IconButton onClick={onRedo}>
        <RedoIcon />
      </IconButton>
      <IconButton onClick={onSave}>
        <SaveIcon />
      </IconButton>
      <IconButton onClick={onSaveNew}
      >
        <SaveAltIcon />
      </IconButton>
      <IconButton 
        type="button"
        onClick={onAdd}
      >
        <AddIcon />
      </IconButton>
    </div>
  );
};

export default EditToolbar;
