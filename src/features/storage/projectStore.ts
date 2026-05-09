import { openDB, type DBSchema } from "idb";
import type { AnalysisResult } from "../analysis/types";
import type { ResearchPaper } from "../library/types";
import { createProjectState, parseProjectState, type ProjectState } from "./projectState";
import { defaultSettings, type AppSettings } from "./settingsStore";

const dbName = "research-flow";
const storeName = "projects";
const latestKey = "latest";

export interface StoredProject {
  schemaVersion: 2;
  appVersion: string;
  papers: ResearchPaper[];
  analysis?: AnalysisResult;
  settings: AppSettings;
  exportedAt: string;
  updatedAt: string;
}

export async function saveLatestProject(project: {
  appVersion: string;
  papers: ResearchPaper[];
  analysis?: AnalysisResult;
  settings?: AppSettings;
}) {
  const db = await database();
  const payload = createProjectState(project);
  await db.put(storeName, payload, latestKey);
  return payload;
}

export async function loadLatestProject() {
  const db = await database();
  const record = await db.get(storeName, latestKey);
  if (!record) return undefined;
  return parseProjectState(record);
}

export async function clearLatestProject() {
  const db = await database();
  await db.delete(storeName, latestKey);
}

async function database() {
  return openDB<ProjectDatabase>(dbName, 2, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(storeName)) db.createObjectStore(storeName);
    }
  });
}

interface ProjectDatabase extends DBSchema {
  projects: {
    key: string;
    value: ProjectState;
  };
}

export function emptyProject(appVersion: string): ProjectState {
  return createProjectState({
    appVersion,
    papers: [],
    settings: defaultSettings
  });
}
