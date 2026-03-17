import { create } from "zustand";
import * as commands from "@/lib/commands";
import type { Category } from "@/types";

interface CategoryState {
  categories: Category[];
  selectedCategoryId: string | null;
  fetchCategories: () => Promise<void>;
  selectCategory: (id: string | null) => void;
  addCategory: (name: string, icon: string) => Promise<void>;
  removeCategory: (id: string) => Promise<void>;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  selectedCategoryId: null,

  fetchCategories: async () => {
    const categories = await commands.getCategories();
    set({ categories });
  },

  selectCategory: (id) => set({ selectedCategoryId: id }),

  addCategory: async (name, icon) => {
    await commands.createCategory(name, icon);
    await get().fetchCategories();
  },

  removeCategory: async (id) => {
    await commands.deleteCategory(id);
    const state = get();
    if (state.selectedCategoryId === id) {
      set({ selectedCategoryId: null });
    }
    await get().fetchCategories();
  },
}));
