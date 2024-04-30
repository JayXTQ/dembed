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
        await page.waitForSelector('html article img')
        const img = await page.$$('html article img');
        console.log(img)
        if(!img) return null;
        const username = await page.$('title')
        console.log(username)
        if(!username) return null;
        const user = (await page.evaluate(username => username.textContent, username))?.split(" |")[0];
        console.log(user)
        img.forEach(async (element) => {
            const alt = (await element.getProperty('alt')).toString();
            console.log(alt, `Photo by ${user} on`, alt.includes(`Photo by ${user} on`))
            console.log(src)
            if(alt.includes(`Photo by ${user} on`)) 
                src = alt;
        })
    }
    if(!src) return null;
    await page.close(); 
    return createEmbed(url, src, post ? 'image' : 'video');
};