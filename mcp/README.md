# MCP Servers for Desktop Agent

This directory contains Model Context Protocol (MCP) servers that provide additional tools to the desktop agent.

## Available Servers

### 1. Local Operations (`localops_server.py`)

Provides filesystem and system utilities.

**Tools:**
- `read_file` - Read file contents
- `write_file` - Write content to file
- `list_directory` - List directory contents
- `get_system_info` - Get system information

**Usage:**
```bash
python mcp/localops_server.py
```

### 2. Web Search (`websearch_server.py`)

Provides web search and URL fetching capabilities.

**Tools:**
- `search_web` - Search the web
- `fetch_url` - Fetch content from URL

**Usage:**
```bash
python mcp/websearch_server.py
```

## Testing Servers Standalone

You can test the servers independently:

```bash
# Test localops server
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | python mcp/localops_server.py

# Test websearch server
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | python mcp/websearch_server.py
```

## Requirements

```bash
pip install mcp
```

## Integration with Desktop Agent

These servers are automatically discovered and connected by the desktop agent when configured in the MCP settings panel.

## Tool Details

### Local Operations Server

#### `read_file`
- **Parameters:** `path` (string, required) - Path to the file to read
- **Returns:** File contents as text
- **Security:** Uses absolute paths and validates file existence

#### `write_file`
- **Parameters:** 
  - `path` (string, required) - Path to the file to write
  - `content` (string, required) - Content to write to the file
- **Returns:** Success message with bytes written
- **Security:** Creates parent directories if needed

#### `list_directory`
- **Parameters:** `path` (string, required) - Path to the directory to list
- **Returns:** List of file/directory names with type indicators
- **Security:** Uses absolute paths and validates directory existence

#### `get_system_info`
- **Parameters:** None
- **Returns:** OS, platform, Python version, and system information

### Web Search Server

#### `search_web`
- **Parameters:**
  - `query` (string, required) - Search query to look up
  - `limit` (number, optional, default: 5) - Maximum number of results
- **Returns:** List of mock search results with title, URL, and snippet
- **Note:** Currently returns mock data for testing

#### `fetch_url`
- **Parameters:** `url` (string, required) - URL to fetch content from
- **Returns:** Page content/summary with metadata
- **Note:** Currently returns mock data for testing

## Development Notes

### Mock Data
Both servers currently use mock data for demonstration purposes. In a production environment, you would:

1. **Web Search Server:**
   - Integrate with real search APIs (Google, Bing, DuckDuckGo)
   - Add authentication and rate limiting
   - Implement result caching

2. **Local Operations Server:**
   - Add more security restrictions
   - Implement file permission checks
   - Add support for binary files

### Error Handling
Both servers include comprehensive error handling:
- Clear, descriptive error messages
- Proper exception catching and logging
- Graceful failure modes

### Security Considerations
- All file paths are converted to absolute paths
- Input validation for all parameters
- No arbitrary code execution
- Safe file operations with proper encoding

## Server Architecture

Both servers follow the MCP protocol specification:
- Use `stdio` transport for communication
- Implement proper JSON-RPC message handling
- Support tool listing and execution
- Include server initialization and capabilities

## Testing Commands

### Test Tool Listing
```bash
# Test localops server tools
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | python mcp/localops_server.py

# Test websearch server tools
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | python mcp/websearch_server.py
```

### Test Tool Execution
```bash
# Test read_file tool
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"read_file","arguments":{"path":"README.md"}}}' | python mcp/localops_server.py

# Test search_web tool
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"search_web","arguments":{"query":"python programming","limit":3}}}' | python mcp/websearch_server.py
```

## Future Enhancements

1. **Real API Integration:**
   - Replace mock data with actual web search APIs
   - Add URL content fetching with real HTTP requests

2. **Additional Tools:**
   - File compression/decompression
   - System monitoring and metrics
   - Network utilities
   - Database operations

3. **Configuration:**
   - External configuration files
   - Environment variable support
   - Custom tool registration

4. **Performance:**
   - Async file operations
   - Result caching
   - Connection pooling

## Troubleshooting

### Common Issues

1. **Import Errors:**
   - Ensure MCP SDK is installed: `pip install mcp`
   - Check Python version (3.9+ required)

2. **Permission Errors:**
   - Verify file/directory permissions
   - Run with appropriate user privileges

3. **Server Not Starting:**
   - Check for port conflicts
   - Verify stdio communication
   - Review error logs in stderr

### Debug Mode
Both servers include debug logging to stderr. Check the console output for detailed error information.

## License

This project follows the same license as the main desktop agent project.
