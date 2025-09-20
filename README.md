# Monarch Money MCP Server

A Model Context Protocol (MCP) server that provides seamless integration between [Monarch Money](https://monarchmoney.com) and Claude Desktop. This server enables you to query your financial data, analyze spending patterns, and get personalized financial insights directly through conversational AI.

## 🚀 Features

- **🏦 Account Management**: View all accounts with real-time balances and details
- **💳 Transaction Analysis**: Search and filter transactions with advanced criteria
- **📊 Spending Insights**: Analyze spending patterns by category, merchant, and time period
- **💰 Budget Tracking**: Monitor budget performance with planned vs. actual spending
- **📈 Net Worth Calculation**: Track your total net worth and asset allocation
- **📅 Monthly Reports**: Generate comprehensive monthly financial summaries
- **🏷️ Category Management**: Explore and analyze transaction categories
- **📉 Balance History**: View account balance trends over time
- **🔐 Secure Authentication**: Token-based authentication with MFA support

## 🛡️ Security & Privacy

- **Token-based authentication** - No need to store credentials long-term
- **Environment variable protection** - Credentials never hardcoded
- **Multi-factor authentication support** - Enhanced security for your financial data
- **GraphQL API integration** - Secure communication with Monarch Money
- **Local processing** - All analysis happens on your machine

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** installed on your system
- **Claude Desktop** application installed
- **Monarch Money account** with valid credentials
- **npm** or **yarn** package manager

## 🔧 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/whitebirchio/monarch-mcp.git
cd monarch-mcp
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Authentication Setup

**🔑 Option A: Token Authentication (Recommended)**

1. Get your authentication token:

   ```bash
   npm run login
   ```

2. Follow the prompts to enter your Monarch Money credentials and MFA code (if required)

3. Copy the generated token for use in Claude Desktop configuration

**📧 Option B: Direct Credentials**

Create a `.env` file with your credentials:

```bash
MONARCH_TOKEN=your-auth-token-here
```

### 4. Build the Project

```bash
npm run build
```

## ⚙️ Claude Desktop Configuration

### macOS Configuration

Edit your Claude Desktop config file:

```bash
~/Library/Application Support/Claude/claude_desktop_config.json
```

Add this configuration:

```json
{
  "mcpServers": {
    "monarch-money": {
      "command": "node",
      "args": ["/absolute/path/to/monarch-mcp/dist/index.js"],
      "env": {
        "MONARCH_TOKEN": "your-auth-token-here"
      }
    }
  }
}
```

### Windows Configuration

Edit your Claude Desktop config file:

```
%APPDATA%/Claude/claude_desktop_config.json
```

Use the same JSON structure with Windows-style paths:

```json
{
  "mcpServers": {
    "monarch-money": {
      "command": "node",
      "args": ["C:\\path\\to\\monarch-mcp\\dist\\index.js"],
      "env": {
        "MONARCH_TOKEN": "your-auth-token-here"
      }
    }
  }
}
```

**💡 Important**: Use the absolute path to your installation directory.

## 🎯 Usage Examples

After configuring Claude Desktop and restarting the application, you can ask questions like:

### 💰 Financial Overview

- _"What's my current net worth?"_
- _"Show me all my account balances"_
- _"What's my checking account balance?"_

### 📊 Spending Analysis

- _"How much did I spend on groceries last month?"_
- _"Show me my largest expenses from the past week"_
- _"Break down my spending by category for Q3"_
- _"Find all transactions over $500 this year"_

### 📈 Budget Insights

- _"How am I doing against my budget this month?"_
- _"Which budget categories am I overspending in?"_
- _"Show me my budget vs actual for each category"_

### 🔍 Transaction Search

- _"Find all Amazon purchases from last month"_
- _"Show me restaurant transactions over $50"_
- _"What did I spend at Costco this year?"_

### 📅 Historical Analysis

- _"Compare my spending this month vs last month"_
- _"Show my account balance trends for the past 6 months"_
- _"What was my net income last month?"_

## 🛠️ Available Tools

| Tool                       | Description                        | Parameters                                   |
| -------------------------- | ---------------------------------- | -------------------------------------------- |
| `get_accounts`             | List all financial accounts        | None                                         |
| `get_account_balance`      | Get specific account balance       | `accountId`                                  |
| `get_transactions`         | Retrieve transactions with filters | `limit`, `accountId`, `startDate`, `endDate` |
| `get_spending_by_category` | Spending breakdown by category     | `startDate`, `endDate`                       |
| `get_budget_summary`       | Current budget status              | None                                         |
| `search_transactions`      | Search transactions by criteria    | `query`, `minAmount`, `maxAmount`, `limit`   |
| `get_net_worth`            | Calculate total net worth          | None                                         |
| `get_monthly_summary`      | Monthly financial summary          | `year`, `month`                              |
| `get_categories`           | List all transaction categories    | None                                         |
| `get_account_snapshots`    | Account balance history            | `accountId`, `startDate`, `endDate`          |

## 🔧 Development

### Development Commands

```bash
# Run in development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Get authentication token
npm run login
```

### Project Structure

```
monarch-mcp/
├── src/
│   ├── index.ts           # MCP server entry point
│   ├── login.ts          # Authentication helper
│   ├── monarch-api.ts    # Monarch Money API client
│   └── tools.ts          # MCP tool implementations
├── dist/                 # Compiled JavaScript output
├── package.json          # Project dependencies
├── tsconfig.json         # TypeScript configuration
└── README.md            # This file
```

### API Architecture

The server implements a three-layer architecture:

1. **MCP Layer** (`index.ts`) - Handles Model Context Protocol communication
2. **Tools Layer** (`tools.ts`) - Implements financial analysis tools
3. **API Layer** (`monarch-api.ts`) - Manages Monarch Money GraphQL API integration

## 🐛 Troubleshooting

### Authentication Issues

| Problem             | Solution                                          |
| ------------------- | ------------------------------------------------- |
| Invalid credentials | Verify your email/password in the login command   |
| MFA required        | Use the `npm run login` command which handles MFA |
| Token expired       | Re-run `npm run login` to get a fresh token       |

### Integration Issues

| Problem             | Solution                                  |
| ------------------- | ----------------------------------------- |
| Tools not appearing | Restart Claude Desktop completely         |
| Server not starting | Verify the absolute path in config file   |
| Permission errors   | Check file permissions on `dist/index.js` |

### Common Error Messages

- **"MONARCH_TOKEN environment variable is required"** - Add your token to the Claude Desktop config
- **"Authentication failed"** - Check your token validity and regenerate if needed
- **"GraphQL Error (Code: 400)"** - API request format issue (usually handled automatically)

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Make** your changes
4. **Test** thoroughly with your own Monarch Money account
5. **Commit** your changes (`git commit -m 'Add amazing feature'`)
6. **Push** to your branch (`git push origin feature/amazing-feature`)
7. **Open** a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Add proper error handling
- Update documentation for new features
- Test with real Monarch Money data
- Maintain backwards compatibility

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This project is an independent integration and is not affiliated with, endorsed by, or sponsored by Monarch Money.

**Important Notes:**

- Use this software at your own risk
- Always verify financial data independently
- Never make financial decisions based solely on automated tools
- Keep your authentication credentials secure
- Review all transactions and calculations manually

## 🙋‍♂️ Support

- **Issues**: [GitHub Issues](https://github.com/whitebirchio/monarch-mcp/issues)
- **Discussions**: [GitHub Discussions](https://github.com/whitebirchio/monarch-mcp/discussions)
- **Documentation**: This README and inline code comments

---

Made with ❤️ for the Claude Desktop community
