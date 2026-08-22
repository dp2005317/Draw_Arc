import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const SYSTEM_PROMPT = `
You are an expert Principal Cloud Architect. The user will ask for a system architecture (e.g., "Design an Instagram clone").
Your job is to generate a HIGHLY DETAILED, production-ready microservices architecture. 
You MUST include a large number of components (10 to 20 nodes) to make it comprehensive.
Think about: CDNs, WAFs, API Gateways, Load Balancers, multiple specific Microservices (Auth, User, Feed, Notification, etc.), Message Queues (Kafka/RabbitMQ), Caching (Redis), Primary Databases (PostgreSQL), NoSQL stores (MongoDB/Cassandra), Object Storage (S3), and Background Workers.

Return ONLY valid JSON without any markdown formatting.
The nodes array should contain objects with:
- id: A unique string identifier.
- type: 'custom'
- data: An object with:
  - label: The display name (e.g., 'API Gateway', 'User Service', 'Kafka', 'Redis Cache').
  - type: The category of the node. MUST be exactly one of: 'client', 'gateway', 'service', 'db', 'cache', 'queue', 'storage', 'loadbalancer'. This determines the icon.

The edges array should contain objects with:
- id: A unique string identifier (e.g., 'e1-2').
- source: The id of the source node.
- target: The id of the target node.
- label: (Optional) A brief description of the connection (e.g., 'REST', 'gRPC', 'Reads', 'Writes').
- animated: true (use true for async flows, streams, or queues, false for sync requests)

CRITICAL: Return ONLY the raw JSON string. No markdown block (\`\`\`json).
`;

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'MISTRAL_API_KEY is not configured in environment variables.' }, { status: 500 });
    }
    
    const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        model: "mistral-small-latest",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" }
      })
    });

    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.error?.message || 'API Error');
    }

    const rawText = data.choices[0].message.content || '';
    
    // Clean up potential markdown formatting
    const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

    const parsedData = JSON.parse(cleanJson);
    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    
    const errorMessage = error.message || error.toString();
    
    // Only fall back to mock data for temporary 503 High Demand errors
    if (errorMessage.includes('503') || errorMessage.toLowerCase().includes('overloaded')) {
      const mockData = {
        nodes: [
          { id: "client-1", type: "custom", data: { label: "Web Application", type: "client" } },
          { id: "client-2", type: "custom", data: { label: "Mobile App (iOS/Android)", type: "client" } },
          { id: "cdn", type: "custom", data: { label: "Cloudflare CDN / WAF", type: "cloud" } },
          { id: "lb", type: "custom", data: { label: "Global Load Balancer", type: "loadbalancer" } },
          { id: "gateway", type: "custom", data: { label: "API Gateway (Kong)", type: "gateway" } },
          { id: "auth", type: "custom", data: { label: "Auth Service (OAuth)", type: "service" } },
          { id: "user-svc", type: "custom", data: { label: "User Management Service", type: "service" } },
          { id: "core-svc", type: "custom", data: { label: "Core Business Logic", type: "service" } },
          { id: "cache", type: "custom", data: { label: "Redis Cluster (Cache)", type: "cache" } },
          { id: "queue", type: "custom", data: { label: "Kafka Event Stream", type: "queue" } },
          { id: "worker-1", type: "custom", data: { label: "Async Worker (Analytics)", type: "service" } },
          { id: "worker-2", type: "custom", data: { label: "Async Worker (Notifications)", type: "service" } },
          { id: "db-primary", type: "custom", data: { label: "PostgreSQL (Primary)", type: "db" } },
          { id: "db-replica", type: "custom", data: { label: "PostgreSQL (Read Replica)", type: "db" } },
          { id: "nosql", type: "custom", data: { label: "MongoDB (Document Store)", type: "db" } },
          { id: "storage", type: "custom", data: { label: "Amazon S3 (Media Storage)", type: "storage" } }
        ],
        edges: [
          { id: "e-c1", source: "client-1", target: "cdn", animated: true },
          { id: "e-c2", source: "client-2", target: "cdn", animated: true },
          { id: "e-cdn-lb", source: "cdn", target: "lb", animated: false },
          { id: "e-lb-gw", source: "lb", target: "gateway", animated: false },
          { id: "e-gw-auth", source: "gateway", target: "auth", animated: false },
          { id: "e-gw-user", source: "gateway", target: "user-svc", animated: false },
          { id: "e-gw-core", source: "gateway", target: "core-svc", animated: false },
          { id: "e-core-cache", source: "core-svc", target: "cache", label: "Cache Check", animated: false },
          { id: "e-core-queue", source: "core-svc", target: "queue", label: "Publish Event", animated: true },
          { id: "e-auth-db", source: "auth", target: "db-primary", label: "Read/Write", animated: false },
          { id: "e-user-db", source: "user-svc", target: "db-primary", label: "Read/Write", animated: false },
          { id: "e-core-db", source: "core-svc", target: "db-primary", label: "Read/Write", animated: false },
          { id: "e-core-nosql", source: "core-svc", target: "nosql", label: "Store metadata", animated: false },
          { id: "e-db-rep", source: "db-primary", target: "db-replica", label: "Replication", animated: true },
          { id: "e-core-storage", source: "core-svc", target: "storage", label: "Upload media", animated: false },
          { id: "e-q-w1", source: "queue", target: "worker-1", label: "Consume", animated: true },
          { id: "e-q-w2", source: "queue", target: "worker-2", label: "Consume", animated: true }
        ]
      };
      
      return NextResponse.json(mockData);
    }
    
    // Otherwise return the actual error so the UI can alert the user
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
