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
    await page.setViewport({ width: 1920, height: 1080 });
    let src = "";
    let resolution: { w: number; h: number } | undefined = undefined;
    const username = await page.$("title");
    if (!username) return null;
    const user = (
        await page.evaluate((username) => username.textContent, username)
    )?.split(" |")[0];
    await page.waitForSelector("html article h1");
    let description: string | ElementHandle | null =
        await page.$("html article h1");
    if (!description) description = "No description found.";
    if (typeof description !== "string")
        description = await page.evaluate((description) => {
            let html = description.innerHTML;
            html = html.replace(/<br>/g, "\n");
            html = html.replace(/<a [^>]*>(.*?)<\/a>/g, "$1");
            const splitLines = html.split("\n");
            for (const line of splitLines) {
                if (line.startsWith('"'))
                    splitLines[splitLines.indexOf(line)].slice(1);
                if (line.endsWith('"'))
                    splitLines[splitLines.indexOf(line)].slice(0, -1);
            }
            html = splitLines.join(" ");
            html = html.replace(/\n/g, " ");
            if (html.length >= 200) html = html.slice(0, 200) + "...";
            return html;
        }, description);
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
    console.log(`Post by ${user}: ${description}`);
    return createEmbed(
        url,
        src,
        post ? "image" : "video",
        `Post by ${user}: ${description}`,
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
    await page.close();
    src = `https://envoy.lol/${src}`;
    return src;
};
