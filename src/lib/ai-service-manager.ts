// AI Request/Response interfaces
export interface AIRequest {
  text: string;
  task: "grammar" | "summary" | "improve" | "custom";
  options?: {
    temperature?: number;
    maxTokens?: number;
    model?: string;
    customPrompt?: string;
  };
}

export interface AIResponse {
  success: boolean;
  result?: string;
  error?: string;
}

export class AIServiceManager {
  private baseUrl: string;

  constructor() {
    // Try to find any available AI service from environment
    let url = process.env.AI_LOCAL_URL || "";
    
    // Ensure URL has protocol
    if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }
    
    this.baseUrl = url;
    
    // Debug logging to see what URL we're getting
    console.log("🔍 AI Service Debug:", {
      AI_LOCAL_URL_raw: process.env.AI_LOCAL_URL,
      AI_LOCAL_URL_processed: this.baseUrl,
      constructedUrl: `${this.baseUrl}/v1/chat/completions`
    });
  }

  // Generate prompt for grammar correction
  private generatePrompt(text: string): { system: string; user: string } {
    return {
      system:
        "You are a helpful assistant. Do not use any <think> or <say> tags. Speak directly.You are a professional grammar editor. Correct grammar, spelling, and punctuation errors while preserving the original meaning and tone. Return ONLY the corrected text, no explanations./no_think",
      user: text,
    };
  }

  // Simple function to clean <think> tags from AI output
  private cleanThinkTags(text: string): string {
    if (!text) return text;

    // Remove <think>...</think> blocks (including multiline)
    return text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  }

  // Process AI request
  async processRequest(request: AIRequest): Promise<AIResponse> {
    if (!this.baseUrl) {
      return {
        success: false,
        error:
          "No AI service configured. Please set AI_LOCAL_URL in environment variables.",
      };
    }

    try {
      switch (request.task) {
        case "grammar":
          return await this.processGrammarCorrection(request);
        case "summary":
          return await this.generateSummary(request.text, request.options);
        case "improve":
          return await this.improveWriting(request.text, request.options);
        case "custom":
          return await this.processCustomTask(request.text, request.options);
        default:
          return {
            success: false,
            error: `Unsupported task: ${request.task}`,
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Process grammar correction (original logic)
  private async processGrammarCorrection(
    request: AIRequest
  ): Promise<AIResponse> {
    const prompts = this.generatePrompt(request.text);

    const requestBody = {
      model: request.options?.model || "liquid/lfm2-1.2b",
      messages: [
        { role: "system", content: prompts.system },
        { role: "user", content: prompts.user },
      ],
      temperature: request.options?.temperature || 0.1,
      max_tokens: request.options?.maxTokens || 1000,
      stream: false,
    };

    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    let result = data.choices?.[0]?.message?.content || "No response generated";

    // Clean any <think> tags from the response
    result = this.cleanThinkTags(result);

    return {
      success: true,
      result: result.trim(),
    };
  }

  async generateSummary(
    text: string,
    options?: { model?: string; temperature?: number; maxTokens?: number }
  ): Promise<AIResponse> {
    const system = `You are a helpful assistant. Do not use any <think> or <say> tags. Speak directly. You are an expert summarizer. Read the user-provided text, identify key ideas, structure, and tone. Write a concise summary in 1–2 paragraphs. Return ONLY the summary, no additional commentary./no_think`;

    const user = text;
    const requestBody = {
      model: options?.model || "qwen/qwen3-1.7b",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: options?.temperature ?? 0.2,
      max_tokens: options?.maxTokens ?? 300,
    };

    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    let result = data.choices?.[0]?.message?.content || "";
    result = this.cleanThinkTags(result);
    return { success: true, result: result.trim() };
  }

  async improveWriting(
    text: string,
    options?: { model?: string; temperature?: number; maxTokens?: number }
  ): Promise<AIResponse> {
    const system = `You are a helpful assistant. Do not use any <think> or <say> tags. Speak directly. You are a seasoned writing coach and editor. Improve clarity, flow, style, and tone of the provided text. Enhance vocabulary and phrasing while keeping intended meaning. Do NOT correct just grammar—elevate the writing quality. Return ONLY the improved version, no commentary or explanations./no_think`;

    const user = text;
    const requestBody = {
      model: options?.model || "qwen/qwen3-1.7b",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: options?.temperature ?? 0.3,
      max_tokens: options?.maxTokens ?? 600,
    };

    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    let result = data.choices?.[0]?.message?.content || "";
    result = this.cleanThinkTags(result);
    return { success: true, result: result.trim() };
  }

  async processCustomTask(
    text: string,
    options?: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      customPrompt?: string;
    }
  ): Promise<AIResponse> {
    if (!options?.customPrompt) {
      return {
        success: false,
        error: "Custom prompt is required for custom tasks",
      };
    }

    const system = `You are a helpful assistant. Do not use any <think> or <say> tags. Speak directly. ${options.customPrompt} Return ONLY the processed text, no additional commentary or explanations./no_think`;

    const user = text;
    const requestBody = {
      model: options?.model || "qwen/qwen3-1.7b",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: options?.temperature ?? 0.3,
      max_tokens: options?.maxTokens ?? 600,
    };

    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    let result = data.choices?.[0]?.message?.content || "";
    result = this.cleanThinkTags(result);
    return { success: true, result: result.trim() };
  }
}

// Singleton instance
export const aiServiceManager = new AIServiceManager();
