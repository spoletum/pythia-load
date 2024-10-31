import dotenv from "dotenv";

dotenv.config();

export const openApiKey = process.env.OPENAI_API_KEY || "";
if (openApiKey === "") {
    throw new Error("OPENAI_API_KEY is not set");
}

export const username = process.env.BITBUCKET_USERNAME || "";
if (username === "") {
    throw new Error("BITBUCKET_USERNAME is not set");
}

export const password = process.env.BITBUCKET_PASSWORD || "";
if (password === "") {
    throw new Error("BITBUCKET_PASSWORD is not set");
}

export const modelName = "text-embedding-3-large";

export const chunkSize = 400;

export const chunkOverlap = 50;

export const urls = [
    "https://bitbucket.org/payretailers/account-events-api-core",
];