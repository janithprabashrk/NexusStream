# NexusStream - Enterprise Order Processing Platform

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-v18+-green.svg" alt="Node.js">
  <img src="https://img.shields.io/badge/TypeScript-5.x-blue.svg" alt="TypeScript">
  <img src="https://img.shields.io/badge/React-18.x-61DAFB.svg" alt="React">
  <img src="https://img.shields.io/badge/Tests-215%20passing-brightgreen.svg" alt="Tests">
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License">
</p>

A high-performance, enterprise-grade order processing platform that handles multi-partner data feeds with validation, transformation, persistence, and querying capabilities.

## 🌟 Features

- **Multi-Partner Feed Handling**: Process orders from Partner A (decimal tax rates, ms timestamps) and Partner B (percentage tax, ISO timestamps)
- **Real-time Validation**: Comprehensive input validation with detailed error messages
- **Data Transformation**: Unified internal schema regardless of input format
- **File-Based Persistence**: Orders survive server restarts with automatic JSON file storage
- **RESTful API**: Complete CRUD operations with filtering, pagination, and statistics
- **Modern React UI**: Futuristic dark/light mode interface with Tailwind CSS
- **Full Test Coverage**: 215+ unit tests covering all business logic

## 📋 Prerequisites

Before running NexusStream, ensure you have the following installed:

### Required Software

| Software | Version | Purpose |
|----------|---------|---------|
| **Node.js** | v18.0.0 or higher | JavaScript runtime |
| **npm** | v9.0.0 or higher | Package manager (comes with Node.js) |
| **Git** | Latest | Version control |

### Optional (for development)

| Software | Purpose |
|----------|---------|
| **VS Code** | Recommended IDE with TypeScript support |
| **Postman/Insomnia** | API testing |

### No Database Required! 🎉

NexusStream uses **file-based persistence** by default. This means:
- ✅ **Zero database setup** - Just install and run
- ✅ **No configuration files** - Works out of the box
- ✅ **Data survives restarts** - Orders saved to `./data/orders.json`
- ✅ **Fast development** - No waiting for DB connections

#### Data Storage

Orders and sequence numbers are automatically persisted to JSON files in the `./data` directory:
- `data/orders.json` - All processed orders
- `data/sequences.json` - Partner sequence counters

> **Note**: For testing, the system uses in-memory storage (set `NODE_ENV=test`). For production with high volume, implement the repository interfaces for PostgreSQL, MongoDB, etc.

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/NexusStream.git
cd NexusStream
```

### 2. Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Start the Backend Server

```bash
cd backend
npm run dev
```

The backend will start on **http://localhost:3000**

You should see:
```
🚀 NexusStream server running on port 3000
📊 Orders API: http://localhost:3000/api/orders
📥 Partner A endpoint: POST http://localhost:3000/api/feed/partner-a
📥 Partner B endpoint: POST http://localhost:3000/api/feed/partner-b
```

### 4. Start the Frontend (New Terminal)

```bash
cd frontend
npm run dev
```

The frontend will start on **http://localhost:5173**

### 5. Open in Browser

Navigate to **http://localhost:5173** to access the NexusStream dashboard.

## 📁 Project Structure

```
NexusStream/
├── backend/                    # Express.js + TypeScript API
│   ├── src/
│   │   ├── domain/             # Domain models & validators
│   │   │   ├── models/         # OrderEvent, PartnerAInput, etc.
│   │   │   └── services/       # Validation services
│   │   ├── application/        # Application services
│   │   │   └── services/       # FeedHandler, OrderQueryService
│   │   ├── infrastructure/     # External adapters
│   │   │   ├── adapters/       # In-memory repositories
│   │   │   └── http/           # Express routers
│   │   ├── app.ts              # Express app configuration
│   │   └── index.ts            # Entry point
│   └── tests/                  # Unit tests (Jest)
│
└── frontend/                   # React + Vite + TypeScript
    ├── src/
    │   ├── components/         # Reusable UI components
    │   ├── views/              # Page components
    │   ├── api/                # API client
    │   ├── context/            # Theme context
    │   └── types/              # TypeScript types
    └── public/                 # Static assets
```

## 🔌 API Reference

### Feed Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/feed/partner-a` | Submit Partner A order |
| POST | `/api/feed/partner-b` | Submit Partner B order |
| POST | `/api/feed/partner-a/batch` | Submit batch of Partner A orders |
| POST | `/api/feed/partner-b/batch` | Submit batch of Partner B orders |

### Query Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders` | Get all orders (paginated) |
| GET | `/api/orders/:id` | Get order by internal ID |
| GET | `/api/orders/external/:id` | Get order by external ID |
| GET | `/api/orders/by-partner/:partnerId` | Get orders by partner |
| GET | `/api/orders/by-customer/:customerId` | Get orders by customer |
| GET | `/api/orders/stats` | Get order statistics |

### Partner A Input Format

```json
{
  "orderId": "ORD-A-12345",
  "skuId": "SKU-ABC123",
  "customerId": "CUST-001",
  "quantity": 5,
  "unitPrice": 29.99,
  "taxRate": 0.08,
  "transactionTimeMs": 1699876543210
}
```

### Partner B Input Format

```json
{
  "transactionId": "TXN-B-12345",
  "itemCode": "ITEM-XYZ789",
  "clientId": "CLIENT-001",
  "qty": 3,
  "price": 49.99,
  "tax": 8.5,
  "purchaseTime": "2024-01-15T10:30:00.000Z"
}
```

## 🧪 Running Tests

```bash
cd backend
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

Expected output:
```
Test Suites: 9 passed, 9 total
Tests:       215 passed, 215 total
```

## 🎨 UI Features

- **Dashboard**: Real-time statistics, recent orders, quick actions
- **Order List**: Filterable, sortable table with pagination
- **Order Details**: Complete order information with timeline
- **Submit Order**: Partner-aware form with sample data generation
- **Dark/Light Mode**: Toggle with system preference detection
- **Futuristic Design**: Cyber/neon color palette with glass morphism

## 🔧 Development Commands

### Backend

```bash
npm run dev       # Start with hot reload
npm run build     # Compile TypeScript
npm start         # Run compiled JS
npm test          # Run tests
npm run lint      # ESLint check
```

### Frontend

```bash
npm run dev       # Start Vite dev server
npm run build     # Production build
npm run preview   # Preview production build
npm run lint      # ESLint check
```

## 📊 Architecture

NexusStream follows **Clean Architecture** principles:

```
┌─────────────────────────────────────────────────────────┐
│                    Presentation Layer                    │
│            (React UI / Express HTTP Routers)            │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                   Application Layer                      │
│          (FeedHandler, OrderQueryService)               │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                     Domain Layer                         │
│   (OrderEvent, Validators, OrderTransformer)            │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                 Infrastructure Layer                     │
│  (InMemoryOrderRepository, InMemoryOrderStream)         │
└─────────────────────────────────────────────────────────┘
```

## 🔐 Validation Rules

### Partner A
- `orderId`: Required, non-empty string
- `skuId`: Required, non-empty string
- `customerId`: Required, non-empty string
- `quantity`: Required, positive integer
- `unitPrice`: Required, positive number
- `taxRate`: Required, decimal 0-1 (e.g., 0.08 = 8%)
- `transactionTimeMs`: Required, Unix timestamp in milliseconds

### Partner B
- `transactionId`: Required, non-empty string
- `itemCode`: Required, non-empty string
- `clientId`: Required, non-empty string
- `qty`: Required, positive integer
- `price`: Required, positive number
- `tax`: Required, percentage 0-100 (e.g., 8.5 = 8.5%)
- `purchaseTime`: Required, valid ISO 8601 timestamp

## 🚀 Production Deployment

For production deployment, consider:

1. **Database**: Implement persistent repositories (PostgreSQL/MongoDB)
2. **Message Queue**: Add Kafka/RabbitMQ for order streaming
3. **Caching**: Redis for query caching
4. **Monitoring**: Add health checks, metrics, and logging
5. **Authentication**: Implement API key or OAuth2

## 📝 License

MIT License - see [LICENSE](LICENSE) for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

<p align="center">
  Built with ❤️ for the ZeroBeta Assessment
</p>
