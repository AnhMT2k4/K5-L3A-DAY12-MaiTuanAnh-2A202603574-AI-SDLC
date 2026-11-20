#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { GameSimulation } from '../core/simulation.js';
import { loadScenarioFile, loadInputsFile, FormatError } from '../core/scenario-loader.js';
import { DEFAULT_TUNING } from '../core/constants.js';

function parseArgs(args) {
  const options = {
    seed: 12345,
    night: 1,
    scenarioPath: null,
    inputsPath: null,
    ticks: null,
    outPath: null,
    snapshotEvery: 10
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--seed' && i + 1 < args.length) {
      options.seed = parseInt(args[++i], 10);
      if (isNaN(options.seed)) throw new FormatError('Invalid --seed value');
    } else if (arg === '--night' && i + 1 < args.length) {
      options.night = parseInt(args[++i], 10);
    } else if (arg === '--scenario' && i + 1 < args.length) {
      options.scenarioPath = args[++i];
    } else if (arg === '--inputs' && i + 1 < args.length) {
      options.inputsPath = args[++i];
    } else if (arg === '--ticks' && i + 1 < args.length) {
      options.ticks = parseInt(args[++i], 10);
      if (isNaN(options.ticks) || options.ticks < 0) throw new FormatError('Invalid --ticks value');
    } else if (arg === '--out' && i + 1 < args.length) {
      options.outPath = args[++i];
    } else if (arg === '--snapshot-every' && i + 1 < args.length) {
      options.snapshotEvery = parseInt(args[++i], 10);
      if (isNaN(options.snapshotEvery) || options.snapshotEvery <= 0) {
        throw new FormatError('Invalid --snapshot-every value');
      }
    }
  }

  if (options.ticks === null) {
    throw new FormatError('Missing required parameter: --ticks');
  }
  if (!options.outPath) {
    throw new FormatError('Missing required parameter: --out');
  }

  return options;
}

function main() {
  let opts;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (err) {
    if (err instanceof FormatError) {
      console.error(err.message);
      process.exit(2);
    }
    console.error(`Argument error: ${err.message}`);
    process.exit(1);
  }

  let scenario = null;
  let inputs = { frames: [] };

  try {
    if (opts.scenarioPath) {
      scenario = loadScenarioFile(opts.scenarioPath);
    }
    if (opts.inputsPath) {
      inputs = loadInputsFile(opts.inputsPath);
    }
  } catch (err) {
    if (err instanceof FormatError) {
      console.error(`Format error: ${err.message}`);
      process.exit(2);
    }
    console.error(`Read error: ${err.message}`);
    process.exit(1);
  }

  try {
    // Read tuning from game.contract.json if exists at root
    let tuning = DEFAULT_TUNING;
    const contractPath = path.resolve('game.contract.json');
    if (fs.existsSync(contractPath)) {
      try {
        const contractData = JSON.parse(fs.readFileSync(contractPath, 'utf-8'));
        if (contractData && contractData.tuning) {
          tuning = { ...DEFAULT_TUNING, ...contractData.tuning };
        }
      } catch (e) {
        // Fallback to default
      }
    }

    const sim = new GameSimulation({
      seed: opts.seed,
      night: opts.night,
      tuning,
      scenario,
      inputs
    });

    const lines = [];

    // Snapshot tick 0
    lines.push(JSON.stringify(sim.getSnapshot()));

    let stepsRun = 0;
    while (stepsRun < opts.ticks && sim.state !== 'won' && sim.state !== 'lost') {
      const events = sim.step();
      stepsRun++;

      // Write events
      for (const ev of events) {
        lines.push(JSON.stringify(ev));
      }

      // Snapshot if tick % snapshotEvery === 0
      if (sim.tick % opts.snapshotEvery === 0) {
        lines.push(JSON.stringify(sim.getSnapshot()));
      }
    }

    // End line
    const endObj = {
      type: 'end',
      ticks: stepsRun,
      state: sim.state,
      score: sim.score
    };
    lines.push(JSON.stringify(endObj));

    // Ensure output directory exists
    const outDir = path.dirname(path.resolve(opts.outPath));
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    fs.writeFileSync(opts.outPath, lines.join('\n') + '\n', 'utf-8');
    process.exit(0);
  } catch (err) {
    console.error(`Simulation error: ${err.message}`);
    process.exit(1);
  }
}

main();
