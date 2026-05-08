import { openDB } from "idb";
import { z } from "zod";
import type { AnalysisResult } from "../analysis/types";
import type { ResearchPaper } from "../library/types";

const dbName = "research-flow";
const storeName = "projects";
const latestKey = "latest";

export interface StoredProject {
  schemaVersion: 1;
  papers: ResearchPaper[];
  analysis?: AnalysisResult;
  updatedAt: string;
}

const storedProjectSchema = z.object({
  schemaVersion: z.literal(1),
  papers: z.array(z.any()),
  analysis: z.any().optional(),
  updatedAt: z.string()
});

export async function saveLatestProject(
  project: Omit<StoredProject, "schemaVersion" | "updatedAt">
) {
  const db = await database();
  const payload: StoredProject = {
    schemaVersion: 1,
    ...project,
    updatedAt: new Date().toISOString()
  };
  await db.put(storeName, payload, latestKey);
  return payload;
}

export async function loadLatestProject() {
  const db = await database();
  const record = await db.get(storeName, latestKey);
  const parsed = storedProjectSchema.safeParse(record);
  return parsed.success ? (parsed.data as StoredProject) : undefined;
}

export async function clearLatestProject() {
  const db = await database();
  await db.delete(storeName, latestKey);
}

async function database() {
  return openDB(dbName, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(storeName)) db.createObjectStore(storeName);
    }
  });
}
