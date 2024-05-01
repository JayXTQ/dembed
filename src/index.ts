import express, { Request, Response } from "express";
import "dotenv/config";
import puppeteer from "puppeteer";
import type { IndexProvider as Provider } from "./types";

const app = express();
const port = process.env.PORT || 3000;

app.get("/", (_: Request, res: Response) => {
    res.redirect("https://github.com/JayXTQ/dembed");
});

async function getProvider(provider: string) {
    try {
        const providerFile: Provider = await import(`./providers/${provider}`);
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
});

app.get("/http*", async (req: Request, res: Response) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    const url = req.url.slice(1);
    if (
        req.header["user-agent"] !==
        "Mozilla/5.0 (compatible; Discordbot/2.0; +discordapp.com)"
    )
        res.redirect(url);
    if (url.length <= 4) return;
    if (
        !/^(https?:\/\/)?((([a-z\d]([a-z\d-]*[a-z\d])*)\.)+[a-z]{2,}|((\d{1,3}\.){3}\d{1,3}))(:\d+)?(\/[-a-z\d%_.~+]*)*(\?[;&a-z\d%_.~+=-]*)?(\#[-a-z\d_]*)?$/i.test(
            url,
        )
    ) {
        return res.status(400).send("Bad Request");
    }
    let provider = url.split("/")[2];
    if (!provider) return res.status(400).send("Bad Request");
    if (provider.includes("www.")) {
        provider = provider.split("www.")[1];
    }
    provider = provider.split(".")[0];
    const providerFile = await getProvider(provider);
    if (providerFile == null || !providerFile) {
        return res.status(404).send("Provider not found");
    }
    const response = await providerFile.default(await browser, url);
    if (!response) return res.status(400).send("Bad Request");
    res.send(response);
});

app.get("/video/:provider/*", async (req: Request, res: Response) => {
    const provider = req.params.provider;
    const data = req.url.split(`/${provider}/`)[1];
    if (!data) return res.status(400).send("Bad Request");
    const providerFile = await getProvider(provider);
    if (providerFile == null || !providerFile) {
        return res.status(404).send("Provider not found");
    }
    const src = await providerFile.video(await browser, data);
    if (!src) return res.status(400).send("Bad Request");
    res.redirect(src);
});

app.listen(port, () => {
    console.log(`Server started`);
});
