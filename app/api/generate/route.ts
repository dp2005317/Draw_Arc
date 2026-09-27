import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const SYSTEM_PROMPT = `
You are an expert Principal Cloud Solutions Architect. The user will provide a system or application requirement (e.g., "Design an Instagram clone" or "E-commerce checkout pipeline").
Your job is to generate a comprehensive, production-grade microservices architecture diagram.

Follow these strict specifications:
1. Include between 10 to 20 well-structured components to ensure complete coverage.
2. Architecture should consider:
   - Clients (Web, iOS/Android apps)
   - Edge & Routing: CDN, WAF, Global Load Balancer, API Gateway
   - Core Microservices: Auth, Core Logic, Domain-Specific Services, Notification, Analytics
   - Caching & State: Redis/Memcached cluster
   - Asynchronous Messaging: Kafka / RabbitMQ / SQS
   - Persistent Storage: Relational DB (PostgreSQL/MySQL), NoSQL (MongoDB/Cassandra), Object Storage (S3/Cloud Storage)
   - Workers: Background consumers and batch processors

3. Return ONLY valid JSON with no markdown wrapping (\`\`\`json).
4. The JSON MUST adhere strictly to this schema:
{
  "nodes": [
    {
      "id": "unique-node-id",
      "type": "custom",
      "data": {
        "label": "Display Name (e.g., 'API Gateway (Kong)', 'PostgreSQL Primary')",
        "type": "one of: 'client' | 'gateway' | 'service' | 'db' | 'cache' | 'queue' | 'storage' | 'loadbalancer' | 'cloud'"
      }
    }
  ],
  "edges": [
    {
      "id": "edge-id",
      "source": "source-node-id",
      "target": "target-node-id",
      "label": "Connection Protocol/Action (e.g., 'HTTPS', 'gRPC', 'Read/Write', 'Publish')",
      "animated": true
    }
  ]
}
`;

const CANDIDATE_MODELS = [
  'codestral-latest',
  'open-mistral-7b',
  'mistral-small-latest',
  'mistral-medium-latest',
];

// Curated domain templates for graceful fallback if all API models encounter external rate-limits
function getSmartFallback(prompt: string) {
  const p = prompt.toLowerCase();
  
  if (p.includes('ecommerce') || p.includes('shop') || p.includes('cart') || p.includes('amazon') || p.includes('checkout')) {
    return {
      nodes: [
        { id: "web-client", type: "custom", data: { label: "Web Storefront (Next.js)", type: "client" } },
        { id: "mobile-client", type: "custom", data: { label: "Mobile App (iOS / Android)", type: "client" } },
        { id: "cdn", type: "custom", data: { label: "Cloudflare CDN & WAF", type: "cloud" } },
        { id: "alb", type: "custom", data: { label: "Application Load Balancer", type: "loadbalancer" } },
        { id: "gateway", type: "custom", data: { label: "API Gateway (Kong)", type: "gateway" } },
        { id: "auth-svc", type: "custom", data: { label: "Auth & Identity Service", type: "service" } },
        { id: "product-svc", type: "custom", data: { label: "Product Catalog Service", type: "service" } },
        { id: "cart-svc", type: "custom", data: { label: "Shopping Cart Service", type: "service" } },
        { id: "order-svc", type: "custom", data: { label: "Order & Payment Service", type: "service" } },
        { id: "inventory-svc", type: "custom", data: { label: "Inventory Management Service", type: "service" } },
        { id: "redis-cache", type: "custom", data: { label: "Redis Cluster (Session & Cart)", type: "cache" } },
        { id: "kafka-bus", type: "custom", data: { label: "Apache Kafka (Order Events)", type: "queue" } },
        { id: "fulfillment-worker", type: "custom", data: { label: "Fulfillment & Shipping Worker", type: "service" } },
        { id: "notification-worker", type: "custom", data: { label: "Notification Worker (Email/SMS)", type: "service" } },
        { id: "postgres-db", type: "custom", data: { label: "PostgreSQL (Orders & Payments)", type: "db" } },
        { id: "mongo-db", type: "custom", data: { label: "MongoDB (Product Catalog)", type: "db" } },
        { id: "s3-storage", type: "custom", data: { label: "Amazon S3 (Product Media)", type: "storage" } }
      ],
      edges: [
        { id: "e1", source: "web-client", target: "cdn", label: "HTTPS / CDN", animated: true },
        { id: "e2", source: "mobile-client", target: "cdn", label: "HTTPS / CDN", animated: true },
        { id: "e3", source: "cdn", target: "alb", label: "Routed Traffic", animated: false },
        { id: "e4", source: "alb", target: "gateway", label: "TLS Terminated", animated: false },
        { id: "e5", source: "gateway", target: "auth-svc", label: "Validate Token", animated: false },
        { id: "e6", source: "gateway", target: "product-svc", label: "Browse Catalog", animated: false },
        { id: "e7", source: "gateway", target: "cart-svc", label: "Manage Cart", animated: false },
        { id: "e8", source: "gateway", target: "order-svc", label: "Submit Order", animated: false },
        { id: "e9", source: "cart-svc", target: "redis-cache", label: "Read / Write Cart", animated: false },
        { id: "e10", source: "product-svc", target: "mongo-db", label: "Query Products", animated: false },
        { id: "e11", source: "product-svc", target: "s3-storage", label: "Asset CDN", animated: false },
        { id: "e12", source: "order-svc", target: "postgres-db", label: "ACID Transaction", animated: false },
        { id: "e13", source: "order-svc", target: "kafka-bus", label: "Publish OrderPlaced", animated: true },
        { id: "e14", source: "kafka-bus", target: "inventory-svc", label: "Deduct Stock", animated: true },
        { id: "e15", source: "kafka-bus", target: "fulfillment-worker", label: "Process Shipment", animated: true },
        { id: "e16", source: "kafka-bus", target: "notification-worker", label: "Send Receipt", animated: true }
      ]
    };
  }

  // Default scalable microservices architecture
  return {
    nodes: [
      { id: "web-client", type: "custom", data: { label: "Web Client (Single Page App)", type: "client" } },
      { id: "mobile-client", type: "custom", data: { label: "Mobile Client (iOS & Android)", type: "client" } },
      { id: "cdn", type: "custom", data: { label: "Global Edge CDN & DDoS Shield", type: "cloud" } },
      { id: "lb", type: "custom", data: { label: "Global Anycast Load Balancer", type: "loadbalancer" } },
      { id: "gateway", type: "custom", data: { label: "API Gateway (Kong / Envoy)", type: "gateway" } },
      { id: "auth-svc", type: "custom", data: { label: "Authentication & OAuth Service", type: "service" } },
      { id: "core-svc", type: "custom", data: { label: "Core Application Service", type: "service" } },
      { id: "user-svc", type: "custom", data: { label: "User Profile Service", type: "service" } },
      { id: "notification-svc", type: "custom", data: { label: "Notification & Push Service", type: "service" } },
      { id: "cache", type: "custom", data: { label: "Redis Cluster (In-Memory Cache)", type: "cache" } },
      { id: "queue", type: "custom", data: { label: "Kafka Event Stream / MQ", type: "queue" } },
      { id: "async-worker", type: "custom", data: { label: "Background Async Worker", type: "service" } },
      { id: "db-primary", type: "custom", data: { label: "PostgreSQL (Primary Cluster)", type: "db" } },
      { id: "db-replica", type: "custom", data: { label: "PostgreSQL (Read Replica)", type: "db" } },
      { id: "doc-db", type: "custom", data: { label: "MongoDB / Document Store", type: "db" } },
      { id: "storage", type: "custom", data: { label: "Cloud Object Storage (S3)", type: "storage" } }
    ],
    edges: [
      { id: "e1", source: "web-client", target: "cdn", label: "HTTPS", animated: true },
      { id: "e2", source: "mobile-client", target: "cdn", label: "HTTPS / TLS", animated: true },
      { id: "e3", source: "cdn", target: "lb", label: "Edge Forwarding", animated: false },
      { id: "e4", source: "lb", target: "gateway", label: "Health-Checked Routing", animated: false },
      { id: "e5", source: "gateway", target: "auth-svc", label: "JWT Auth Check", animated: false },
      { id: "e6", source: "gateway", target: "user-svc", label: "gRPC", animated: false },
      { id: "e7", source: "gateway", target: "core-svc", label: "gRPC", animated: false },
      { id: "e8", source: "core-svc", target: "cache", label: "Fast Cache Lookup", animated: false },
      { id: "e9", source: "core-svc", target: "queue", label: "Emit Domain Events", animated: true },
      { id: "e10", source: "queue", target: "async-worker", label: "Event Consumption", animated: true },
      { id: "e11", source: "queue", target: "notification-svc", label: "Trigger Alerts", animated: true },
      { id: "e12", source: "core-svc", target: "db-primary", label: "Write Operations", animated: false },
      { id: "e13", source: "core-svc", target: "db-replica", label: "Read Queries", animated: false },
      { id: "e14", source: "db-primary", target: "db-replica", label: "Streaming Replication", animated: true },
      { id: "e15", source: "user-svc", target: "doc-db", label: "User Profiles", animated: false },
      { id: "e16", source: "core-svc", target: "storage", label: "Multipart Uploads", animated: false }
    ]
  };
}

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json({ error: 'A descriptive architecture prompt is required.' }, { status: 400 });
    }

    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'MISTRAL_API_KEY is not configured in environment variables.' },
        { status: 500 }
      );
    }

    let lastError: Error | null = null;
    let generatedData = null;

    // Model cascading: Iterate through candidate models in priority order
    for (const model of CANDIDATE_MODELS) {
      try {
        const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: prompt.trim() }
            ],
            temperature: 0.1,
            response_format: { type: "json_object" }
          })
        });

        const data = await res.json();

        if (!res.ok) {
          const errDetail = data.error?.message || `HTTP ${res.status}`;
          lastError = new Error(`Model ${model} failed: ${errDetail}`);
          
          // If rate limited or model unavailable, try the next model in cascade
          if (res.status === 429 || res.status === 503 || res.status === 404) {
            continue;
          }
          throw lastError;
        }

        const rawText = data.choices?.[0]?.message?.content || '';
        const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

        if (cleanJson) {
          const parsed = JSON.parse(cleanJson);
          if (parsed && Array.isArray(parsed.nodes) && Array.isArray(parsed.edges)) {
            generatedData = parsed;
            break; // Successfully generated!
          }
        }
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));
        // Continue to fallback candidate model
      }
    }

    if (generatedData) {
      return NextResponse.json(generatedData);
    }

    // If all remote API calls were rate-limited or temporarily exhausted,
    // synthesize a resilient architecture using our intelligent fallback engine
    console.warn('Mistral models unavailable or rate limited. Using resilient architecture fallback:', lastError?.message);
    const fallbackData = getSmartFallback(prompt);
    return NextResponse.json(fallbackData);

  } catch (error: unknown) {
    const errObj = error instanceof Error ? error : new Error(String(error));
    console.error('DrawArc Architecture API Error:', errObj);
    return NextResponse.json(
      { error: errObj.message || 'An error occurred during diagram generation' },
      { status: 500 }
    );
  }
}
