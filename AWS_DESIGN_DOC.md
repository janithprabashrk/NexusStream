# NexusStream - AWS Cloud Architecture Design Document

> **SPEC REFERENCE**: "Design Doc detailing the theoretical AWS deployment plan"
>
> This document outlines the recommended AWS architecture for deploying NexusStream in a production environment, including compute, streaming, storage choices, and the reasoning behind each decision.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [Compute Layer](#3-compute-layer)
4. [Message Streaming Layer](#4-message-streaming-layer)
5. [Data Storage Layer](#5-data-storage-layer)
6. [API Gateway & Load Balancing](#6-api-gateway--load-balancing)
7. [Security & Authentication](#7-security--authentication)
8. [Monitoring & Observability](#8-monitoring--observability)
9. [Cost Estimation](#9-cost-estimation)
10. [Disaster Recovery & High Availability](#10-disaster-recovery--high-availability)
11. [Migration Path from Current Architecture](#11-migration-path-from-current-architecture)

---

## 1. Executive Summary

### Business Requirements
- Process order feeds from multiple partners (Partner A, Partner B, future partners)
- Validate, transform, and persist orders in real-time
- Provide query APIs for dashboard and reporting
- Handle error orders separately for review and reprocessing
- Scale to handle peak loads (estimated 10,000+ orders/minute)

### Recommended Architecture
A **serverless-first** approach using:
- **AWS Lambda** or **ECS Fargate** for compute
- **Amazon SQS** with dead-letter queues for message streaming
- **Amazon Aurora PostgreSQL** for relational storage
- **Amazon API Gateway** for REST API management
- **Amazon CloudWatch** for monitoring

### Why This Architecture?
- **Cost-effective**: Pay-per-use for compute, no idle server costs
- **Scalable**: Auto-scales based on demand
- **Resilient**: Multi-AZ deployment with automatic failover
- **Secure**: VPC isolation, IAM roles, encrypted data at rest/transit

---

## 2. Architecture Overview

### High-Level Diagram

```
                                    ┌─────────────────────────────────────────────────────────────────┐
                                    │                         AWS Cloud                               │
                                    │                                                                 │
┌──────────────┐                    │  ┌─────────────────┐     ┌─────────────────────────────────┐   │
│  Partner A   │───────────────────────│                 │     │         VPC (Private)           │   │
│  (External)  │         HTTPS      │  │   API Gateway   │────▶│                                 │   │
└──────────────┘                    │  │  + WAF + Shield │     │  ┌───────────────────────────┐  │   │
                                    │  │                 │     │  │    ECS Fargate Cluster    │  │   │
┌──────────────┐                    │  └─────────────────┘     │  │                           │  │   │
│  Partner B   │───────────────────────         │              │  │  ┌─────────────────────┐  │  │   │
│  (External)  │         HTTPS      │           │              │  │  │   Feed Handler      │  │  │   │
└──────────────┘                    │           ▼              │  │  │   Service           │──┼──┼───┼──▶ SQS Valid Orders
                                    │  ┌─────────────────┐     │  │  │                     │  │  │   │
                                    │  │  Network Load   │────▶│  │  └─────────────────────┘  │  │   │
                                    │  │  Balancer (NLB) │     │  │                           │  │   │
                                    │  └─────────────────┘     │  │  ┌─────────────────────┐  │  │   │
                                    │                          │  │  │   Query Service     │  │  │   │
                                    │                          │  │  │                     │──┼──┼───┼──▶ Aurora PostgreSQL
                                    │                          │  │  └─────────────────────┘  │  │   │
                                    │                          │  │                           │  │   │
                                    │                          │  └───────────────────────────┘  │   │
                                    │                          │                                 │   │
┌──────────────┐                    │                          │  ┌───────────────────────────┐  │   │
│ React        │───────────────────────── CloudFront ────────────▶│  S3 (Static Hosting)     │  │   │
│ Dashboard    │        HTTPS       │                          │  └───────────────────────────┘  │   │
└──────────────┘                    │                          │                                 │   │
                                    │                          └─────────────────────────────────┘   │
                                    │                                                                 │
                                    │  ┌─────────────────────────────────────────────────────────┐   │
                                    │  │                    SQS Queues                            │   │
                                    │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │   │
                                    │  │  │ valid_orders│  │error_orders │  │ DLQ (retries)   │  │   │
                                    │  │  └──────┬──────┘  └──────┬──────┘  └─────────────────┘  │   │
                                    │  │         │                │                              │   │
                                    │  └─────────┼────────────────┼──────────────────────────────┘   │
                                    │            │                │                                   │
                                    │            ▼                ▼                                   │
                                    │  ┌─────────────────────────────────────────────────────────┐   │
                                    │  │              Lambda Functions (Consumers)               │   │
                                    │  │  ┌─────────────────┐    ┌─────────────────────┐        │   │
                                    │  │  │ Order Persister │    │  Error Logger       │        │   │
                                    │  │  │ (writes to DB)  │    │  (writes to DynamoDB)│        │   │
                                    │  │  └────────┬────────┘    └──────────┬──────────┘        │   │
                                    │  │           │                        │                    │   │
                                    │  └───────────┼────────────────────────┼────────────────────┘   │
                                    │              │                        │                        │
                                    │              ▼                        ▼                        │
                                    │  ┌─────────────────┐     ┌─────────────────┐                   │
                                    │  │ Aurora          │     │ DynamoDB        │                   │
                                    │  │ PostgreSQL      │     │ (Error Events)  │                   │
                                    │  │ (Orders)        │     │                 │                   │
                                    │  └─────────────────┘     └─────────────────┘                   │
                                    │                                                                 │
                                    └─────────────────────────────────────────────────────────────────┘
```

---

## 3. Compute Layer

### Option A: AWS Lambda (Serverless) - Recommended for Variable Load

| Aspect | Details |
|--------|---------|
| **Service** | AWS Lambda |
| **Runtime** | Node.js 20.x |
| **Memory** | 512 MB - 1024 MB per function |
| **Timeout** | 30 seconds (API), 5 minutes (stream consumers) |
| **Concurrency** | 1000 (default, can increase) |

**Pros**:
- Zero management overhead
- Pay only for actual execution time
- Auto-scales to handle traffic spikes
- Perfect for event-driven architecture

**Cons**:
- Cold start latency (mitigated with provisioned concurrency)
- 15-minute max execution time
- 10 GB max deployment package

**Lambda Functions**:
```
├── api-feed-handler        # Receives partner orders via API Gateway
├── api-query-handler       # Handles order queries and stats
├── sqs-order-persister     # Consumes valid_orders queue, writes to Aurora
├── sqs-error-handler       # Consumes error_orders queue, writes to DynamoDB
└── scheduled-stats-cache   # Cron job to pre-compute statistics
```

### Option B: ECS Fargate - Recommended for Consistent High Load

| Aspect | Details |
|--------|---------|
| **Service** | Amazon ECS with Fargate |
| **Container** | Node.js 20 Alpine image |
| **vCPU** | 0.5 - 2 vCPU per task |
| **Memory** | 1 GB - 4 GB per task |
| **Scaling** | Target tracking (CPU 70%) |

**Pros**:
- No cold starts
- Persistent connections (WebSocket support for future features)
- More control over runtime environment
- Better for long-running processes

**Cons**:
- Higher base cost (always-on containers)
- More operational complexity

**Task Definitions**:
```
├── feed-handler-service    # Stateless API for order ingestion
├── query-service           # Stateless API for order queries
└── stream-consumer-worker  # Polls SQS queues, processes messages
```

### Recommendation

| Use Case | Recommended Option |
|----------|-------------------|
| Startup/Low traffic (<1000 orders/min) | **Lambda** |
| Production/High traffic (>5000 orders/min) | **ECS Fargate** |
| Hybrid approach | Lambda for API, ECS for stream consumers |

---

## 4. Message Streaming Layer

### Why Amazon SQS (Not Kinesis or MSK)?

| Service | Use Case | Why Not for NexusStream |
|---------|----------|------------------------|
| **Amazon SQS** ✅ | Decoupled message processing | Best fit: simple queue, DLQ support, per-message tracking |
| Amazon Kinesis | Real-time analytics, streaming | Overkill: we don't need ordering or replay |
| Amazon MSK (Kafka) | Complex event sourcing | Overkill: higher cost, operational complexity |

### Queue Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         SQS Queue Design                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │              valid_orders (Standard Queue)                    │  │
│  │                                                               │  │
│  │  • Visibility Timeout: 60 seconds                             │  │
│  │  • Message Retention: 4 days                                  │  │
│  │  • Max Receives: 3 (before DLQ)                               │  │
│  │  • Batch Size: 10 messages                                    │  │
│  │                                                               │  │
│  │  Dead Letter Queue: valid_orders_dlq                          │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │              error_orders (Standard Queue)                    │  │
│  │                                                               │  │
│  │  • Visibility Timeout: 30 seconds                             │  │
│  │  • Message Retention: 14 days (longer for investigation)      │  │
│  │  • No DLQ (errors are already terminal)                       │  │
│  │  • Batch Size: 10 messages                                    │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Message Format (valid_orders)

```json
{
  "MessageId": "uuid-v4",
  "MessageBody": {
    "eventType": "ORDER_VALIDATED",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "orderEvent": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "externalOrderId": "ORD-A-12345",
      "partnerId": "PARTNER_A",
      "sequenceNumber": 42,
      "productId": "SKU-ABC123",
      "customerId": "CUST-001",
      "quantity": 5,
      "unitPrice": 29.99,
      "taxRate": 0.08,
      "grossAmount": 149.95,
      "taxAmount": 11.996,
      "netAmount": 161.946,
      "transactionTime": "2024-01-15T10:30:00.000Z",
      "processedAt": "2024-01-15T10:30:05.123Z"
    }
  },
  "MessageAttributes": {
    "partnerId": { "DataType": "String", "StringValue": "PARTNER_A" },
    "sequenceNumber": { "DataType": "Number", "StringValue": "42" }
  }
}
```

### Idempotency Handling

```typescript
// Use SQS Message Deduplication ID (for FIFO queues) OR
// Application-level deduplication using DynamoDB

// Option 1: SQS FIFO Queue (exactly-once processing)
const params = {
  QueueUrl: 'https://sqs.../valid_orders.fifo',
  MessageBody: JSON.stringify(orderEvent),
  MessageGroupId: partnerId,  // Orders from same partner processed in order
  MessageDeduplicationId: `${partnerId}:${externalOrderId}`  // Prevents duplicates
};

// Option 2: DynamoDB Idempotency Table
// Check if (partnerId, externalOrderId) exists before processing
```

---

## 5. Data Storage Layer

### Primary Database: Amazon Aurora PostgreSQL

| Aspect | Configuration |
|--------|---------------|
| **Engine** | Aurora PostgreSQL 15.x |
| **Instance Class** | db.r6g.large (2 vCPU, 16 GB RAM) |
| **Storage** | Aurora Auto-Scaling (10 GB - 128 GB) |
| **Multi-AZ** | Yes (automatic failover) |
| **Read Replicas** | 1-2 for query offloading |
| **Encryption** | AES-256 at rest, TLS in transit |

**Why Aurora PostgreSQL?**
- 5x throughput of standard PostgreSQL
- Auto-scaling storage
- Global database for multi-region (future)
- Point-in-time recovery (35-day retention)
- Compatible with existing Postgres schema

### Error Events: Amazon DynamoDB

| Aspect | Configuration |
|--------|---------------|
| **Table Name** | `nexusstream-error-events` |
| **Primary Key** | `id` (UUID) |
| **Sort Key** | `timestamp` |
| **GSI** | `partnerId-timestamp-index` |
| **Capacity** | On-Demand (pay per request) |
| **TTL** | 90 days (automatic cleanup) |

**Why DynamoDB for Errors?**
- No schema required (flexible error payloads)
- Automatic TTL for old errors
- Scales infinitely for error spikes
- Cheaper for write-heavy, rarely-queried data

### Caching: Amazon ElastiCache (Redis)

| Aspect | Configuration |
|--------|---------------|
| **Engine** | Redis 7.x |
| **Node Type** | cache.t3.medium |
| **Cluster Mode** | Disabled (single shard) |
| **Use Cases** | Statistics cache, rate limiting |

**Cached Data**:
```
nexusstream:stats:global          → 5 min TTL → Dashboard stats
nexusstream:stats:partner:A       → 5 min TTL → Partner A stats
nexusstream:ratelimit:partner:A   → 1 sec TTL → Rate limit counter
```

---

## 6. API Gateway & Load Balancing

### Amazon API Gateway (REST API)

| Aspect | Configuration |
|--------|---------------|
| **Type** | REST API (Regional) |
| **Throttling** | 10,000 RPS (burst: 5,000) |
| **Authentication** | API Key + IAM (optional Cognito) |
| **Caching** | 5 min TTL for GET /stats |
| **CORS** | Enabled for frontend domains |

**Endpoints**:
```
POST   /api/feed/partner-a       → Lambda:api-feed-handler
POST   /api/feed/partner-b       → Lambda:api-feed-handler
POST   /api/feed/partner-a/batch → Lambda:api-feed-handler
POST   /api/feed/partner-b/batch → Lambda:api-feed-handler

GET    /api/orders              → Lambda:api-query-handler
GET    /api/orders/{id}         → Lambda:api-query-handler
GET    /api/orders/stats        → Lambda:api-query-handler (cached)

GET    /api/errors              → Lambda:api-query-handler
GET    /api/errors/stats        → Lambda:api-query-handler
```

### CloudFront Distribution (Frontend)

| Aspect | Configuration |
|--------|---------------|
| **Origin** | S3 bucket (static React app) |
| **SSL** | AWS Certificate Manager (ACM) |
| **Caching** | 1 year for static assets, 0 for HTML |
| **WAF** | AWS WAF with managed rules |
| **Price Class** | Price Class 100 (US/EU) |

---

## 7. Security & Authentication

### API Authentication Options

| Method | Description | Use Case |
|--------|-------------|----------|
| **API Keys** | Simple header-based auth | Partner integration (current) |
| **IAM Auth** | AWS Signature v4 | Internal services |
| **Cognito** | OAuth2/JWT tokens | Future dashboard users |

### Network Security

```
┌─────────────────────────────────────────────────────────────┐
│                        VPC Design                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           Public Subnets (10.0.1.0/24)              │   │
│  │   • NAT Gateway                                      │   │
│  │   • Application Load Balancer                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │          Private Subnets (10.0.2.0/24)              │   │
│  │   • ECS Tasks / Lambda ENIs                          │   │
│  │   • Aurora Cluster                                   │   │
│  │   • ElastiCache                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Security Groups:                                           │
│  • sg-alb:      Inbound 443 from 0.0.0.0/0               │
│  • sg-ecs:      Inbound 3000 from sg-alb                 │
│  • sg-aurora:   Inbound 5432 from sg-ecs                 │
│  • sg-redis:    Inbound 6379 from sg-ecs                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Secrets Management

| Secret | Storage | Rotation |
|--------|---------|----------|
| Database credentials | AWS Secrets Manager | 30 days (automatic) |
| Partner API keys | Secrets Manager | Manual |
| Redis AUTH | Secrets Manager | Manual |

---

## 8. Monitoring & Observability

### CloudWatch Metrics

**Custom Metrics**:
```
Namespace: NexusStream

Dimensions:
  - Partner: PARTNER_A, PARTNER_B
  - Environment: prod, staging

Metrics:
  - OrdersReceived (count)
  - OrdersValidated (count)
  - OrdersRejected (count)
  - ProcessingLatencyMs (avg, p99)
  - QueueDepth (count)
  - DatabaseConnections (count)
```

### Alarms

| Alarm | Threshold | Action |
|-------|-----------|--------|
| High Error Rate | >5% orders rejected | SNS → PagerDuty |
| Queue Backlog | >1000 messages | SNS → Slack |
| Database CPU | >80% for 5 min | SNS → Ops team |
| Lambda Errors | >1% invocations | SNS → Dev team |
| API Latency | p99 >2 seconds | SNS → Dev team |

### AWS X-Ray Tracing

Enable distributed tracing across:
- API Gateway → Lambda → SQS → Lambda → Aurora

```typescript
// Example trace segment
import AWSXRay from 'aws-xray-sdk';

AWSXRay.captureHTTPsGlobal(require('http'));
AWSXRay.captureAWS(require('aws-sdk'));

// Adds correlation IDs through the entire request flow
```

---

## 9. Cost Estimation

### Monthly Cost Breakdown (Production - 100K orders/day)

| Service | Configuration | Estimated Cost |
|---------|--------------|----------------|
| **Lambda** | 3M invocations, 512MB, 500ms avg | $25 |
| **API Gateway** | 3M requests | $10 |
| **SQS** | 6M messages (valid + error) | $3 |
| **Aurora PostgreSQL** | db.r6g.large, 50GB storage | $250 |
| **DynamoDB** | On-demand, 1M writes/month | $5 |
| **ElastiCache Redis** | cache.t3.medium | $50 |
| **CloudFront** | 100GB transfer, 1M requests | $15 |
| **S3** | 5GB static hosting | $1 |
| **Secrets Manager** | 5 secrets | $3 |
| **CloudWatch** | Logs, metrics, alarms | $30 |
| **Data Transfer** | 50GB outbound | $5 |
| **NAT Gateway** | Single AZ | $35 |

**Total Estimated: ~$430/month**

### Cost Optimization Tips

1. **Use Savings Plans** for Lambda (up to 17% savings)
2. **Reserved Instances** for Aurora (up to 50% savings)
3. **S3 Intelligent Tiering** for logs
4. **DynamoDB TTL** to auto-delete old errors
5. **Lambda Provisioned Concurrency** only for peak hours

---

## 10. Disaster Recovery & High Availability

### Recovery Objectives

| Metric | Target | Strategy |
|--------|--------|----------|
| **RTO** (Recovery Time) | < 5 minutes | Multi-AZ automatic failover |
| **RPO** (Recovery Point) | < 1 minute | Aurora continuous backup |

### Multi-AZ Architecture

```
┌─────────────────────┐     ┌─────────────────────┐
│   Availability      │     │   Availability      │
│     Zone A          │     │     Zone B          │
├─────────────────────┤     ├─────────────────────┤
│                     │     │                     │
│  ECS Task (active)  │     │  ECS Task (active)  │
│         │           │     │         │           │
│         ▼           │     │         ▼           │
│  Aurora Writer      │────▶│  Aurora Reader      │
│  (Primary)          │ sync│  (Standby)          │
│                     │     │                     │
└─────────────────────┘     └─────────────────────┘
         │                           │
         └───────────┬───────────────┘
                     │
              ┌──────▼──────┐
              │   Global    │
              │   Table     │
              │  (DynamoDB) │
              └─────────────┘
```

### Backup Strategy

| Resource | Backup Method | Retention |
|----------|--------------|-----------|
| Aurora | Automated snapshots | 35 days |
| Aurora | Manual snapshots | 1 year (monthly) |
| DynamoDB | Point-in-time recovery | 35 days |
| S3 | Versioning + Cross-region replication | Indefinite |
| Secrets | Automatic versioning | All versions |

---

## 11. Migration Path from Current Architecture

### Phase 1: Infrastructure Setup (Week 1)

1. Create VPC with public/private subnets
2. Deploy Aurora PostgreSQL cluster
3. Set up SQS queues (valid_orders, error_orders, DLQs)
4. Configure API Gateway with routes
5. Deploy static frontend to S3 + CloudFront

### Phase 2: Implement AWS Adapters (Week 2)

```typescript
// Replace InMemoryOrderStream with SQS
class SQSOrderStream implements IOrderStreamPort {
  private sqsClient: SQSClient;
  private validQueueUrl: string;
  private errorQueueUrl: string;

  emitValidOrder(payload: ValidOrderPayload): void {
    this.sqsClient.send(new SendMessageCommand({
      QueueUrl: this.validQueueUrl,
      MessageBody: JSON.stringify(payload),
      MessageAttributes: {
        partnerId: { DataType: 'String', StringValue: payload.orderEvent.partnerId }
      }
    }));
  }
}

// Replace FileOrderRepository with Aurora
class AuroraOrderRepository implements IOrderRepositoryPort {
  private pool: Pool;

  async save(order: OrderEvent): Promise<void> {
    await this.pool.query(
      `INSERT INTO orders (id, external_order_id, partner_id, ...) 
       VALUES ($1, $2, $3, ...) 
       ON CONFLICT (partner_id, external_order_id) DO NOTHING`,
      [order.id, order.externalOrderId, order.partnerId, ...]
    );
  }
}
```

### Phase 3: Deploy and Test (Week 3)

1. Deploy Lambda functions / ECS tasks
2. Configure API Gateway to point to new backend
3. Run parallel traffic (shadow mode)
4. Compare results between old and new systems
5. Gradually shift traffic using weighted routing

### Phase 4: Cutover and Cleanup (Week 4)

1. Full traffic cutover to AWS
2. Monitor metrics and alerts
3. Decommission old infrastructure
4. Document runbooks and on-call procedures

---

## Summary: Recommended AWS Stack

| Layer | Service | Justification |
|-------|---------|---------------|
| **Compute** | ECS Fargate (or Lambda) | Serverless, auto-scaling |
| **API** | API Gateway + CloudFront | Managed, WAF integration |
| **Messaging** | Amazon SQS | Simple, DLQ support |
| **Primary DB** | Aurora PostgreSQL | High performance, multi-AZ |
| **Error Store** | DynamoDB | Flexible schema, TTL |
| **Cache** | ElastiCache Redis | Low latency, stats caching |
| **Monitoring** | CloudWatch + X-Ray | Native integration |
| **Security** | Secrets Manager, WAF, VPC | Defense in depth |

---

*This design document is intended for interview discussion and provides a starting point for production deployment. Actual implementation should be validated with load testing and security review.*
