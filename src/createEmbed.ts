export default async (url: string, src: string, type: 'image' | 'video', description: string, resolution?: { w: number; h: number }) => {
    const metas = [
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
    const imageMetas = [
        {
            name: 'twitter:card',
            content: 'summary_large_image'
        },
        {
            name: 'twitter:image',
            content: src
        }
    ]
    const videoMetas = [
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
            content: resolution?.w.toString()
        },
        {
            name: 'og:video:height',
            content: resolution?.h.toString()
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
            name: 'twitter:player:width',
            content: resolution?.w.toString()
        },
        {
            name: 'twitter:player:height',
            content: resolution?.h.toString()
        },
        {
            name: 'twitter:card',
            content: 'player'
        }
    ]


    return `<!DOCTYPE html>
<html>
    <head>
        ${metas.map(meta => !meta.name.startsWith('og:') ? `<meta name="${meta.name}" content="${meta.content}" />` : `<meta property="${meta.name}" content="${meta.content}" />`).join('\n')}
        ${type === 'image' ? imageMetas.map(meta => !meta.name.startsWith('og:') ? `<meta name="${meta.name}" content="${meta.content}" />` : `<meta property="${meta.name}" content="${meta.content}" />`).join('\n') : videoMetas.map(meta => !meta.name.startsWith('og:') ? `<meta name="${meta.name}" content="${meta.content}" />`: `<meta property="${meta.name}" content="${meta.content}" />`).join('\n')}
    </head>
</html>`
}