import { Browser } from "@cloudflare/puppeteer";

export type IndexProvider = {
    default: Providers;
    video: VideoProviders;
    image: ImageProviders;
};

export type Providers = (
    browser: Browser,
    url: string
) => Promise<string | null>;

export type VideoProviders = (
    browser: Browser,
    data: string
) => Promise<Buffer | string | null>;

export type ImageProviders = (
    browser: Browser,
    data: string
) => Promise<Buffer | string | null>;
