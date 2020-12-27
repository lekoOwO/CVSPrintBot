import { createReadStream } from 'fs';
import * as path from 'path';

export function getFileFromPath(filepath) {
    return {
        name: path.basename(filepath),
        file: createReadStream(filepath)
    }
}

export function getFileFromStream(stream, filename) {
    return {
        name: path.basename(filename || stream.path),
        file: stream
    }
}