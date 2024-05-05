import { Context } from "hono";

export const err400 = async (c: Context) => {
    return c.text("Bad Request", 400);
};

export const err404 = async (c: Context, what: string) => {
    return c.text(`${what} not found`, 404);
};
