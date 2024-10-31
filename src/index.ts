import { Chroma } from "@langchain/community/vectorstores/chroma";
import { OpenAIEmbeddings } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { BitBucketDataSource } from "./bitbucket/bitbucket";
import { password, username, chunkSize, chunkOverlap, modelName, openApiKey, urls } from "./config/config";
import { Anthropic } from "@anthropic-ai/sdk";

// TODO: Make this configurable
const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: chunkSize,
    chunkOverlap: chunkOverlap,
});


async function main() {

    const url = "https://bitbucket.org/payretailers/account-events-api-core";

    const embedding = new OpenAIEmbeddings({ modelName: modelName, apiKey: openApiKey });
    
    const bitbucket = new BitBucketDataSource(url, username, password, splitter);
    
    const documents = await bitbucket.getDocuments();

    for (const url of urls) {
        const collectionName = url.split('/').pop() || 'default';
        const store = new Chroma(embedding, { url: process.env.CHROMA_URL, collectionName: collectionName });
        await store.addDocuments(documents);            
    }
}

async function query() {
    const embedding = new OpenAIEmbeddings({ modelName: modelName, apiKey: openApiKey });
    const store = new Chroma(embedding, { url: process.env.CHROMA_URL, collectionName: "account-events-api-core" });
    const retriever = store.asRetriever({ k: 300 });
    const result = await retriever.invoke("Show me all the SQL statements contained in this repository?", { recursionLimit: 100, configurable: { k: 100 } });
    const context = result.map(doc => `File: ${doc.metadata.filename}\n\nContent:\n${doc.pageContent}`).join('\n\n---\n\n');
    
    const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const message = await anthropic.messages.create({
        model: "claude-3-5-sonnet-latest",
        max_tokens: 8192,
        messages: [
        {
            role: "user",
            content: `Here are code snippets from a repository. Please identify any possible performance issues. Please show the code snippet and the name of the file:\n\n${context}`
        }]
    });

    console.log("Claude's analysis:");
    console.log(message.content[0].type === "text" ? message.content[0].text : JSON.stringify(message.content[0]));
}

query().then(() => { console.log("Done");});