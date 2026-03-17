import { create } from "zustand";
import * as commands from "@/lib/commands";
import type { Project } from "@/types";

interface ProjectState {
  projects: Project[];
  selectedProjectId: string | null;
  fetchProjects: () => Promise<void>;
  selectProject: (id: string | null) => void;
  addProject: (name: string, color: string) => Promise<void>;
  removeProject: (id: string) => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  selectedProjectId: null,

  fetchProjects: async () => {
    const projects = await commands.getProjects();
    set({ projects });
  },

  selectProject: (id) => set({ selectedProjectId: id }),

  addProject: async (name, color) => {
    await commands.createProject(name, color);
    await get().fetchProjects();
  },

  removeProject: async (id) => {
    await commands.deleteProject(id);
    const state = get();
    if (state.selectedProjectId === id) {
      set({ selectedProjectId: null });
    }
    await get().fetchProjects();
  },
}));
