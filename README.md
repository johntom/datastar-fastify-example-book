# Datastar Fastify Example - Book Manager

A full-stack CRUD application demonstrating [Datastar](https://data-star.dev) with Fastify 5 and Node.js 24.

## Features

- Full CRUD operations with real-time updates
- SQLite Book Manager with row-level locking
- Live data sync across multiple browser sessions
- MongoDB integration (optional)
- Todo App example
- Toast notifications
- Basic Datastar examples
- Port of Bad Apple!
## Quick Start

### Prerequisites

- Node.js 24+
- MongoDB (optional, for MongoDB examples)

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/datastar-fastify-example-book.git
cd datastar-fastify-example-book

# Install dependencies
npm install

# Copy environment file and configure
cp .env.example .env
# Edit .env with your settings

# Start the server
npm run serve
```

Open http://127.0.0.1 in your browser.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run serve` | Start production server |
| `npm run start` | Start production server |
| `npm run dev` | Start with nodemon (auto-reload) |

## Menu Options

- **Home** - Welcome page
- **SQLite Book Manager** - Full CRUD with real-time sync (ported from htmx)
- **MongoDB Book Manager** - Requires MongoDB connection
- **Todo App** - Task management with real-time syncex using SQLite
- **Toast** - Notification examples
- **HelloWorld** - Basic Datastar example
- **Basic Examples** - Various Datastar patterns

## Tech Stack

- **Backend**: Fastify 5, Node.js 24
- **Frontend**: Datastar (hypermedia framework)
- **Database**: SQLite / MongoDB
- **Templating**: Nunjucks
- **SDK**: [@johntom/datastar-fastify](https://github.com/johntom/datastar-fastify-sdk)

## Deploy to Render

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

1. Fork this repository
2. Connect to Render
3. Set environment variables (see `.env.example`)
4. Deploy

## Environment Variables

See `.env.example` for required configuration:

- `MONGODB_URLtodo` - MongoDB connection string
- `NODE_ENV` - development/production
- `host` - Server host (use 0.0.0.0 for cloud deployment)
- `port` - Server port
- `SQLITE_DB_PATH` - Path to SQLite database

## License

MIT
