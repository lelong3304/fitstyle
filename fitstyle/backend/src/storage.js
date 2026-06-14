import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { connectDatabase, hasMongoConfig } from "./db.js";
import { Analysis } from "./models/Analysis.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(currentDir, "..", "data");
const historyFile = path.join(dataDir, "analyses.json");

async function ensureDataFile() {
  await mkdir(dataDir, { recursive: true });

  try {
    await readFile(historyFile, "utf8");
  } catch {
    await writeFile(historyFile, "[]", "utf8");
  }
}

async function readHistory() {
  await ensureDataFile();
  const content = await readFile(historyFile, "utf8");

  try {
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeHistory(records) {
  await ensureDataFile();
  await writeFile(historyFile, JSON.stringify(records, null, 2), "utf8");
}

export async function saveAnalysis({ profile, result, photo, user }) {
  if (hasMongoConfig()) {
    await connectDatabase();
    const record = await Analysis.create({
      userId: user?.id || null,
      profile: {
        age: profile.age,
        gender: profile.gender,
        heightCm: profile.heightCm,
        weightKg: profile.weightKg,
        neckCm: profile.neckCm || "",
        chestCm: profile.chestCm || "",
        waistCm: profile.waistCm || "",
        hipCm: profile.hipCm || "",
        activityLevel: profile.activityLevel,
        goal: profile.goal
      },
      photo: photo
        ? {
            received: true,
            filename: photo.originalname
          }
        : {
            received: false,
            filename: ""
          },
      result
    });

    return normalizeMongoRecord(record);
  }

  const records = await readHistory();
  const record = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    userId: user?.id || null,
    profile: {
      age: profile.age,
      gender: profile.gender,
      heightCm: profile.heightCm,
      weightKg: profile.weightKg,
      neckCm: profile.neckCm || "",
      chestCm: profile.chestCm || "",
      waistCm: profile.waistCm || "",
      hipCm: profile.hipCm || "",
      activityLevel: profile.activityLevel,
      goal: profile.goal
    },
    photo: photo
      ? {
          received: true,
          filename: photo.originalname
        }
      : {
          received: false,
          filename: ""
        },
    result
  };

  const nextRecords = [record, ...records].slice(0, 50);
  await writeHistory(nextRecords);
  return record;
}

export async function listAnalyses({ user } = {}) {
  if (hasMongoConfig()) {
    await connectDatabase();
    const filter = user?.role === "admin" ? {} : { userId: user?.id || null };
    const records = await Analysis.find(filter).sort({ createdAt: -1 }).limit(50).lean();
    return records.map((record) => toHistorySummary(normalizeMongoRecord(record)));
  }

  const records = await readHistory();
  const filtered = user?.role === "admin" ? records : records.filter((record) => record.userId === user?.id);
  return filtered.map((record) => toHistorySummary(record));
}

export async function getAnalysis(id, { user } = {}) {
  if (hasMongoConfig()) {
    await connectDatabase();
    const record = await Analysis.findById(id).lean();
    if (!record) return null;
    const normalized = normalizeMongoRecord(record);
    if (user?.role !== "admin" && normalized.userId !== user?.id) return null;
    return normalized;
  }

  const records = await readHistory();
  const record = records.find((item) => item.id === id) || null;
  if (!record) return null;
  if (user?.role !== "admin" && record.userId !== user?.id) return null;
  return record;
}

function normalizeMongoRecord(record) {
  return {
    id: record._id.toString(),
    userId: record.userId ? record.userId.toString() : null,
    createdAt: record.createdAt instanceof Date ? record.createdAt.toISOString() : record.createdAt,
    profile: record.profile,
    photo: record.photo,
    result: record.result
  };
}

function toHistorySummary(record) {
  return {
    id: record.id,
    createdAt: record.createdAt,
    profile: record.profile,
    photo: record.photo,
    summary: {
      bmi: record.result?.metrics?.bmi,
      bodyShape: record.result?.metrics?.bodyShape?.label,
      bodyShapeKey: record.result?.metrics?.bodyShape?.key,
      bodyFat: record.result?.metrics?.bodyFat?.percent || null,
      outfitScore: record.result?.vision?.outfitFit?.score ?? null,
      direction: record.result?.health?.direction
    }
  };
}
