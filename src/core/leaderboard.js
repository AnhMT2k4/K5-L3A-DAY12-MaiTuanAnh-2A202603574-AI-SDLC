/**
 * Local Leaderboard Module — Đảo Đèn Lồng (Contract v1.3)
 */
import fs from 'fs';
import path from 'path';

export const LEADERBOARD_FILE = 'leaderboard.json';
export const NAME_REGEX = /^[A-Za-z0-9_]{3,12}$/;
export const MAX_ENTRIES = 10;

export function validateName(name) {
  return typeof name === 'string' && NAME_REGEX.test(name.trim());
}

export function loadLeaderboard(filePath = LEADERBOARD_FILE) {
  try {
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      if (Array.isArray(data.entries)) {
        return sortLeaderboard(data.entries);
      } else if (Array.isArray(data)) {
        return sortLeaderboard(data);
      }
    }
  } catch (err) {
    console.warn('Could not read leaderboard file:', err.message);
  }
  return [];
}

export function saveLeaderboard(entries, filePath = LEADERBOARD_FILE) {
  const sorted = sortLeaderboard(entries).slice(0, MAX_ENTRIES);
  const data = { entries: sorted };
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  return sorted;
}

export function sortLeaderboard(entries) {
  return [...entries].sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score; // Higher score first
    }
    // Ties broken by earlier achieved_at
    const timeA = new Date(a.achieved_at).getTime() || 0;
    const timeB = new Date(b.achieved_at).getTime() || 0;
    return timeA - timeB;
  });
}

export function addLeaderboardEntry({ name, score, nights_won, seed, filePath = LEADERBOARD_FILE }) {
  if (!validateName(name)) {
    throw new Error('Tên không hợp lệ. Phải có từ 3-12 ký tự [A-Za-z0-9_].');
  }

  const entries = loadLeaderboard(filePath);
  const newEntry = {
    name: name.trim(),
    score: Math.max(0, Math.floor(score || 0)),
    nights_won: Math.max(0, Math.min(3, Math.floor(nights_won || 0))),
    achieved_at: new Date().toISOString(),
    seed: Number(seed) || 0
  };

  entries.push(newEntry);
  return saveLeaderboard(entries, filePath);
}
