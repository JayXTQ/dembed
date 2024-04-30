import express, { Request, Response } from 'express';
import 'dotenv/config';
import puppeteer from 'puppeteer';
import type { IndexProvider as Provider } from './types';

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req: Request, res: Response) => {
  res.send('Hello World!');
});

async function getProvider(provider: string){
    try {
        const providerFile: Provider = await import(`./providers/${provider}`);
        return providerFile?.default || null;
    } catch (error) {
        return null;
    }
}

const browser = puppeteer.launch({
	args: [
		'--no-sandbox',
		'--font-render-hinting=none',
		'--force-color-profile=srgb',
		'--disable-web-security',
		'--disable-setuid-sandbox',
		'--disable-features=IsolateOrigins',
		'--disable-site-isolation-trials',
	],
});

app.get('/:url*', async (req: Request, res: Response) => {
    const url = req.params.url;
    if(!/^(https?:\/\/)?((([a-z\d]([a-z\d-]*[a-z\d])*)\.)+[a-z]{2,}|((\d{1,3}\.){3}\d{1,3}))(:\d+)?(\/[-a-z\d%_.~+]*)*(\?[;&a-z\d%_.~+=-]*)?(\#[-a-z\d_]*)?$/i.test(url)){
        res.status(400).send('Bad Request');
    }
    let provider = url.split('/')[2];
    if(provider.includes('www.')){
        provider = provider.split('www.')[1];
    }
    provider = provider.split('.')[0];
    const providerFile = await getProvider(provider);
    if(providerFile == null || !providerFile){
        return res.status(404).send('Provider not found');
    }
    const response = await providerFile(await browser, url);
    if(!response) return res.status(400).send('Bad Request')
    res.send(response);
});

app.listen(port, () => {
  console.log(`Server started`);
});