import { Browser } from 'puppeteer';
import createEmbed from '../createEmbed';

export default async (browser: Browser, url: string): Promise<string | null> => {
    const post = url.split('instagram.com/')[1].split('/')[0] === 'p';
    if(!post && url.split('instagram.com/')[1].split('/')[0] !== 'reel') return null;
    console.log(post)
    const page = await browser.newPage();
    await page.goto(url);
    await page.setViewport({ width: 1080, height: 1024 });
    let src = '';
    if(!post) {
        await page.waitForSelector('video')
        const video = await page.$('video');
        if(!video) return null;
        src = await page.evaluate(video => video.src, video);
    } else {
        await page.waitForSelector('article >>>>>>> img')
        const img = await page.$$('article >>>>>>> img');
        if(!img) return null;
        const username = await page.$('title')
        if(!username) return null;
        const user = (await page.evaluate(username => username.textContent, username))?.split(" |")[0];
        img.forEach(async (element) => {
            src = (await element.getProperty('alt')).toString().includes(`Photo by ${user} on`) ? (await element.getProperty('src')).toString() : '';
        })
    }
    if(!src) return null;
    await page.close(); 
    return createEmbed(url, src, post ? 'image' : 'video');
};