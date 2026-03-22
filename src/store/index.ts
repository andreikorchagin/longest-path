import { create } from "zustand";
import { createMapSlice, type MapSlice } from "./map-slice";
import { createRouteSlice, type RouteSlice } from "./route-slice";
import { createSettingsSlice, type SettingsSlice } from "./settings-slice";

export type StoreState = MapSlice & RouteSlice & SettingsSlice;

export const useStore = create<StoreState>()((...a) => ({
  ...createMapSlice(...a),
  ...createRouteSlice(...a),
  ...createSettingsSlice(...a),
}));
