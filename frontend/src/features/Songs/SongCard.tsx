import React from "react";
import { Card } from "@/components/ui/card";
import { Edit, Trash2 } from "lucide-react";

interface Song {
  id: number;
  title: string;
  artist: string;
  key?: string;
  tempo?: string;
  time_signature?: string;
}

interface SongCardProps {
  song: Song;
  onEdit: (songId: number) => void;
  onDelete: (songId: number) => void;
  onClick: (songId: number) => void;
}

const SongCard: React.FC<SongCardProps> = ({ song, onEdit, onDelete, onClick }) => {
  return (
    <Card
      className="p-4 flex justify-between items-center hover:bg-gray-50 cursor-pointer bg-white"
      onClick={() => onClick(song.id)}
    >
      <div className="flex items-center space-x-4 min-w-0">
        <div className="min-w-0">
          <h3 className="font-semibold truncate">{song.title}</h3>
          <p className="text-gray-600 truncate">{song.artist}</p>
          {(song.key || song.tempo) && (
            <p className="text-gray-500 text-sm mt-1">
              {song.key && <span>Key: {song.key}</span>}
              {song.key && song.tempo && " | "}
              {song.tempo && <span>Tempo: {song.tempo}</span>}
            </p>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <button
          className="text-blue-500 hover:text-blue-700 p-2 rounded-lg"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(song.id);
          }}
        >
          <Edit className="h-5 w-5" />
        </button>
        <button
          className="text-red-500 hover:text-red-700 p-2 rounded-lg"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(song.id);
          }}
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>
    </Card>
  );
};

export default SongCard;
