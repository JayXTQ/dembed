import { Browser, ElementHandle, Page } from "puppeteer";
import createEmbed, { type Options } from "../createEmbed";
import { extractText } from "../utils";
import sharp from "sharp";
import axios from "axios";

const loc = 'html article[data-testid="tweet"]';

async function getRetweetLink(page: Page) {
    const retweetText = await page.$(
        `${loc} div[role="link"] a[data-testid="tweet-text-show-more-link"]`,
    );
    let retweetLink = "";
    if (retweetText) {
        retweetLink =
            "https://twitter.com" +
                (await page.evaluate(
                    (retweetText) => retweetText.getAttribute("href"),
                    retweetText,
                )) ?? "";
        await page.evaluate((sel) => {
            let element = document.querySelector(sel);
            if (element) element.parentNode?.removeChild(element);
        }, `${loc} div[role="link"]`);
    }
    return retweetLink;
}

async function getTweetText(
    browser: Browser,
    page: Page,
    tweettext: ElementHandle | string,
    retweetLink: string | null,
) {
    if (typeof tweettext !== "string") {
        tweettext =
            (await page.evaluate(
                (tweettext) => tweettext.innerHTML,
                tweettext,
            )) ?? "";
        const emojis = await page.$$(`${loc} div[data-testid="tweetText"] img`);
        for (const emoji of emojis) {
            tweettext = tweettext.replace(
                (await emoji.getProperty("outerHTML"))
                    .toString()
                    .replace("JSHandle:", ""),
                (await emoji.getProperty("alt"))
                    .toString()
                    .replace("JSHandle:", ""),
            );
        }
        let bannerlink: ElementHandle | string | null = await page.$(
            `${loc} div[data-testid="card.wrapper"] div[data-testid="card.layoutLarge.media"] a`,
        );
        if (bannerlink && typeof bannerlink !== "string") {
            bannerlink = (await page.evaluate(
                (bannerlink) => bannerlink.getAttribute("href"),
                bannerlink,
            )) as string;
            const newPage = await browser.newPage();
            await newPage.goto(bannerlink);
            await newPage.waitForSelector("html body");
            bannerlink = newPage.url();
            await newPage.close();
        }
        tweettext = extractText(
            tweettext +
                (retweetLink ? `\n\n${retweetLink}` : "") +
                (bannerlink ? `\n\n${bannerlink}` : ""),
        );
    }
    return tweettext;
}

export default async (
    browser: Browser,
    url: string,
): Promise<string | null> => {
    const page = await browser.newPage();
    await page.goto(url);
    await page.setViewport({ width: 1920, height: 1080 });

    let type: "image" | "video" | "none" = "none";
    let src: string | null = null;

    let tweettext =
        (await page
            .waitForSelector(`${loc} div[data-testid="tweetText"]`)
            .catch(() => "")) ?? "";

    const retweetLink = await getRetweetLink(page);

    tweettext = await getTweetText(browser, page, tweettext, retweetLink);

    const url_ = new URL(page.url());
    let pathname = url_.pathname;
    if (pathname.endsWith("/")) {
        pathname = pathname.slice(0, -1);
    }

    const tweetimage = await page.$$(
        `${loc} div[data-testid="tweetPhoto"] img[alt="Image"]`,
    );
    if (tweetimage) {
        type = "image";
        if (tweetimage.length === 1)
            src = (await tweetimage[0].getProperty("src"))
                .toString()
                .replace("JSHandle:", "");
        else {
            src = `/image/twitter/${pathname.slice(1)}`;
        }
    }

    const tweetvideo = await page.$(
        `${loc} div[data-testid="tweetPhoto"] div[data-testid="videoPlayer"] div[data-testid="videoComponent"] video source`,
    );
    if (tweetvideo) {
        type = "video";
        src = `/video/twitter/${pathname.slice(1)}`;
    }

    const user = await page.$("title");
    if (!user) return null;
    const username = (
        await page.evaluate((user) => user.textContent, user)
    )?.split(" on X")[0];
    await page.close();
    const insertEmbed: {
        url: string;
        description: string;
        type: "none" | "video" | "image";
        src?: string;
        embed_color: string;
        title: string;
        username: string;
    } = {
        url,
        description: tweettext,
        type,
        embed_color: "#1D9BF0",
        title: `${username} on Twitter`,
        username: username as string,
    };
    if (type === "image" || type === "video") {
        insertEmbed.src = src as string;
    }

    const embed = createEmbed(insertEmbed as Options);
    return embed;
};

export const video = async (
    _: Browser,
    data: string,
): Promise<string | null> => {
    if (data.endsWith("/")) {
        data = data.slice(0, -1);
    }
    return `https://d.fxtwitter.com/${data}.mp4`;
};

async function getBuffer(url: string) {
    return axios
        .get(url, {
            responseType: "arraybuffer",
        })
        .then((response) => Buffer.from(response.data));
}

export const image = async (
    browser: Browser,
    data: string,
): Promise<Buffer | null> => {
    const url = `https://twitter.com/${data}`;
    const page = await browser.newPage();
    await page.goto(url);
    await page.setViewport({ width: 1920, height: 1080 });
    const image = await page
        .waitForSelector(
            `${loc} div[data-testid="tweetPhoto"] img[alt="Image"]`,
        )
        .catch(() => null);
    if (!image) return null;
    const tweetimages = await page.$$(
        `${loc} div[data-testid="tweetPhoto"] img[alt="Image"]`,
    );
    if (!tweetimages) return null;
    const imageBuffers = await Promise.all(
        tweetimages.map(async (tweetimage) => {
            return await getBuffer(
                (await tweetimage.getProperty("src"))
                    .toString()
                    .replace("JSHandle:", ""),
            );
        }),
    );
    await page.close();

    const targetHeight = tweetimages.length > 2 ? 1000 : 500;
    let compositeImage = sharp({
        create: {
            width: 1000,
            height: targetHeight,
            channels: 4,
            background: { r: 255, g: 255, b: 255, alpha: 1 },
        },
    });

    const imageComposites = await Promise.all(
        imageBuffers.map(async (buffer, index) => {
            const targetWidth = 500;
            const resizedBuffer = await sharp(buffer)
                .resize(targetWidth)
                .toBuffer();
            const row = Math.floor(index / 2);
            const col = index % 2;
            const x = col * targetWidth;
            const y = row * (targetHeight / 2);

            return {
                input: resizedBuffer,
                left: x,
                top: y,
            };
        }),
    );

    // Composite the images onto the initial blank canvas
    const finalImageBuffer = await compositeImage
        .composite(imageComposites)
        .png()
        .toBuffer();

    return finalImageBuffer;
};
