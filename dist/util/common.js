import os from "node:os";
import fs from "node:fs/promises";
import { join } from "node:path";
import { execSync } from "child_process";
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
export const mp3ToPCM = async (mp3Path, pcmPath) => {
    try {
        execSync(`lame --decode ${mp3Path} ${pcmPath}`);
    }
    catch (error) {
        console.error("Error decoding MP3 to PCM:", error);
        return;
    }
};
export const pcmToMP3 = async (pcmPath, mp3Path) => {
    try {
        execSync(`lame -r -s 44.1 -b 192 ${pcmPath} ${mp3Path}`);
    }
    catch (error) {
        console.error("Error encoding PCM to MP3:", error);
        return;
    }
};
