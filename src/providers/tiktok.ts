import { Browser, ElementHandle } from "puppeteer";
import createEmbed from "../createEmbed";
import { extractText } from "../utils";

export default async (
    browser: Browser,
    url: string,
): Promise<string | null> => {
    const page = await browser.newPage();
    await page.goto(url);
    await page.setViewport({ width: 1920, height: 1080 });
    let resolution: { w: number; h: number } | undefined = undefined;
    const video = await page.waitForSelector("video").catch(() => null);
    if (!video) return null;
    const src = await page.evaluate((video) => video.src, video);
    const username = await page.$$('span[data-e2e="browser-nickname"] > span')
    if (!username) return null;
    let user = "";
    for(const element of username) {
        const hasClass = await page.evaluate((element) => !!element.getAttribute('class'), element);
        if(hasClass) {
            user = await page.evaluate((element) => element.textContent, element) as string;
            break;
        }
    }
    let description: ElementHandle | string | null = await page.$('h1[data-e2e="browse-video-desc"]')
    if (!description) description = 'No description';
    if(typeof description !== 'string' ) description = await page.evaluate((description) => {
        const html = extractText(description.innerHTML);
        return html.replace(/\n/g, " ");
    }, description);
    const embed = createEmbed(
        url,
        src,
        "video",
        `Post by ${user}: ${description}`,
        resolution
    );
    return embed;
};
