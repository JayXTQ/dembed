import { Browser } from "puppeteer";
import createEmbed, { type Options } from "../createEmbed";
import { extractText } from "../utils";

export default async (
    browser: Browser,
    url: string,
): Promise<string | null> => {
    const loc = 'html article[data-testid="tweet"]';
    const page = await browser.newPage();
    await page.goto(url);
    await page.setViewport({ width: 1920, height: 1080 });
    let type: "image" | "video" | "none" = "none";
    let src: string | null = null;
    let tweettext =
        (await page
            .waitForSelector(`${loc} div[data-testid="tweetText"]`)
            .catch(() => "")) ?? "";
    
    const retweetText = await page.$(`${loc} div[role="link"] a[data-testid="tweet-text-show-more-link"]`);
    let retweetLink = "";
    if(retweetText) {
        retweetLink = await page.evaluate((retweetText) => retweetText.getAttribute("href"), retweetText) ?? "";
        await page.evaluate((sel) => {
            let element = document.querySelector(sel);
            if (element) element.parentNode?.removeChild(element);
        }, `${loc} div[role="link"]`);
    };

    if (typeof tweettext !== "string"){
        tweettext =
            (await page.evaluate(
                (tweettext) => tweettext.innerHTML,
                tweettext,
            )) ?? "";
        const emojis = await page.$$(`${loc} div[data-testid="tweetText"] img`);
        for(const emoji of emojis){
            tweettext = tweettext.replace(
                (await emoji.getProperty("outerHTML")).toString().replace("JSHandle:", ""),
                (await emoji.getProperty("alt")).toString().replace("JSHandle:", "")
            );
        }
        tweettext = extractText(tweettext + (retweetLink ? `\n\n${retweetLink}` : ""));
    }
        
    const tweetimage = await page.$(
        `${loc} div[data-testid="tweetPhoto"] img[alt="Image"]`,
    );
    if (tweetimage) {
        type = "image";
        src = (await tweetimage.getProperty("src"))
            .toString()
            .replace("JSHandle:", "");
    }
    
    const tweetvideo = await page.$(
        `${loc} div[data-testid="tweetPhoto"] div[data-testid="videoPlayer"] div[data-testid="videoComponent"] video source`,
    );
    if(tweetvideo){
        type = "video";
        const url_ = new URL(page.url())
        let pathname = url_.pathname
        if(pathname.endsWith("/")){
            pathname = pathname.slice(0, -1)
        }
        src = `/video/twitter/${pathname.slice(1)}`;
    }

    const user = await page.$("title");
    if (!user) return null;
    const username = (
        await page.evaluate((user) => user.textContent, user)
    )?.split(" on X")[0];
    await page.close();
    const insertEmbed: { url: string; description: string; type: "none" | "video" | "image"; src?: string; embed_color: string; title: string } = {
        url,
        description: tweettext,
        type,
        embed_color: "#1D9BF0",
        title: `${username} on Twitter`
    }
    if(type === "image" || type === "video"){
        insertEmbed.src = src as string;
    }

    const embed = createEmbed(
        insertEmbed as Options,
    );
    return embed;
};

export const video = async (
    _: Browser,
    data: string,
): Promise<string | null> => {
    if(data.endsWith("/")){
        data = data.slice(0, -1)
    }
    return `https://d.fxtwitter.com/${data}.mp4`;
};
