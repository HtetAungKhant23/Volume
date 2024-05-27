#!/usr/bin/env node
import os from "node:os";
import https, { Agent } from "node:https";
import prompts from "prompts";
import * as fs from "fs";
import { isPathExists, mp3ToPCM, pcmToMP3, safeJoin } from "./util/common.js";
import { fileURLToPath } from "url";
import { dirname } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
https.globalAgent = new Agent({ keepAlive: true });
const exitOnCancel = (state) => {
    if (state.aborted)
        process.nextTick(() => process.exit(0));
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
const pcmFilePath = `${__dirname}/buffer.pcm`;
(async function modifyVolume(input, output, factor) {
    await mp3ToPCM(input, pcmFilePath);
    fs.readFile(pcmFilePath, (err, data) => {
        if (err) {
            console.error("Error reading PCM file:", err);
            return;
        }
        console.log("before buffer", data);
        for (let i = 0; i < data.length; i += 2) {
            let sample = data.readInt16LE(i);
            sample = Math.max(Math.min(sample * factor, 32767), -32768);
            data.writeInt16LE(sample, i);
        }
        console.log("\nafter buffer ", data);
        fs.writeFile(pcmFilePath, data, async (err) => {
            if (err) {
                console.error("Error writing PCM file:", err);
                return;
            }
            console.log("output path ", output);
            await pcmToMP3(pcmFilePath, output);
            console.log("Finished✅");
        });
    });
})(INPUT_FILE_PATH, safeJoin(DOWNLOAD_DIR, "/output.mp3"), FACTOR);
