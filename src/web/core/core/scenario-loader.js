import fs from 'fs';

export class FormatError extends Error {
  constructor(message) {
    super(message);
    this.name = 'FormatError';
  }
}

export function loadScenarioFile(filePath) {
  if (!filePath) return null;
  let raw;
  try {
    raw = fs.readFileSync(filePath, 'utf-8');
  } catch (err) {
    throw new FormatError(`Cannot read scenario file: ${err.message}`);
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    throw new FormatError(`Scenario JSON parse error: ${err.message}`);
  }

  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    throw new FormatError('Scenario must be a JSON object');
  }

  // Validate fields if present
  if (data.player !== undefined) {
    if (typeof data.player !== 'object' || data.player === null) {
      throw new FormatError('player in scenario must be an object');
    }
    if (data.player.pos !== undefined && (!Array.isArray(data.player.pos) || data.player.pos.length !== 3)) {
      throw new FormatError('player.pos must be an array of 3 numbers');
    }
  }

  if (data.motes !== undefined && !Array.isArray(data.motes)) {
    throw new FormatError('motes in scenario must be an array');
  }

  if (data.shades !== undefined && !Array.isArray(data.shades)) {
    throw new FormatError('shades in scenario must be an array');
  }

  if (data.lanterns !== undefined && !Array.isArray(data.lanterns)) {
    throw new FormatError('lanterns in scenario must be an array');
  }

  return data;
}

export function loadInputsFile(filePath) {
  if (!filePath) return { frames: [] };
  let raw;
  try {
    raw = fs.readFileSync(filePath, 'utf-8');
  } catch (err) {
    throw new FormatError(`Cannot read inputs file: ${err.message}`);
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    throw new FormatError(`Inputs JSON parse error: ${err.message}`);
  }

  if (typeof data !== 'object' || data === null || !Array.isArray(data.frames)) {
    throw new FormatError('Inputs file must contain a "frames" array');
  }

  // Check strictly increasing tick
  let lastTick = -1;
  for (let i = 0; i < data.frames.length; i++) {
    const f = data.frames[i];
    if (typeof f.tick !== 'number' || !Number.isInteger(f.tick) || f.tick <= lastTick) {
      throw new FormatError(`Frame tick at index ${i} (${f.tick}) must be an integer strictly greater than previous tick (${lastTick})`);
    }
    lastTick = f.tick;

    if (f.move !== undefined) {
      if (!Array.isArray(f.move) || f.move.length !== 2 || typeof f.move[0] !== 'number' || typeof f.move[1] !== 'number') {
        throw new FormatError(`Frame move at index ${i} must be [x, z] numbers`);
      }
    }
  }

  return data;
}
