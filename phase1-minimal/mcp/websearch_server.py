#!/usr/bin/env python3
"""
Web Search MCP Server

Provides web search and URL fetching capabilities for the desktop agent.
"""

import json
import sys
from urllib.parse import quote

from mcp.server.models import InitializationOptions
from mcp.server import NotificationOptions, Server
from mcp.server.stdio import stdio_server
from mcp import types

# Create server instance
server = Server("websearch")

@server.list_tools()
async def handle_list_tools() -> list[types.Tool]:
    """
    List all available tools for this MCP server.
    """
    return [
        types.Tool(
            name="search_web",
            description="Search the web for information",
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Search query to look up on the web"
                    },
                    "limit": {
                        "type": "number",
                        "description": "Maximum number of results to return",
                        "default": 5
                    }
                },
                "required": ["query"]
            }
        ),
        types.Tool(
            name="fetch_url",
            description="Fetch content from a URL",
            inputSchema={
                "type": "object",
                "properties": {
                    "url": {
                        "type": "string",
                        "description": "URL to fetch content from"
                    }
                },
                "required": ["url"]
            }
        )
    ]

@server.call_tool()
async def handle_call_tool(
    name: str,
    arguments: dict
) -> list[types.TextContent]:
    """
    Handle tool execution requests.
    """
    print(f"[websearch] Executing tool: {name}", file=sys.stderr)
    
    if name == "search_web":
        return await _handle_search_web(arguments)
    elif name == "fetch_url":
        return await _handle_fetch_url(arguments)
    else:
        raise ValueError(f"Unknown tool: {name}")

async def _handle_search_web(arguments: dict) -> list[types.TextContent]:
    """Handle search_web tool execution."""
    try:
        query = arguments["query"]
        limit = arguments.get("limit", 5)
        
        # Generate mock search results
        mock_results = _generate_mock_search_results(query, limit)
        
        # Format results
        result_text = f"Web Search Results for '{query}':\n\n"
        for i, result in enumerate(mock_results, 1):
            result_text += f"{i}. {result['title']}\n"
            result_text += f"   URL: {result['url']}\n"
            result_text += f"   {result['snippet']}\n\n"
        
        return [types.TextContent(
            type="text",
            text=result_text
        )]
        
    except Exception as e:
        return [types.TextContent(
            type="text",
            text=f"Error performing web search: {str(e)}"
        )]

async def _handle_fetch_url(arguments: dict) -> list[types.TextContent]:
    """Handle fetch_url tool execution."""
    try:
        url = arguments["url"]
        
        # Mock URL content fetch
        mock_content = _generate_mock_url_content(url)
        
        result_text = f"Content fetched from {url}:\n\n"
        result_text += f"Title: {mock_content['title']}\n"
        result_text += f"Content: {mock_content['content']}\n"
        
        if mock_content.get('metadata'):
            result_text += f"\nMetadata: {mock_content['metadata']}\n"
        
        return [types.TextContent(
            type="text",
            text=result_text
        )]
        
    except Exception as e:
        return [types.TextContent(
            type="text",
            text=f"Error fetching URL: {str(e)}"
        )]

def _generate_mock_search_results(query: str, limit: int) -> list[dict]:
    """Generate mock search results for testing."""
    results = []
    
    # Create diverse mock results
    domains = ["example.com", "wikipedia.org", "stackoverflow.com", "github.com", "docs.python.org"]
    
    for i in range(min(limit, len(domains))):
        domain = domains[i]
        results.append({
            "title": f"Search Result {i+1} for '{query}' - {domain.title()}",
            "url": f"https://{domain}/search?q={quote(query)}&result={i+1}",
            "snippet": f"This is a mock search result for the query '{query}' from {domain}. In a real implementation, this would contain actual search results from a search engine API."
        })
    
    # Add more generic results if limit is higher
    for i in range(len(domains), limit):
        results.append({
            "title": f"Additional Result for '{query}' - Generic Site {i+1}",
            "url": f"https://generic-site{i+1}.com/search?q={quote(query)}",
            "snippet": f"Generic search result {i+1} for '{query}'. This demonstrates how the search tool would return multiple relevant results."
        })
    
    return results

def _generate_mock_url_content(url: str) -> dict:
    """Generate mock URL content for testing."""
    # Parse domain from URL
    domain = "unknown"
    try:
        from urllib.parse import urlparse
        parsed = urlparse(url)
        domain = parsed.netloc or "unknown"
    except:
        pass
    
    # Generate content based on domain
    if "wikipedia" in domain:
        return {
            "title": f"Wikipedia Article - {url}",
            "content": f"This is a mock Wikipedia article fetched from {url}. In a real implementation, this would contain the actual article content, summary, and structured information from the Wikipedia page.",
            "metadata": "Source: Wikipedia, Type: Encyclopedia Article"
        }
    elif "github" in domain:
        return {
            "title": f"GitHub Repository - {url}",
            "content": f"This is a mock GitHub repository page from {url}. In a real implementation, this would contain the repository description, README content, code files, and project information.",
            "metadata": "Source: GitHub, Type: Code Repository"
        }
    elif "stackoverflow" in domain:
        return {
            "title": f"Stack Overflow Question - {url}",
            "content": f"This is a mock Stack Overflow question from {url}. In a real implementation, this would contain the question, answers, code examples, and community discussion.",
            "metadata": "Source: Stack Overflow, Type: Q&A Forum"
        }
    elif "docs.python" in domain:
        return {
            "title": f"Python Documentation - {url}",
            "content": f"This is mock Python documentation from {url}. In a real implementation, this would contain the official Python documentation, code examples, API references, and tutorials.",
            "metadata": "Source: Python.org, Type: Official Documentation"
        }
    else:
        return {
            "title": f"Web Page - {url}",
            "content": f"This is mock content from {url}. In a real implementation, this would contain the actual webpage content, text, images metadata, and structured information from the URL.",
            "metadata": "Source: Generic Web Page, Type: HTML Content"
        }

async def main():
    """Run the MCP server using stdio transport."""
    print("[websearch] Starting Web Search MCP Server", file=sys.stderr)
    
    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            InitializationOptions(
                server_name="websearch",
                server_version="1.0.0",
                capabilities=server.get_capabilities(
                    notification_options=NotificationOptions(),
                    experimental_capabilities={}
                )
            )
        )

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
