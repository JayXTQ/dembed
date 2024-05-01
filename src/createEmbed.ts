export default async (url: string, src: string, type: 'image' | 'video', description: string) => {
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
            name: 'twitter:card',
            content: 'summary_large_image'
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
            name: 'twitter:image',
            content: src
        }
    ]
    const videoMetas = [
        // {
        //     name: 'twitter:player',
        //     content: src
        // },
        // {
        //     name: 'og:type',
        //     content: 'video.other'
        // },
        // {
        //     name: 'og:video',
        //     content: src
        // },
        // {
        //     name: 'og:video:secure_url',
        //     content: src
        // },
        // {
        //     name: 'og:video:type',
        //     content: 'video/mp4'
        // }
        {
            name: 'og:video:url',
            content: src
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