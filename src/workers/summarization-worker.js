/* eslint-disable camelcase */
import { pipeline, env } from "@xenova/transformers";

// Disable local models
env.allowLocalModels = false;

// Define model factories
// Ensures only one model is created of each type
class PipelineFactory {
    static task = null;
    static model = null;
    static instance = null;

    constructor(tokenizer, model) {
        this.tokenizer = tokenizer;
        this.model = model;
    }

    static async getInstance(progress_callback = null) {
        if (this.instance === null) {
            this.instance = pipeline(this.task, this.model, {
                progress_callback
            });
        }

        return this.instance;
    }
}

class SummarizationPipelineFactory extends PipelineFactory {
    static task = "summarization";
    static model = null;
}

self.addEventListener("message", async (event) => {
    try {
        const { text, model } = event.data;
    
        const p = SummarizationPipelineFactory;
        if (p.model !== model) {
            // Invalidate model if different
            p.model = model;
    
            if (p.instance !== null) {
                (await p.getInstance()).dispose();
                p.instance = null;
            }
        }
    
        // Load summarizer model
        const summarizer = await p.getInstance(data => {
            self.postMessage(data);
        });

        // Actually run summarization
        const output = await summarizer(text, {
            max_length: 150,
            min_length: 40
        });

        const summary = output[0].summary_text;

        // Send the result back to the main thread
        self.postMessage({
            status: "complete",
            task: "summarization",
            data: summary
        });
    } catch (error) {
        self.postMessage({
            status: "error",
            task: "summarization",
            data: error
        });
    }
});