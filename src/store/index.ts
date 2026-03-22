import { create } from "zustand";
import { createMapSlice, type MapSlice } from "./map-slice";
import { createRouteSlice, type RouteSlice } from "./route-slice";

export type StoreState = MapSlice & RouteSlice;

export const useStore = create<StoreState>()((...a) => ({
  ...createMapSlice(...a),
  ...createRouteSlice(...a),
}));
