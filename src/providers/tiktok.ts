import { ElementHandle } from "puppeteer";
import createEmbed from "../createEmbed.tsx";
import { extractText, getProperty } from "../utils.ts";
import { VideoProviders, Providers } from "../types.ts";

export default (async (browser, url) => {
    url = url.split("?")[0]; // prefer no tracking when possible
    const page = await browser.newPage();
    await page.goto(url);
    await page.setViewport({ width: 1920, height: 1080 });
    await page.waitForSelector('span[data-e2e="browser-nickname"]');
    const username = await page.$$('span[data-e2e="browser-nickname"] > span');
    if (!username) return null;
    let user = "";
    for (const element of username) {
        const hasClass = await page.evaluate(
            (element) => !!element.getAttribute("class"),
            element,
        );
        if (hasClass) {
            user = (await page.evaluate(
                (element) => element.textContent,
                element,
            )) as string;
            break;
        }
    }
    let description: ElementHandle | string | null = await page.$(
        'h1[data-e2e="browse-video-desc"]',
    );
    if (!description) description = "No description";
    if (typeof description !== "string")
        description = extractText(await getProperty(description, "innerHTML"));
    url = page.url().split("?")[0]; // when it's a vm.tiktok.com address, it will redirect to tiktok.com with query params, so just remove them here :3
    await page.close();
    const embed = createEmbed({
        url,
        type: "video",
        description,
        src:
            "/video/tiktok/" +
            url
                .split("https://www.tiktok.com/")[1]
                .split("?")[0]
                .split("/")
                .at(-1),
        embed_color: "#000001",
        title: `${user} on TikTok`,
        username: user,
    });
    return embed;
}) as Providers;

export const video: VideoProviders = async (_, data) => {
    return `https://tiktxk.com/meta/${data}/video`;
};
