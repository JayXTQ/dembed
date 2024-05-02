import { Browser } from "puppeteer";
import createEmbed from "../createEmbed";

export default async (
    browser: Browser,
    url: string,
): Promise<string | null> => {
    const loc = 'html article[data-testid="tweet"]';
    const page = await browser.newPage();
    await page.goto(url);
    await page.setViewport({ width: 1920, height: 1080 });
    let type: "image" | "video" | "none" = "none";
    let src = "";
    const user = await page.$("title");
    if (!user) return null;
    const username = (
        await page.evaluate((user) => user.textContent, user)
    )?.split(" on X")[0];
    let tweettext =
        (await page
            .waitForSelector(`${loc} div[data-testid="tweetText"]`)
            .catch(() => "")) ?? "";
    if (typeof tweettext !== "string")
        tweettext =
            (await page.evaluate(
                (tweettext) => tweettext.textContent,
                tweettext,
            )) ?? "";
    const tweetimage = await page.$(
        `${loc} div[data-testid="tweetPhoto"] img[alt="Image"]`,
    );
    if (tweetimage) {
        type = "image";
        src = (await tweetimage.getProperty("src"))
            .toString()
            .replace("JSHandle:", "");
    }
    const embed = createEmbed(
        url,
        type,
        `Tweet by ${username}: ${tweettext}`,
        !!src ? src : undefined,
    );
    return embed;
};
