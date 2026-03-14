# Gator 🐊

A multi-user RSS feed aggregator CLI built with TypeScript, PostgreSQL, and Drizzle ORM. Gator lets you add RSS feeds, follow them, scrape posts in the background, and browse the latest content from your terminal.

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [PostgreSQL](https://www.postgresql.org/) running locally

## Installation

Clone the repo and install dependencies:
```bash
git clone https://github.com/YOUR_USERNAME/gator.git
cd gator
npm install
```

## Configuration

Create a config file at `~/.gatorconfig.json`:
```json
{
  "db_url": "postgres://postgres:yourpassword@localhost:5432/gator?sslmode=disable"
}
```

Then run the database migrations:
```bash
DATABASE_URL="postgres://postgres:yourpassword@localhost:5432/gator?sslmode=disable" npx drizzle-kit migrate
```

## Usage

All commands are run with:
```bash
npm run start <command> [arguments]
```

### Commands

| Command | Description |
|---|---|
| `register <name>` | Register a new user and log in as them |
| `login <name>` | Log in as an existing user |
| `reset` | Delete all users and data |
| `addfeed <name> <url>` | Add a new RSS feed and follow it |
| `feeds` | List all feeds in the database |
| `follow <url>` | Follow an existing feed |
| `unfollow <url>` | Unfollow a feed |
| `following` | List all feeds you are following |
| `agg <interval>` | Start the feed aggregator loop (e.g. `1s`, `1m`, `1h`) |
| `browse [limit]` | Browse the latest posts (default limit: 2) |

### Example Workflow
```bash
# Register a user
npm run start register alice

# Add some feeds
npm run start addfeed "Hacker News" "https://news.ycombinator.com/rss"
npm run start addfeed "Boot.dev Blog" "https://www.boot.dev/blog/index.xml"

# Start the aggregator in one terminal (Ctrl+C to stop)
npm run start agg 1m

# In another terminal, browse your posts
npm run start browse 10
```

## Built With

- [TypeScript](https://www.typescriptlang.org/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [PostgreSQL](https://www.postgresql.org/)
- [postgres.js](https://github.com/porsager/postgres)
