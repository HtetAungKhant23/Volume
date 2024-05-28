#!/usr/bin/env node

import os from "node:os";
import https, { Agent } from "node:https";
import prompts from "prompts";
import {
  bufferToFile,
  fileToBuffer,
  isPathExists,
  safeJoin,
  updateBuffer,
} from "./util/common.js";

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

(async function modifyVolume(input: string, output: string, factor: string) {
  const buffer: Buffer = (await fileToBuffer(input)) as unknown as Buffer;
  await updateBuffer(buffer, factor);
  await bufferToFile(output, buffer);
})(INPUT_FILE_PATH, safeJoin(DOWNLOAD_DIR, "/output.mp3"), FACTOR);
