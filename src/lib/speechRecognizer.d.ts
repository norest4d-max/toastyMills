// Type declarations for ToastyMills local JS modules

export interface RecognitionCorrection {
  original: string;
  corrected: string;
}

export interface RecognitionToken {
  word: string;
  tags: string[];
}

export interface RecognitionIntent {
  intentId: string;
  label: string;
  intent: string;
}

export interface RecognitionResult {
  transcript: string;
  normalizedTranscript: string;
  tokens: RecognitionToken[];
  corrections: RecognitionCorrection[];
  intent: RecognitionIntent | null;
  intentResponse: string | null;
  confidence: number;
  stages: {
    acoustic: string;
    phoneme: string;
    lm: string;
  };
}

declare module "../lib/speechRecognizer.js" {
  export function recognize(rawInput: string): RecognitionResult;
  export function quickRecognize(rawInput: string): {
    intent: string | null;
    response: string | null;
    confidence: number;
  };
}
