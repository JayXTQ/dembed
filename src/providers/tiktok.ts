import { Browser, ElementHandle } from "puppeteer";
import createEmbed from "../createEmbed.ts";
import { extractText } from "../utils.ts";

export default async (
    browser: Browser,
    url: string,
): Promise<string | null> => {
    const page = await browser.newPage();
    await page.goto(url);
    await page.setViewport({ width: 1920, height: 1080 });
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
    if(typeof description !== 'string' ) description = extractText((await description.getProperty('innerHTML')).toString().replace('JSHandle:', ''));
    url = page.url();
    await page.close();
    const embed = createEmbed(
        url,
        '/video/tiktok/' + url.split('https://www.tiktok.com/')[1].split('?')[0].split('/').at(-1),
        "video",
        `Post by ${user}: ${description}`
    );
    return embed;
};

export const video = async (
    _: Browser,
    data: string,
): Promise<string | null> => {
    return `https://tiktxk.com/meta/${data}/video`;
};
