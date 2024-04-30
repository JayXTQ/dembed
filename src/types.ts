import { Browser } from 'puppeteer';

export type IndexProvider = {
    default: Providers;
}

export type Providers = (browser: Browser, url: string) => Promise<string | null>;