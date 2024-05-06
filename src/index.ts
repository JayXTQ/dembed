import "dotenv/config";
import puppeteer, { BrowserWorker } from "@cloudflare/puppeteer";
import type { IndexProvider as Provider } from "./types.ts";
import alternatives from "./providers";
import { Hono } from "hono";
import { err400, err404 } from "./errors";
import { secureHeaders } from "hono/secure-headers";
import { Redis } from "@upstash/redis/cloudflare";
import { env } from "node:process"

// import { createClient } from "redis";

// export const redis = createClient({
//     // password: process.env.REDIS_PASSWORD,
//     // socket: {
//     //     host: process.env.REDIS_HOST,
//     //     port: Number(process.env.REDIS_PORT),
//     // }
//     url: process.env.REDISCLOUD_URL,
// });

// redis.connect();

export const redis = Redis.fromEnv({
    UPSTASH_REDIS_REST_URL: env.UPSTASH_REDIS_REST_URL as string,
    UPSTASH_REDIS_REST_TOKEN: env.UPSTASH_REDIS_REST_TOKEN as string,
});

type Bindings = {
    DEMBEDBROWSER: BrowserWorker;
    UPSTASH_REDIS_REST_URL: string;
    UPSTASH_REDIS_REST_TOKEN: string;
    IS_LOCAL_MODE: number;
}

const app = new Hono<{ Bindings: Bindings }>();

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

app.get("/http*", async (c) => {
    const url = new URL(c.req.url).pathname.slice(1);
    if (
        !c.req.header("User-Agent")?.includes("Discordbot") &&
        c.env.IS_LOCAL_MODE
        // "Mozilla/5.0 (compatible; Discordbot/2.0; +discordapp.com)"
    )
        return c.redirect(url);
    if (url.length <= 4) return;
    if (
        !/^(https?:\/\/)?((([a-z\d]([a-z\d-]*[a-z\d])*)\.)+[a-z]{2,}|((\d{1,3}\.){3}\d{1,3}))(:\d+)?(\/[-a-z\d%@_.~+]*)*(\?[;&a-z\d%_.~+=-]*)?(\#[-a-z\d_]*)?$/i.test(
            url
        )
    ) {
        console.log("Invalid URL", url);
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
    
    const browser = await puppeteer.launch(c.env.DEMBEDBROWSER);

    const response = await providerFile.default(browser, url);

    await browser.close();

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
    
    const browser = await puppeteer.launch(c.env.DEMBEDBROWSER);

    const response = await providerFile.video(browser, data);

    await browser.close();

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
    
    const browser = await puppeteer.launch(c.env.DEMBEDBROWSER);

    const response = await providerFile.image(browser, data);

    await browser.close();

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

export default app;