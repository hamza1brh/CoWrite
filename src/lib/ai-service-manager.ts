// AI Service Configuration
export interface AIServiceConfig {
  name: string;
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
  enabled: boolean;
  priority: number; // Lower number = higher priority
}

// AI Request/Response interfaces
export interface AIRequest {
  text: string;
  task: "grammar" | "improve" | "summarize" | "custom";
  options?: {
    temperature?: number;
    maxTokens?: number;
    model?: string;
    customPrompt?: string; // For custom tasks
    customTitle?: string;
    customDescription?: string;
  };
}

export interface AIResponse {
  success: boolean;
  result?: string;
  error?: string;
  service?: string;
  processingTime?: number;
}

// Service health check response
export interface HealthCheckResponse {
  status: "healthy" | "unhealthy";
  service: string;
  latency?: number;
  error?: string;
}

export class AIServiceManager {
  private services: AIServiceConfig[] = [];
  private healthCheckCache = new Map<
    string,
    { status: string; timestamp: number }
  >();
  private readonly HEALTH_CHECK_TTL = 30000;

  constructor() {
    this.loadServicesFromEnv();
  }

  // Dummy service for development/testing
  private generateDummyResponse(task: string, text: string): string {
    const responses = {
      grammar:
        text
          .replace(/helllo/gi, "hello")
          .replace(/\bi ve\b/gi, "I've")
          .replace(/\balll\b/gi, "all")
          .replace(/\bthise\b/gi, "these")
          .replace(/\byou d\b/gi, "you'd")
          .replace(/\bits\b/gi, "it's")
          .replace(/\bmistaks\b/gi, "mistakes")
          .replace(/\bsentance\b/gi, "sentence") ||
        "This is a corrected version with proper grammar and spelling.",

      improve: text
        ? `Enhanced version: ${text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()}. This revision demonstrates improved clarity, better flow, and more sophisticated vocabulary while maintaining the original meaning and intent.`
        : "This is an enhanced version with improved writing style, better flow, and more engaging language.",

      summarize: text
        ? `Summary: ${text
            .split(" ")
            .slice(0, Math.min(10, text.split(" ").length))
            .join(
              " "
            )}${text.split(" ").length > 10 ? "..." : ""} - Key points extracted and condensed.`
        : "This is a concise summary highlighting the main points and key information.",

      custom: `Custom response for: ${text || "your request"}`,
    };

    return responses[task as keyof typeof responses] || responses.custom;
  }

  private loadServicesFromEnv() {
    // Load services from environment variables
    const services: AIServiceConfig[] = [];

    // Local development service (ngrok/pinggy)
    if (process.env.AI_LOCAL_URL) {
      services.push({
        name: "local",
        baseUrl: process.env.AI_LOCAL_URL,
        apiKey: process.env.AI_LOCAL_API_KEY,
        timeout: 10000,
        enabled: process.env.AI_LOCAL_ENABLED !== "false",
        priority: 1,
      });
    }

    // DigitalOcean Droplet service
    if (process.env.AI_DROPLET_URL) {
      services.push({
        name: "droplet",
        baseUrl: process.env.AI_DROPLET_URL,
        apiKey: process.env.AI_DROPLET_API_KEY,
        timeout: 15000,
        enabled: process.env.AI_DROPLET_ENABLED !== "false",
        priority: 2,
      });
    }

    // Additional services can be added here
    if (process.env.AI_BACKUP_URL) {
      services.push({
        name: "backup",
        baseUrl: process.env.AI_BACKUP_URL,
        apiKey: process.env.AI_BACKUP_API_KEY,
        timeout: 20000,
        enabled: process.env.AI_BACKUP_ENABLED !== "false",
        priority: 3,
      });
    }

    // Sort by priority (lower number = higher priority)
    this.services = services
      .filter(s => s.enabled)
      .sort((a, b) => a.priority - b.priority);

    console.log(
      `🔧 Loaded ${this.services.length} AI services:`,
      this.services.map(s => `${s.name} (${s.baseUrl})`)
    );
  }

  // Health check for a specific service
  async checkServiceHealth(
    service: AIServiceConfig
  ): Promise<HealthCheckResponse> {
    const cacheKey = service.name;
    const cached = this.healthCheckCache.get(cacheKey);

    // Return cached result if still valid
    if (cached && Date.now() - cached.timestamp < this.HEALTH_CHECK_TTL) {
      return {
        status: cached.status as "healthy" | "unhealthy",
        service: service.name,
      };
    }

    try {
      const startTime = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        service.timeout || 5000
      );

      const response = await fetch(`${service.baseUrl}/health`, {
        method: "GET",
        headers: service.apiKey
          ? { Authorization: `Bearer ${service.apiKey}` }
          : {},
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const latency = Date.now() - startTime;

      if (response.ok) {
        this.healthCheckCache.set(cacheKey, {
          status: "healthy",
          timestamp: Date.now(),
        });
        return { status: "healthy", service: service.name, latency };
      } else {
        this.healthCheckCache.set(cacheKey, {
          status: "unhealthy",
          timestamp: Date.now(),
        });
        return {
          status: "unhealthy",
          service: service.name,
          error: `HTTP ${response.status}`,
        };
      }
    } catch (error) {
      this.healthCheckCache.set(cacheKey, {
        status: "unhealthy",
        timestamp: Date.now(),
      });
      return {
        status: "unhealthy",
        service: service.name,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Make AI request to a specific service
  async makeRequest(
    service: AIServiceConfig,
    request: AIRequest
  ): Promise<AIResponse> {
    try {
      const startTime = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        service.timeout || 30000
      );

      const response = await fetch(`${service.baseUrl}/ai/process`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(service.apiKey
            ? { Authorization: `Bearer ${service.apiKey}` }
            : {}),
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const processingTime = Date.now() - startTime;

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        success: true,
        result: data.result || data.correctedText || data.text,
        service: service.name,
        processingTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        service: service.name,
      };
    }
  }

  // Process AI request with automatic failover
  async processRequest(request: AIRequest): Promise<AIResponse> {
    // Use dummy service if no real services are configured and we're in development
    if (this.services.length === 0) {
      console.log("🎭 Using dummy AI service for development");
      const startTime = Date.now();

      // Simulate some processing time
      await new Promise(resolve =>
        setTimeout(resolve, 500 + Math.random() * 1000)
      );

      const result = this.generateDummyResponse(request.task, request.text);
      const processingTime = Date.now() - startTime;

      return {
        success: true,
        result,
        service: "dummy",
        processingTime,
      };
    }

    const errors: string[] = [];

    // Try each service in priority order
    for (const service of this.services) {
      console.log(`🤖 Trying AI service: ${service.name} (${service.baseUrl})`);

      // Quick health check first
      const health = await this.checkServiceHealth(service);
      if (health.status === "unhealthy") {
        console.log(`⚠️ Service ${service.name} is unhealthy, skipping`);
        errors.push(`${service.name}: unhealthy`);
        continue;
      }

      // Make the actual request
      const response = await this.makeRequest(service, request);

      if (response.success) {
        console.log(
          `✅ AI request successful via ${service.name} in ${response.processingTime}ms`
        );
        return response;
      } else {
        console.log(
          `❌ AI request failed via ${service.name}: ${response.error}`
        );
        errors.push(`${service.name}: ${response.error}`);
        continue;
      }
    }

    // All services failed
    return {
      success: false,
      error: `All AI services failed: ${errors.join(", ")}`,
    };
  }

  // Get service status for debugging
  async getServicesStatus(): Promise<{ [key: string]: HealthCheckResponse }> {
    const status: { [key: string]: HealthCheckResponse } = {};

    for (const service of this.services) {
      status[service.name] = await this.checkServiceHealth(service);
    }

    return status;
  }

  // Reload services configuration
  reloadServices() {
    this.services = [];
    this.healthCheckCache.clear();
    this.loadServicesFromEnv();
  }
}

// Singleton instance
export const aiServiceManager = new AIServiceManager();
