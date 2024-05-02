import { Response } from "express";

export function extractText(html: string): string {
    html = html.replace(/<br>/g, "\n").replace(/<br\/>/g, "\n").replace(/<br \/>/g, "\n");
    html = html.replace(/<[^>]*>/g, "");
    const splitLines = html.split("\n");
    for (const line of splitLines) {
        if (line.startsWith('"') || line.startsWith(" "))
            splitLines[splitLines.indexOf(line)].slice(1);
        if (line.endsWith('"') || line.endsWith(" "))
            splitLines[splitLines.indexOf(line)].slice(0, -1);
    }
    html = splitLines.join("\n");
    console.log(html)
    if (html.length >= 500) html = html.slice(0, 500) + "...";
    return html;
}

export function setSecurityHeaders(res: Response) {
    res.setHeader("Content-Security-Policy", "script-src 'self'");
    res.setHeader(
        "Strict-Transport-Security",
        "max-age=31536000; includeSubDomains",
    );
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader(
        "Feature-Policy",
        "geolocation 'none'; microphone 'none'; camera 'none'",
    );
    res.setHeader(
        "Permissions-Policy",
        "geolocation=(), microphone=(), camera=()",
    );
}
