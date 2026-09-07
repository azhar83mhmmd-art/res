import { Request, Response } from 'express';
import os from 'os';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
// @ts-ignore - paket resmi File-Kiwi, lihat catatan di package.json
import { createWebFolder, startUpload } from '@file-kiwi/node';
import { fetchSourceBuffer, getSourceUrl } from './_shared';

export default async function filekiwiHandler(req: Request, res: Response) {
    const sourceUrl = getSourceUrl(req);

    if (!sourceUrl) {
        return res.status(400).json({ status: false, message: "Parameter 'url' diperlukan." });
    }

    const { buffer, filename } = await fetchSourceBuffer(sourceUrl);

    // @file-kiwi/node butuh path file di disk, jadi file sumber ditulis
    // sementara ke folder temp OS lalu dihapus lagi setelah upload selesai.
    const tmpPath = path.join(os.tmpdir(), `kairoo-filekiwi-${crypto.randomUUID()}-${filename}`);
    fs.writeFileSync(tmpPath, buffer);

    try {
        const webfolder = await createWebFolder({
            title: 'Kairoo Upload',
            files: [{ filepath: tmpPath }]
        });

        await startUpload(webfolder);

        return res.json({
            status: true,
            input: sourceUrl,
            result_url: webfolder.webfolderUrl
        });
    } finally {
        fs.unlink(tmpPath, () => {});
    }
}
