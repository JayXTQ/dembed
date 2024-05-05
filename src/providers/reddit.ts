import { ElementHandle } from "puppeteer";
import { ImageProviders, Providers } from "../types";
import { extractText, getBuffer, getProperty, gridImages } from "../utils";
import createEmbed, { Options } from "../createEmbed";
import { redis } from "..";

export default (async (browser, url) => {
    const page = await browser.newPage();
    await page.goto(url);
    await page.setViewport({ width: 1920, height: 1080 });
    // reddit appears to be incredibly easy because apparently they use slots :sob:

    const collect = await page.waitForSelector('shreddit-post', { timeout: 5000 }).catch(() => null);
    let type: "image" | "video" | "none" = "none";
    if (!collect) return null;
    let title: ElementHandle | string | null = await page.$('shreddit-title')
    if (!title) return null;
    title = await getProperty(title, 'title')
    if (!title) return null;
    let content: ElementHandle | string | null = await page.$('html shreddit-post div[slot="text-body"] > div > div') || '';
    if(typeof content !== 'string')
        content = extractText(await getProperty(content, 'innerHTML'))

    const bannerlink = await page.$('html shreddit-post div[slot="post-media-container"] shreddit-aspect-ratio > a')
    if(bannerlink) content += `\n\n${await getProperty(bannerlink, 'href')}`

    const crosspost = await page.$('html shreddit-post div[class="crosspost-title m-0"] > a')
    if(crosspost) content += `\n\nCrossposted from: https://www.reddit.com${await getProperty(crosspost, 'href')}`

    let src: string = '';
    const image = await page.$('html shreddit-post img[id="post-image"]')
    if(image) {
        type = 'image';
        src = await getProperty(image, 'src')
    }

    const video = await page.$('html shreddit-post shreddit-player')
    if(video) {
        type = 'video';
        src = await getProperty(video, 'src')
        if(src.split("?")[0].endsWith('.gif')) type = 'image';
    }

    const gallery = await page.$('html shreddit-post gallery-carousel')
    if(gallery) {
        type = 'image';
        let images: ElementHandle[] | string[] | null = await page.$$('html shreddit-post gallery-carousel figure img')
        if(!images) return null;
        images = await Promise.all(images.map(async (element) => {
            return await getProperty(element, 'src')
        }))
        const retUrl = url.split('https://www.reddit.com/')[1].split('?')[0]
        await redis.set(`image:reddit:${retUrl}`, images.join('\n'), { EX: 86400 })
        src = '/image/reddit/' + retUrl
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
    const buffer = await gridImages(await Promise.all(redisData.split('\n').map(async (image) => await getBuffer(image))));
    return buffer;
}