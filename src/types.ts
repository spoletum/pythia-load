import { Document } from "@langchain/core/documents";

export interface DataSource {
    getDocuments(): Promise<Document[]>;
}
