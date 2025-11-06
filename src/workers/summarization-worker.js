// ninja focus touch <
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

self.addEventListener("message", async (event) => {
    const message = event.data;

    let summary = await summarize(
        message.text,
        message.model
    );
    if (summary === null) return;

    // Send the result back to the main thread
    self.postMessage({
        status: "complete",
        task: "summarization",
        data: summary,
    });
});

class SummarizationPipelineFactory extends PipelineFactory {
    static task = "summarization";
    static model = null;
}

const summarize = async (
    text,
    model,
) => {
    // Use the model name directly, prepending "Xenova/" if not already present
    const modelName = model.startsWith("Xenova/") ? model : `Xenova/${model}`;

    const p = SummarizationPipelineFactory;
    if (p.model !== modelName) {
        // Invalidate model if different
        p.model = modelName;

        if (p.instance !== null) {
            (await p.getInstance()).dispose();
            p.instance = null;
        }
    }

    // Load summarizer model
    let summarizer = await p.getInstance((data) => {
        self.postMessage(data);
    });

    // Actually run summarization
    let output = await summarizer(text, {
        max_length: 150,
        min_length: 40,
    }).catch((error) => {
        self.postMessage({
            status: "error",
            task: "summarization",
            data: error,
        });
        return null;
    });

    if (output === null) return null;

    return output[0].summary_text;
};
// ninja focus touch >