import { Document } from "@langchain/core/documents";
import { TextSplitter } from "@langchain/textsplitters";
import axios, { AxiosRequestConfig } from "axios";
import unzipper from "unzipper";
import { DataSource } from "../types";

export class BitBucketDataSource implements DataSource {

    private _url: string;
    private _username: string;
    private _password: string;
    private _textSplitter: TextSplitter;

    constructor(url: string, username: string, password: string, textSplitter: TextSplitter) {
        this._url = url;
        this._username = username;
        this._password = password;
        this._textSplitter = textSplitter;
    }

    public async getDocuments(): Promise<Document[]> {
        const zipFile = await this.getProjectZip();
        const zip = await unzipper.Open.buffer(zipFile);
        const documents: Document[] = [];
        for (const file of zip.files) {
            if (this.isTextFile(file)) {
                const rawContent = await file.buffer().then(b => b.toString('utf-8'));
                // Remove the first folder from the filename by taking everything after the first slash
                const filename = file.path.includes('/') ? file.path.substring(file.path.indexOf('/')) : file.path;
                documents.push(...await this._textSplitter.createDocuments([rawContent], [{ filename: filename, source: this._url }]));
            }
        }
        return documents;
    }

    private isTextFile(file: unzipper.File) {
        return file.type === "File" && (file.path.endsWith(".cs") || file.path.endsWith(".sql") || file.path.endsWith(".md"));
    }

    /**
     * Get the zip file for the project.
     * @returns The zip file as a buffer.
     */
    private async getProjectZip(): Promise<Buffer> {
        const config: AxiosRequestConfig = {
            responseType: 'arraybuffer',
            maxRedirects: 10,
            withCredentials: true,
            auth: { username: this._username, password: this._password }
        };
        try {
            const response = await axios.get(`${this._url}/get/main.zip`, config);
            return response.data;
        } catch (error: any) {
            if (error.response && error.response.status !== 404) {
                throw error;
            }
            const response = await axios.get(`${this._url}/get/master.zip`, config);
            return response.data;
        }
    }
}

