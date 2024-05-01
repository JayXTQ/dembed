export default (url: string, src: string, type: 'image' | 'video', description: string, resolution?: { w: number; h: number }) => {
    type Metas = Array<{name: string; content: string} | { property: string; content: string }>
    const metas: Metas = [
        {
            name: 'og:title',
            content: 'dembed'
        },
        {
            name: 'og:url',
            content: url
        },
        {
            name: 'twitter:url',
            content: url
        },
        {
            name: 'twitter:title',
            content: 'dembed'
        },
        {
            name: 'og:description',
            content: description
        },
        {
            name: 'twitter:description',
            content: description
        },
    ]
    const imageMetas: Metas = [
        {
            name: 'twitter:card',
            content: 'summary_large_image'
        },
        {
            name: 'twitter:image',
            content: src
        }
    ]
    const videoMetas: Metas = [
        {
            name: 'twitter:card',
            content: 'player'
        },
        {
            name: 'twitter:player:width',
            content: resolution?.w.toString() as string
        },
        {
            name: 'twitter:player:height',
            content: resolution?.h.toString() as string
        },
        {
            name: 'twitter:player:stream',
            content: src
        },
        {
            name: 'twitter:player:stream:content_type',
            content: 'video/mp4'
        },
        {
            name: 'og:video',
            content: src
        },
        {
            name: 'og:video:secure_url',
            content: src
        },
        {
            name: 'og:video:type',
            content: 'video/mp4'
        },
        {
            name: 'og:video:width',
            content: resolution?.w.toString() as string
        },
        {
            name: 'og:video:height',
            content: resolution?.h.toString() as string
        },
    ]


    return `<!DOCTYPE html>
<html>
    <head>
        ${metas.map(meta => `<meta ${Object.keys(meta).map(key => `${key}="${meta[key]}"`).join(' ')} />`).join('\n')}
        ${type === 'image' ? imageMetas.map(meta => `<meta ${Object.keys(meta).map(key => `${key}="${meta[key]}"`).join(' ')} />`).join('\n') : videoMetas.map(meta => `<meta ${Object.keys(meta).map(key => `${key}="${meta[key]}"`).join(' ')} />`).join('\n')}
    </head>
</html>`
}