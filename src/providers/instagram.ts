import { Browser, ElementHandle } from "puppeteer";
import createEmbed from "../createEmbed.ts";
import { extractText } from "../utils.ts";

export default async (
    browser: Browser,
    url: string,
): Promise<string | null> => {
    const post = url.split("instagram.com/")[1].split("/")[0] === "p";
    if (!post && url.split("instagram.com/")[1].split("/")[0] !== "reel")
        return null;
    const page = await browser.newPage();
    await page.goto(url);
    await page.setViewport({ width: 1920, height: 1080 });
    console.log(await page.content());
    let src = "";
    let resolution: { w: number; h: number } | undefined = undefined;
    const username = await page.$("title");
    if (!username) return null;
    const user = (
        await page.evaluate((username) => username.textContent, username)
    )?.split(" |")[0];
    let description: string | ElementHandle | null = await page
        .waitForSelector("html article h1")
        .catch(() => {
            console.log("Request may have been blocked: Instagram");
            return null;
        });
    if (!description) description = "No description found.";
    if (typeof description !== "string")
        description = extractText(
            (await description.getProperty("innerHTML"))
                .toString()
                .replace("JSHandle:", ""),
        );
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
                src = (await element.getProperty("src"))
                    .toString()
                    .replace("JSHandle:", "");
        }
    }
    if (!src) return null;
    await page.close();
    const embed = createEmbed(
        url,
        post ? "image" : "video",
        `Post by ${user}: ${description}`,
        src,
        resolution,
    );
    return embed;
};

export const video = async (
    browser: Browser,
    data: string,
): Promise<string | null> => {
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
