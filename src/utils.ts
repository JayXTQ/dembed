export function extractText(html: string): string {
    return html.replace(/<[^>]*>/g, "");
}