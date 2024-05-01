export function extractText(html: string): string {
    html = html.replace(/<[^>]*>/g, " ").replace(/\s{2,}/g, ' ')
    const splitLines = html.split("\n");
    for (const line of splitLines) {
        if (line.startsWith('"') || line.startsWith(" "))
            splitLines[splitLines.indexOf(line)].slice(1);
        if (line.endsWith('"') || line.endsWith(" "))
            splitLines[splitLines.indexOf(line)].slice(0, -1);
    }
    html = splitLines.join(" ");
    if (html.length >= 200) html = html.slice(0, 200) + "...";
    return html;
}