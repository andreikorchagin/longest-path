import { create } from "zustand";
import { createMapSlice, type MapSlice } from "./map-slice";

export type StoreState = MapSlice;

export const useStore = create<StoreState>()((...a) => ({
  ...createMapSlice(...a),
}));
