import * as ort from 'onnxruntime-web';
import * as path from 'path';

export class NeuralNetwork {
    private model: ort.InferenceSession | null;
    private isLegacy: boolean;

    constructor() {
        this.model = null;
        this.isLegacy = true;
    }

    public initialized(): boolean {
        return this.model !== null;
    }

    async loadModel(modelPath: string): Promise<void> {
        try {
            this.model = await ort.InferenceSession.create(modelPath);
            if (this.model.outputNames.includes("/output/wdl")) {
                this.isLegacy = false;
            }
            // console.log('Model loaded successfully.');
        } catch (error) {
            console.error('Failed to load model:', error);
        }
    }

    public isLegacyModel(): boolean {
        return this.isLegacy;
    }

    async predict(inputData: number[][][][]): Promise<ort.InferenceSession.OnnxValueMapType | null> {
        if (!this.model) {
            throw new Error('Model is not loaded.');
        }

        try {
            const feeds = { '/input/planes': new ort.Tensor('float32', inputData.flat(3), [inputData.length, 112, 8, 8]) };
            const results = await this.model.run(feeds);
            return results;
        } catch (error) {
            console.error('Prediction failed:', error);
            return null;
        }
    }
}

export function getModelPath(modelName: string): string {
    return path.join(__dirname, '..', 'nets', 'lc0.onnx')
}