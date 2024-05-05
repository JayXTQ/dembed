import "dotenv/config";
import puppeteer from "puppeteer";
import type { IndexProvider as Provider } from "./types.ts";
import alternatives from "./providers";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { err400, err404 } from "./errors.ts";
import { secureHeaders } from "hono/secure-headers";
import { createClient } from "redis";

export const redis = createClient({
    // password: process.env.REDIS_PASSWORD,
    // socket: {
    //     host: process.env.REDIS_HOST,
    //     port: Number(process.env.REDIS_PORT),
    // }
    url: process.env.REDISCLOUD_URL,
});

redis.connect();

const app = new Hono();
const port = Number(process.env.PORT) || 3000;

app.use(secureHeaders());

app.notFound(async (c) => {
    return c.text("Not Found", 404);
});

app.get("/", (c) => {
    return c.redirect("https://github.com/JayXTQ/dembed");
});

async function getProvider(provider: string) {
    try {
        const providerFile: Provider = await import(
            `./providers/${provider}.ts`
        );
        return providerFile;
    } catch (error) {
        return null;
    }
}

const browser = puppeteer.launch({
    args: [
        "--no-sandbox",
        "--font-render-hinting=none",
        "--force-color-profile=srgb",
        "--disable-web-security",
        "--disable-setuid-sandbox",
        "--disable-features=IsolateOrigins",
        "--disable-site-isolation-trials",
    ],
    headless: true,
});

app.get("/http*", async (c) => {
    const url = new URL(c.req.url).pathname.slice(1);
    if (
        !c.req.header("User-Agent")?.includes("Discordbot") && process.env.HEROKU
        // "Mozilla/5.0 (compatible; Discordbot/2.0; +discordapp.com)"
    )
        return c.redirect(url);
    if (url.length <= 4) return;
    if (
        !/^(https?:\/\/)?((([a-z\d]([a-z\d-]*[a-z\d])*)\.)+[a-z]{2,}|((\d{1,3}\.){3}\d{1,3}))(:\d+)?(\/[-a-z\d%@_.~+]*)*(\?[;&a-z\d%_.~+=-]*)?(\#[-a-z\d_]*)?$/i.test(
            url,
        )
    ) {
        console.log("Invalid URL", url)
        return await err400(c);
    }
    let provider: string | null = url.split("/")[2];
    if (!provider) return await err400(c);
    provider = provider.split(".").at(-2)?.trim() ?? null;
    if (!provider) return await err400(c);
    console.log("url provider", provider);
    console.log("alternatives provider", alternatives[provider]);
    let providerFile = await getProvider(provider);
    if (providerFile == null || !providerFile)
        providerFile = await getProvider(alternatives[provider]);
    if (providerFile == null || !providerFile) {
        return await err404(c, "Provider file");
    }
    const response = await providerFile.default(await browser, url);
    if (!response) return await err400(c);
    return c.html(response);
});

app.get("/video/:provider/*", async (c) => {
    const provider = c.req.param("provider");
    const data = c.req.url.split(`/${provider}/`)[1];
    if (!data) return await err400(c);
    const providerFile = await getProvider(provider);
    if (providerFile == null || !providerFile) {
        return await err404(c, "Provider");
    }
    const response = await providerFile.video(await browser, data);
    if (!response) return await err400(c);
    if (typeof response === "string") return c.redirect(response);
    c.res.headers.set("Content-Type", "video/mp4");
    return c.body(response);
});

app.get("/image/:provider/*", async (c) => {
    const provider = c.req.param("provider");
    const data = c.req.url.split(`/${provider}/`)[1];
    if (!data) return await err400(c);
    const providerFile = await getProvider(provider);
    if (providerFile == null || !providerFile) {
        return await err404(c, "Provider");
    }
    const response = await providerFile.image(await browser, data);
    if (!response) return await err400(c);
    if (typeof response === "string") return c.redirect(response);
    c.header("Content-Type", "image/png");
    return c.body(response);
});

app.get("/oembed", async (c) => {
    const url = new URL(c.req.url);
    const searchParams = Object.fromEntries(url.searchParams.entries());
    for (const key in searchParams) {
        searchParams[key] = decodeURIComponent(searchParams[key]);
    }
    return c.json(searchParams);
});

serve({
    fetch: app.fetch,
    port,
});
