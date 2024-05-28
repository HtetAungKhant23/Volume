import os from "node:os";
import fs from "node:fs/promises";
import { join } from "node:path";
import { Lame } from "../../node_modules/node-lame/index.js";
export const isPathExists = async (path, type) => {
    try {
        if (type === "input") {
            const splittedPath = path.split(".");
            if (splittedPath[splittedPath.length - 1] !== "mp3") {
                console.warn(" => In this version, we can service for mp3 format only!");
                return false;
            }
        }
        await fs.access(path);
        return true;
    }
    catch {
        return false;
    }
};
export const safeJoin = (...path) => {
    const regex = os.platform() === "win32" ? /[\/\\:*?"<>|]/g : /(\/|\\|:)/g;
    path[path.length - 1] = path[path.length - 1].replace(regex, "");
    return join(...path);
};
export const fileToBuffer = async (file) => {
    const decoder = new Lame({
        output: "buffer",
    }).setFile(file);
    return await decoder
        .decode()
        .then(() => {
        const buffer = decoder.getBuffer();
        return buffer;
    })
        .catch((error) => {
        console.log("decode err", error);
    });
};
export const bufferToFile = async (outputFilePath, buffer) => {
    const encoder = new Lame({
        output: outputFilePath,
        raw: true,
        bitrate: 192,
        resample: 44.1,
    }).setBuffer(buffer);
    await encoder
        .encode()
        .then(() => {
        console.log("Finished✅");
    })
        .catch((error) => {
        console.log("encode err", error);
    });
};
export const updateBuffer = async (buffer, factor) => {
    for (let i = 0; i < buffer.length; i += 2) {
        let sample = buffer.readInt16LE(i);
        sample = Math.max(Math.min(sample * parseFloat(factor), 32767), -32768);
        buffer.writeInt16LE(sample, i);
    }
};
