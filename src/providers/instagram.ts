import { ElementHandle } from "puppeteer";
import createEmbed from "../createEmbed.ts";
import { extractText, getProperty } from "../utils.ts";
import { VideoProviders, Providers } from "../types.ts";

export default (async (browser, url) => {
    const post = url.split("instagram.com/")[1].split("/")[0] === "p";
    if (!post && url.split("instagram.com/")[1].split("/")[0] !== "reel")
        return null;
    const page = await browser.newPage();
    await page.goto(url);
    await page.setViewport({ width: 1920, height: 1080 });
    let src = "";
    let resolution: { w: number; h: number } | undefined = undefined;
    let description: string | ElementHandle | null = await page
        .waitForSelector("html article h1", { timeout: 5000 })
        .catch(() => {
            return null;
        });
    if (!description) description = "No description found.";
    if (typeof description !== "string")
        description = extractText(await getProperty(description, "innerHTML"));

    const username = await page.$("title");
    if (!username) return null;
    const user = (
        await page.evaluate((username) => username.textContent, username)
    )
        ?.split(" |")[0]
        .replace("Instagram video by ", "")
        .split(" •")[0];

    if (!post) {
        src = `/video/instagram/${url.split("instagram.com/")[1].split("?")[0]}`;
    } else {
        const img_ = await page
            .waitForSelector("html article img")
            .catch(() => null);
        if (!img_) return null;
        const img = await page.$$("html article img");
        if (!img) return null;
        for (const element of img) {
            const alt = (await element.getProperty("alt")).toString();
            if (alt.includes(`Photo by ${user} on`))
                src = await getProperty(element, "src");
        }
    }
    if (!src) return null;
    await page.close();
    const embed = createEmbed({
        url,
        type: post ? "image" : "video",
        description,
        src,
        resolution,
        embed_color: "#E4405F",
        title: `${user} on Instagram`,
        username: user,
    });
    return embed;
}) as Providers;

export const video: VideoProviders = async (browser, data) => {
    const page = await browser.newPage();
    await page.goto(`https://www.instagram.com/${data}`);
    await page.setViewport({ width: 1080, height: 1024 });
    const video = await page.waitForSelector("video").catch(() => null);
    if (!video) return null;
    let src = await page.evaluate((video) => video.src, video);
    await page.close();
    src = `https://envoy.lol/${src}`;
    return src;
};
