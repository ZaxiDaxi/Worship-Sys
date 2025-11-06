import React from "react";
import Button, { ButtonProps } from "@mui/material/Button";
import MusicNoteIcon from "@mui/icons-material/MusicNote";

export interface GreenButtonProps extends ButtonProps {
  label?: string;
}

const GreenButton: React.FC<GreenButtonProps> = ({
  label = "Create",
  sx: sxProp,
  ...rest
}) => (
  <Button
    variant="contained"
    startIcon={<MusicNoteIcon />}
    sx={[
      {
        backgroundColor: "#2E7D32",
        color: "#FFFFFF",
        fontWeight: "bold",
        fontSize: { xs: "1.1rem", sm: "1rem", md: "1rem" },
        padding: { xs: "4px 8px", sm: "6px 8px", md: "6px 8px" },
        borderRadius: "8px",
        transition: "background-color 0.2s ease-in-out",
        boxShadow: "0px 4px 6px rgba(0,0,0,0.1)",
        marginTop: { xs: "2px", sm: "2px", md: "4px" },
        "&:hover": {
          backgroundColor: "#1B5E20",
          boxShadow: "0px 6px 8px rgba(0,0,0,0.15)",
        },
      },
      ...(Array.isArray(sxProp)
        ? sxProp
        : sxProp
        ? [sxProp]
        : []),
    ]}
    {...rest}
  >
    {label}
  </Button>
);

export default GreenButton;
