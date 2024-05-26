#!/usr/bin/env node

import os from "node:os";
import https, { Agent } from "node:https";
import prompts from "prompts";
import * as fs from "fs";
import { isPathExists, mp3ToPCM, pcmToMP3, safeJoin } from "./util/common.js";

console.clear();

https.globalAgent = new Agent({ keepAlive: true });

const exitOnCancel = (state: any) => {
  if (state.aborted) process.nextTick(() => process.exit(0));
};

const { INPUT_FILE_PATH, DOWNLOAD_DIR, FACTOR } = await prompts([
  {
    type: "text",
    message: "Audio file path to modify volume",
    name: "INPUT_FILE_PATH",
    validate: async (v) => await isPathExists(v, "input"),
    onState: exitOnCancel,
  },
  {
    type: "text",
    message: "Download directory path",
    name: "DOWNLOAD_DIR",
    initial: safeJoin(os.homedir(), "Downloads"),
    validate: async (v) => await isPathExists(v, "download"),
    onState: exitOnCancel,
  },
  {
    type: "text",
    message: "Modify volume amount",
    name: "FACTOR",
    initial: 2.0,
    onState: exitOnCancel,
  },
]);

const pcmFilePath: string = "src/buffer.pcm";

(async function modifyVolume(input: string, output: string, factor: number) {
  await mp3ToPCM(input, pcmFilePath);
  console.clear();

  fs.readFile(pcmFilePath, (err: any, data: Buffer) => {
    if (err) {
      console.error("Error reading PCM file:", err);
      return;
    }

    for (let i = 0; i < data.length; i += 2) {
      let sample = data.readInt16LE(i);
      sample = Math.max(Math.min(sample * factor, 32767), -32768);
      data.writeInt16LE(sample, i);
    }

    fs.writeFile(pcmFilePath, data, async (err: any) => {
      if (err) {
        console.error("Error writing PCM file:", err);
        return;
      }

      await pcmToMP3(pcmFilePath, output);
      console.clear();
      console.log("Finished✅");
    });
  });
})(INPUT_FILE_PATH, safeJoin(DOWNLOAD_DIR, "/output.mp3"), FACTOR);
