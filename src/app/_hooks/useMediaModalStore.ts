import { create } from "zustand";
import { type MediaItem } from "../_components/MediaCarousel";

interface MediaModalState {
  isOpen: boolean;
  mediaList: MediaItem[];
  initialIndex: number;
  open: (mediaList: MediaItem[], initialIndex?: number) => void;
  close: () => void;
}

export const useMediaModalStore = create<MediaModalState>((set) => ({
  isOpen: false,
  mediaList: [],
  initialIndex: 0,
  open: (mediaList, initialIndex = 0) =>
    set({ isOpen: true, mediaList, initialIndex }),
  close: () => set({ isOpen: false }),
}));
