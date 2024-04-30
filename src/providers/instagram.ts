import { Browser } from 'puppeteer';
import createEmbed from '../createEmbed';

export default async (browser: Browser, url: string): Promise<string | null> => {
    const post = url.split('instagram.com/')[1].split('/')[0] === 'p';
    if(!post && url.split('instagram.com/')[1].split('/')[0] !== 'reel') return null;
    const page = await browser.newPage();
    await page.goto(url);
    await page.setViewport({ width: 1080, height: 1024 });
    let src = '';
    if(!post) {
        await page.waitForSelector('video')
        const video = await page.$('video');
        if(!video) return null;
        src = await page.evaluate(video => video.src, video);
        console.log('src 1', src)
    } else {
        await page.waitForSelector('html article img')
        const img = await page.$$('html article img');
        if(!img) return null;
        const username = await page.$('title')
        if(!username) return null;
        const user = (await page.evaluate(username => username.textContent, username))?.split(" |")[0];
        img.forEach(async (element) => {
            const alt = (await element.getProperty('alt')).toString();
            if(alt.includes(`Photo by ${user} on`)) 
                src = (await element.getProperty('src')).toString().replace('JSHandle:', '');
            console.log('src 1', src)
        })
    }
    console.log('src 2', src)
    if(!src) return null;
    await page.close(); 
    return createEmbed(url, src, post ? 'image' : 'video');
};