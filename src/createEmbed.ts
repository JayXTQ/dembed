export type Options = {
    url: string;
    description: string;
    embed_color?: string;
    title?: string;
    username?: string;
} & ({
    type: "video";
    src: string;
    resolution?: { w: number; h: number };
} | {
    type: "image";
    src: string;
} | {
    type: "none";
});

export default (
    options: Options,
) => {
    type Metas = Array<
        | { name: string; content: string | undefined }
        | { property: string; content: string | undefined }
    >;
    const metas: Metas = [
        {
            property: "og:url",
            content: options.url,
        },
        {
            name: "twitter:url",
            content: options.url,
        },
        {
            property: "og:description",
            content: options.description,
        },
        {
            property: "og:site_name",
            content: "dembed",
        },
    ];

    let insertMetas: Metas = [];

    if (options.type === "image") insertMetas = [
        {
            name: "twitter:card",
            content: "summary_large_image",
        },
        {
            name: "twitter:image",
            content: options.src,
        },
    ];
    else if (options.type === "video") insertMetas = [
        {
            name: "twitter:card",
            content: "player",
        },
        {
            name: "twitter:player:width",
            content: options.resolution?.w.toString() || "0",
        },
        {
            name: "twitter:player:height",
            content: options.resolution?.h.toString() || "0",
        },
        {
            name: "twitter:player:stream",
            content: options.src,
        },
        {
            name: "twitter:player:stream:content_type",
            content: "video/mp4",
        },
        {
            property: "og:video",
            content: options.src,
        },
        {
            property: "og:video:secure_url",
            content: options.src,
        },
        {
            property: "og:video:type",
            content: "video/mp4",
        },
        {
            property: "og:video:width",
            content: options.resolution?.w.toString() || "0",
        },
        {
            property: "og:video:height",
            content: options.resolution?.h.toString() || "0",
        },
    ];
    if (options.embed_color) {
        metas.push({
            name: "theme-color",
            content: options.embed_color,
        });
    }
    if (options.title) {
        metas.push({
            property: "og:title",
            content: options.title,
        });
        metas.push({
            name: "twitter:title",
            content: options.title,
        });
    }

    return `<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8" />
        ${metas
            .map(
                (meta) =>
                    `<meta ${Object.keys(meta)
                        .map((key) => `${key}="${meta[key]}"`)
                        .join(" ")} />`,
            )
            .join("\n       ")}
        ${insertMetas
            .map(
                (meta) =>
                    `<meta ${Object.keys(meta)
                        .map((key) => `${key}="${meta[key]}"`)
                        .join(" ")} />`,
            )
            .join("\n     ")}
        ${
            options.type === "video"
                ? `<link rel="alternate"
		href="https://dembed.page/oembed?author_name=${encodeURIComponent(options.description)}&author_url=${encodeURIComponent(options.url)}&provider_name=dembed&provider_url=https://dembed.page&title=dembed&type=link&version=1.0"
		type="application/json+oembed" title="${options.username}" />`
                : ""
        }
    </head>
    <body>
        why u peekin?
    </body>
</html>`;
};
