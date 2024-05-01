export default (
    url: string,
    src: string,
    type: "image" | "video",
    description: string,
    resolution?: { w: number; h: number },
) => {
    type Metas = Array<
        | { name: string; content: string }
        | { property: string; content: string }
    >;
    const metas: Metas = [
        {
            property: "og:title",
            content: "dembed",
        },
        {
            property: "og:url",
            content: url,
        },
        {
            name: "twitter:url",
            content: url,
        },
        {
            name: "twitter:title",
            content: "dembed",
        },
        {
            property: "og:description",
            content: description,
        },
        {
            property: "og:site_name",
            content: "dembed",
        },
    ];
    const imageMetas: Metas = [
        {
            name: "twitter:card",
            content: "summary_large_image",
        },
        {
            name: "twitter:image",
            content: src,
        },
    ];
    const videoMetas: Metas = [
        {
            name: "twitter:card",
            content: "player",
        },
        {
            name: "twitter:player:width",
            content: resolution?.w.toString() || "0",
        },
        {
            name: "twitter:player:height",
            content: resolution?.h.toString() || "0",
        },
        {
            name: "twitter:player:stream",
            content: src,
        },
        {
            name: "twitter:player:stream:content_type",
            content: "video/mp4",
        },
        {
            property: "og:video",
            content: src,
        },
        {
            property: "og:video:secure_url",
            content: src,
        },
        {
            property: "og:video:type",
            content: "video/mp4",
        },
        {
            property: "og:video:width",
            content: resolution?.w.toString() || "0",
        },
        {
            property: "og:video:height",
            content: resolution?.h.toString() || "0",
        },
    ];

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
        ${
            type === "image"
                ? imageMetas
                      .map(
                          (meta) =>
                              `<meta ${Object.keys(meta)
                                  .map((key) => `${key}="${meta[key]}"`)
                                  .join(" ")} />`,
                      )
                      .join("\n     ")
                : videoMetas
                      .map(
                          (meta) =>
                              `<meta ${Object.keys(meta)
                                  .map((key) => `${key}="${meta[key]}"`)
                                  .join(" ")} />`,
                      )
                      .join("\n     ")
        }
        <link rel="alternate"
		href="https://dembed.page/oembed?author_name=${encodeURIComponent(description)}&author_url=${encodeURIComponent(url)}&provider_name=dembed&provider_url=https://dembed.page&title=dembed&type=link&version=1.0"
		type="application/json+oembed" title="${description}" />
    </head>
    <body>
        why u peekin?
    </body>
</html>`;
};
