import { ElementHandle } from "puppeteer";
import { ImageProviders, Providers } from "../types";
import { extractText, getBuffer, getProperty, gridImages } from "../utils";
import createEmbed, { Options } from "../createEmbed";
import { redis } from "..";

export default (async (browser, url) => {
    const page = await browser.newPage();
    await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537"
    );
    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto(url);
    // reddit appears to be incredibly easy because apparently they use slots :sob:

    const collect = await page
        .waitForSelector(`html h1[slot="title"]`, { timeout: 20000 })
        .catch(() => null);
    let type: "image" | "video" | "none" = "none";
    if (!collect) return null;
    let title: ElementHandle | string | null = await page.$(
        "html shreddit-title"
    );
    if (!title) return null;
    title = await getProperty(title, "title");
    if (!title) return null;
    let content: ElementHandle | string | null =
        (await page.$(
            'html main shreddit-post div[slot="text-body"] > div > div'
        )) || "";
    if (typeof content !== "string")
        content = extractText(await getProperty(content, "innerHTML"));

    const bannerlink = await page.$(
        'html main shreddit-post div[slot="post-media-container"] shreddit-aspect-ratio > a'
    );
    if (bannerlink) content += `\n\n${await getProperty(bannerlink, "href")}`;

    const crosspost = await page.$(
        'html main shreddit-post div[class="crosspost-title m-0"] > a'
    );
    if (crosspost)
        content += `\n\nCrossposted from: https://www.reddit.com${await getProperty(
            crosspost,
            "href"
        )}`;

    let src: string = "";
    const image = await page.$('html main shreddit-post img[id="post-image"]');
    if (image) {
        type = "image";
        src = await getProperty(image, "src");
    }

    const video = await page.$("html main shreddit-post shreddit-player");
    if (video) {
        type = "video";
        src = await getProperty(video, "src");
        if (src.split("?")[0].endsWith(".gif")) type = "image";
    }

    const gallery = await page.$("html main shreddit-post gallery-carousel");
    if (gallery) {
        type = "image";
        let images: ElementHandle[] | string[] | null = await page.$$(
            "html main shreddit-post gallery-carousel figure img"
        );
        if (!images) return null;
        images = await Promise.all(
            images.map(async (element) => {
                return await getProperty(element, "src");
            })
        );
        const retUrl = url.split("https://www.reddit.com/")[1].split("?")[0];
        await redis.set(`image:reddit:${retUrl}`, images.join("\n"), {
            EX: 86400,
        });
        src = "/image/reddit/" + retUrl;
    }

    await page.close();

    const insertEmbed: {
        url: string;
        description: string;
        type: "none" | "video" | "image";
        src?: string;
        embed_color: string;
        title: string;
        provider: string;
    } = {
        url,
        description: content,
        type,
        embed_color: "#FF4500",
        title,
        provider: "Reddit",
    };
    if (type === "image" || type === "video") {
        insertEmbed.src = src as string;
    }

    const embed = createEmbed(insertEmbed as Options);
    return embed;
}) as Providers;

export const image: ImageProviders = async (_, data) => {
    const redisData = await redis.get(`image:reddit:${data}`);
    if (!redisData) return null;
    const buffer = await gridImages(
        await Promise.all(
            redisData.split("\n").map(async (image) => await getBuffer(image))
        )
    );
    return buffer;
};
