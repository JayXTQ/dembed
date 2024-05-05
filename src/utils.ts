import sharp from "sharp";
import axios from "axios";
import { ElementHandle } from "puppeteer";
import { Context } from "hono";

export function extractText(html: string): string {
    html = html
        .replace(/<br>/g, "\n")
        .replace(/<br\/>/g, "\n")
        .replace(/<br \/>/g, "\n");
    html = html.replace(/<[^>]*>/g, "");
    const splitLines = html.split("\n");
    for (const line of splitLines) {
        if (line.startsWith('"') || line.startsWith(" "))
            splitLines[splitLines.indexOf(line)].slice(1);
        if (line.endsWith('"') || line.endsWith(" "))
            splitLines[splitLines.indexOf(line)].slice(0, -1);
    }
    html = splitLines.join("\n");
    if (html.length >= 300) html = html.slice(0, 300) + "...";
    return html;
}

// export function setSecurityHeaders(c: Context) {
//     c.header("Content-Security-Policy", "script-src 'self'");
//     c.header(
//         "Strict-Transport-Security",
//         "max-age=31536000; includeSubDomains",
//     );
//     c.header("X-Content-Type-Options", "nosniff");
//     c.header("X-Frame-Options", "SAMEORIGIN");
//     c.header("X-XSS-Protection", "1; mode=block");
//     c.header("Referrer-Policy", "no-referrer");
//     c.header(
//         "Feature-Policy",
//         "geolocation 'none'; microphone 'none'; camera 'none'",
//     );
//     c.header(
//         "Permissions-Policy",
//         "geolocation=(), microphone=(), camera=()",
//     );
// }

export async function gridImages(images: Buffer[]): Promise<Buffer> {
    const targetHeight = images.length > 2 ? 1000 : 500;
    let compositeImage = sharp({
        create: {
            width: 1000,
            height: targetHeight,
            channels: 4,
            background: { r: 255, g: 255, b: 255, alpha: 1 },
        },
    });

    const imageComposites = await Promise.all(
        images.map(async (buffer, index) => {
            const targetWidth = 500;
            const resizedBuffer = await sharp(buffer)
                .resize(targetWidth)
                .toBuffer();
            const row = Math.floor(index / 2);
            const col = index % 2;
            const x = col * targetWidth;
            const y = row * (targetHeight / 2);

            return {
                input: resizedBuffer,
                left: x,
                top: y,
            };
        })
    );

    // Composite the images onto the initial blank canvas
    const finalImageBuffer = await compositeImage
        .composite(imageComposites)
        .png()
        .toBuffer();

    return finalImageBuffer;
}

export async function getBuffer(url: string) {
    return axios
        .get(url, {
            responseType: "arraybuffer",
        })
        .then((response) => Buffer.from(response.data));
}

export async function getProperty(element: ElementHandle, property: string) {
    return (await element.getProperty(property))
        .toString()
        .replace("JSHandle:", "");
}
