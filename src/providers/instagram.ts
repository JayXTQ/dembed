import { Browser, ElementHandle } from "puppeteer";
import createEmbed from "../createEmbed";

export default async (
    browser: Browser,
    url: string,
): Promise<string | null> => {
    const post = url.split("instagram.com/")[1].split("/")[0] === "p";
    if (!post && url.split("instagram.com/")[1].split("/")[0] !== "reel")
        return null;
    const page = await browser.newPage();
    await page.goto(url);
    await page.setViewport({ width: 1080, height: 1024 });
    let src = "";
    let resolution: { w: number; h: number } | undefined = undefined;
    const username = await page.$("title");
    if (!username) return null;
    const user = (
        await page.evaluate((username) => username.textContent, username)
    )?.split(" |")[0];
    let description: string | ElementHandle | null = await page.$(
        "html article ul li h1",
    );
    if (!description) description = "";
    if (typeof description !== "string")
        description = await page.evaluate(
            (description) => description.textContent,
            description,
        );
    if (!post) {
        src = `/video/instagram/${url.split("instagram.com/")[1].split("?")[0]}`;
    } else {
        await page.waitForSelector("html article img");
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
    console.log("src", src);
    if (!src) return null;
    await page.close();
    return createEmbed(
        url,
        src,
        post ? "image" : "video",
        `Generated using dembed for Instagram - Post by ${user}: ${description}`,
        resolution,
    );
};

export const video = async (
    browser: Browser,
    data: string,
): Promise<string | null> => {
    const page = await browser.newPage();
    await page.goto(`https://www.instagram.com/${data}`);
    await page.setViewport({ width: 1080, height: 1024 });
    await page.waitForSelector("video");
    const video = await page.$("video");
    if (!video) return null;
    let src = await page.evaluate((video) => video.src, video);
    src = `https://envoy.lol/${src}`;
    return src;
};
