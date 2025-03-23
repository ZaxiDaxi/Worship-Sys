// SelectableSongCard.tsx
import React from "react";
import { Card } from "@/components/ui/card";

interface Song {
  id: number;
  title: string;
  artist: string;
  image_url: string;
  key?: string;
  tempo?: string;
  time_signature?: string;
}

interface SelectableSongCardProps {
  song: Song;
  isSelected: boolean;
  onSelect: (songId: number) => void;
}

const SelectableSongCard: React.FC<SelectableSongCardProps> = ({ song, isSelected, onSelect }) => {
  return (
    <Card
      className={`p-4 cursor-pointer ${isSelected ? "border-4 border-blue-500" : "hover:bg-gray-50"}`}
      onClick={() => onSelect(song.id)}
    >
      <div className="flex items-center space-x-4">
        <img
          src={song.image_url || "https://via.placeholder.com/50"}
          alt={song.title}
          className="w-12 h-12 rounded-full object-cover"
        />
        <div>
          <h3 className="font-semibold">{song.title}</h3>
          <p className="text-gray-600">{song.artist}</p>
        </div>
      </div>
    </Card>
  );
};

export default SelectableSongCard;
