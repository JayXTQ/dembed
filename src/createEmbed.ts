export default async (url: string, src: string, type: 'image' | 'video') => {
    return `<!DOCTYPE html>
<html>
    <head>
        <meta content="dembed" property="og:title" />
        <meta content="${url}" property="og:url" />
        <meta content="${type === 'image' ? 'summary_large_image' : 'player'}" property="twitter:card" />
        <meta content="${url}" property="twitter:url" />
        <meta content="dembed" property="twitter:title" />
        ${type === 'image' ? `<meta content="${src}" property="twitter:image" />` : `<meta content="${src}" property="twitter:video" />`}
    </head>
</html>`
}