import { pipeline, type FeatureExtractionPipeline } from "@huggingface/transformers";

export const EMBEDDING_MODEL = "Xenova/all-MiniLM-L6-v2";
export const FALLBACK_MODEL = "local-hash-v1";
const VECTOR_DIM = 384; // matches all-MiniLM-L6-v2, so vectors stay comparable

let extractor: FeatureExtractionPipeline | null = null;
let useFallback = false;

async function getExtractor(): Promise<FeatureExtractionPipeline> {
  if (extractor) return extractor;
  extractor = await pipeline("feature-extraction", EMBEDDING_MODEL);
  return extractor;
}

/**
 * Feature-hashing bag-of-words vector. Used when the transformer model can't
 * be loaded (e.g. no network access to download it). Produces a deterministic
 * vector of the same dimensionality so cosine similarity still works, giving
 * a lexical-overlap approximation of semantic search.
 */
function hashEmbed(text: string): Float32Array {
  const vector = new Float32Array(VECTOR_DIM);
  const tokens = text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];

  for (const token of tokens) {
    let h = 2166136261; // FNV-1a offset basis
    for (let i = 0; i < token.length; i++) {
      h ^= token.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    h = h >>> 0;
    const index = h % VECTOR_DIM;
    const sign = h & 0x10000 ? 1 : -1;
    vector[index] += sign;
  }

  let norm = 0;
  for (const v of vector) norm += v * v;
  norm = Math.sqrt(norm);
  if (norm > 0) for (let i = 0; i < vector.length; i++) vector[i] /= norm;

  return vector;
}

export interface EmbeddingResult {
  vector: Float32Array;
  model: string;
}

/** Generates a normalized embedding vector for a piece of text. */
export async function embed(text: string): Promise<EmbeddingResult> {
  if (!useFallback) {
    try {
      const model = await getExtractor();
      const output = await model(text, { pooling: "mean", normalize: true });
      return { vector: Float32Array.from(output.data as Float32Array), model: EMBEDDING_MODEL };
    } catch (err) {
      useFallback = true;
      console.error(
        `[embeddings] modelo '${EMBEDDING_MODEL}' indisponível (${(err as Error).message}). ` +
          `Usando fallback local '${FALLBACK_MODEL}' (busca lexical aproximada).`
      );
    }
  }
  return { vector: hashEmbed(text), model: FALLBACK_MODEL };
}

/** Generates embeddings for multiple texts (sequentially, model is small). */
export async function embedAll(texts: string[]): Promise<EmbeddingResult[]> {
  const results: EmbeddingResult[] = [];
  for (const text of texts) {
    results.push(await embed(text));
  }
  return results;
}

export function vectorToBuffer(vector: Float32Array): Buffer {
  return Buffer.from(vector.buffer, vector.byteOffset, vector.byteLength);
}

export function bufferToVector(buffer: Buffer | Uint8Array): Float32Array {
  return new Float32Array(
    buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
  );
}

export function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  if (a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
