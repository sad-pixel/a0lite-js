import * as ort from 'onnxruntime-web';

export class NeuralNetwork {
    private model: ort.InferenceSession | null;

    constructor() {
        this.model = null;
    }

    public initialized(): boolean {
        return this.model !== null;
    }

    async loadModel(modelPath: string): Promise<void> {
        try {
            this.model = await ort.InferenceSession.create(modelPath);
            console.log('Model loaded successfully.');
        } catch (error) {
            console.error('Failed to load model:', error);
        }
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