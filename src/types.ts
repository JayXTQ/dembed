import { Browser } from "puppeteer";

export type IndexProvider = {
    default: Providers;
    video: VideoProviders;
};

export type Providers = (
    browser: Browser,
    url: string,
) => Promise<string | null>;

export type VideoProviders = (
    browser: Browser;
    data: string;
) => Promise<string | null>;
