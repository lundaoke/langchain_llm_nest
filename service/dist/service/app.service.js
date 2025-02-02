"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppService = void 0;
const common_1 = require("@nestjs/common");
const text_1 = require("langchain/document_loaders/fs/text");
const docx_1 = require("langchain/document_loaders/fs/docx");
const pdf_1 = require("langchain/document_loaders/fs/pdf");
const directory_1 = require("langchain/document_loaders/fs/directory");
const chatglm_6b_1 = require("../chat_models/chatglm-6b");
const chains_1 = require("langchain/chains");
const text2vec_large_chinese_embedding_1 = require("../embeddings/text2vec-large-chinese.embedding");
const myVectorStore_1 = require("../vector_store/myVectorStore");
const prompts_1 = require("langchain/prompts");
const text_splitter_1 = require("langchain/text_splitter");
let AppService = class AppService {
    async refactorVectorStore() {
        const loader = new directory_1.DirectoryLoader("./fileUpload", {
            ".txt": (path) => new text_1.TextLoader(path),
            ".docx": (path) => new docx_1.DocxLoader(path),
            ".pdf": (path) => new pdf_1.PDFLoader(path),
        });
        const textsplitter = new text_splitter_1.RecursiveCharacterTextSplitter({
            separators: ["\n\n", "\n", "。", "！", "？"],
            chunkSize: 400,
            chunkOverlap: 100,
        });
        const docs = await loader.loadAndSplit(textsplitter);
        myVectorStore_1.MyVectorStore.resetInstance(docs, new text2vec_large_chinese_embedding_1.T2VLargeChineseEmbeddings());
    }
    async chatfile(chatcontent, history) {
        const loadedVectorStore = await myVectorStore_1.MyVectorStore.getInstance().hnswlibStore;
        const result = await loadedVectorStore.similaritySearch(chatcontent, 1);
        const fileSourceStr = result[0].metadata.source;
        const chat = new chatglm_6b_1.ChatGlm6BLLM({ temperature: 0.01, history: history });
        const translationPrompt = prompts_1.ChatPromptTemplate.fromPromptMessages([
            prompts_1.SystemMessagePromptTemplate.fromTemplate(`基于已知内容, 回答用户问题。如果无法从中得到答案，请说'没有足够的相关信息'。已知内容:${result[0].pageContent}`),
            prompts_1.HumanMessagePromptTemplate.fromTemplate("{text}"),
        ]);
        const chain = new chains_1.LLMChain({
            prompt: translationPrompt,
            llm: chat,
        });
        const response = await chain.call({
            text: chatcontent,
        });
        return {
            response: response,
            url: '/static/' + fileSourceStr.split("\\")[fileSourceStr.split("\\").length - 1]
        };
    }
    async chat(chatcontent, history) {
        const chat = new chatglm_6b_1.ChatGlm6BLLM({ temperature: 0.01, history: history });
        const translationPrompt = prompts_1.ChatPromptTemplate.fromPromptMessages([
            prompts_1.SystemMessagePromptTemplate.fromTemplate(`你是开江内部助手，可以回答用户的问题，提供有用信息，帮助完成文字工作`),
            prompts_1.HumanMessagePromptTemplate.fromTemplate("{text}"),
        ]);
        const chain = new chains_1.LLMChain({
            prompt: translationPrompt,
            llm: chat,
        });
        const response = await chain.call({
            text: chatcontent,
        });
        return response;
    }
    getHello() {
        return { hello: 'world' };
    }
};
AppService = __decorate([
    (0, common_1.Injectable)()
], AppService);
exports.AppService = AppService;
//# sourceMappingURL=app.service.js.map