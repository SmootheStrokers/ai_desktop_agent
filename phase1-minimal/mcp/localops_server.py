#!/usr/bin/env python3
"""
Local Operations MCP Server

Provides filesystem and system utilities for the desktop agent.
"""

import os
import platform
import sys
from pathlib import Path

from mcp.server.models import InitializationOptions
from mcp.server import NotificationOptions, Server
from mcp.server.stdio import stdio_server
from mcp import types

# Create server instance
server = Server("localops")

@server.list_tools()
async def handle_list_tools() -> list[types.Tool]:
    """
    List all available tools for this MCP server.
    """
    return [
        types.Tool(
            name="read_file",
            description="Read the contents of a file",
            inputSchema={
                "type": "object",
                "properties": {
                    "path": {
                        "type": "string",
                        "description": "Path to the file to read"
                    }
                },
                "required": ["path"]
            }
        ),
        types.Tool(
            name="write_file",
            description="Write content to a file",
            inputSchema={
                "type": "object",
                "properties": {
                    "path": {
                        "type": "string",
                        "description": "Path to the file to write"
                    },
                    "content": {
                        "type": "string",
                        "description": "Content to write to the file"
                    }
                },
                "required": ["path", "content"]
            }
        ),
        types.Tool(
            name="list_directory",
            description="List files and directories in a directory",
            inputSchema={
                "type": "object",
                "properties": {
                    "path": {
                        "type": "string",
                        "description": "Path to the directory to list"
                    }
                },
                "required": ["path"]
            }
        ),
        types.Tool(
            name="get_system_info",
            description="Get system information",
            inputSchema={
                "type": "object",
                "properties": {},
                "required": []
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
    print(f"[localops] Executing tool: {name}", file=sys.stderr)
    
    if name == "read_file":
        return await _handle_read_file(arguments)
    elif name == "write_file":
        return await _handle_write_file(arguments)
    elif name == "list_directory":
        return await _handle_list_directory(arguments)
    elif name == "get_system_info":
        return await _handle_get_system_info(arguments)
    else:
        raise ValueError(f"Unknown tool: {name}")

async def _handle_read_file(arguments: dict) -> list[types.TextContent]:
    """Handle read_file tool execution."""
    try:
        path = Path(arguments["path"])
        
        # Convert to absolute path for security
        if not path.is_absolute():
            path = path.resolve()
        
        if not path.exists():
            return [types.TextContent(
                type="text",
                text=f"Error: File not found: {path}"
            )]
        
        if not path.is_file():
            return [types.TextContent(
                type="text",
                text=f"Error: Path is not a file: {path}"
            )]
        
        content = path.read_text(encoding='utf-8')
        return [types.TextContent(
            type="text",
            text=f"File contents of {path}:\n\n{content}"
        )]
        
    except Exception as e:
        return [types.TextContent(
            type="text",
            text=f"Error reading file: {str(e)}"
        )]

async def _handle_write_file(arguments: dict) -> list[types.TextContent]:
    """Handle write_file tool execution."""
    try:
        path = Path(arguments["path"])
        content = arguments["content"]
        
        # Convert to absolute path for security
        if not path.is_absolute():
            path = path.resolve()
        
        # Create parent directories if they don't exist
        path.parent.mkdir(parents=True, exist_ok=True)
        
        # Write the content
        bytes_written = path.write_text(content, encoding='utf-8')
        
        return [types.TextContent(
            type="text",
            text=f"Successfully wrote {len(content.encode('utf-8'))} bytes to {path}"
        )]
        
    except Exception as e:
        return [types.TextContent(
            type="text",
            text=f"Error writing file: {str(e)}"
        )]

async def _handle_list_directory(arguments: dict) -> list[types.TextContent]:
    """Handle list_directory tool execution."""
    try:
        path = Path(arguments["path"])
        
        # Convert to absolute path for security
        if not path.is_absolute():
            path = path.resolve()
        
        if not path.exists():
            return [types.TextContent(
                type="text",
                text=f"Error: Directory not found: {path}"
            )]
        
        if not path.is_dir():
            return [types.TextContent(
                type="text",
                text=f"Error: Path is not a directory: {path}"
            )]
        
        # List directory contents
        items = []
        for item in sorted(path.iterdir()):
            item_type = "directory" if item.is_dir() else "file"
            items.append(f"{item.name} ({item_type})")
        
        if not items:
            result = f"Directory {path} is empty"
        else:
            result = f"Contents of {path}:\n\n" + "\n".join(items)
        
        return [types.TextContent(
            type="text",
            text=result
        )]
        
    except Exception as e:
        return [types.TextContent(
            type="text",
            text=f"Error listing directory: {str(e)}"
        )]

async def _handle_get_system_info(arguments: dict) -> list[types.TextContent]:
    """Handle get_system_info tool execution."""
    try:
        info = {
            "OS": platform.system(),
            "OS Version": platform.version(),
            "Platform": platform.platform(),
            "Machine": platform.machine(),
            "Processor": platform.processor(),
            "Python Version": sys.version,
            "Python Executable": sys.executable,
            "Current Working Directory": os.getcwd(),
            "User": os.getenv('USER', os.getenv('USERNAME', 'Unknown'))
        }
        
        result = "System Information:\n\n"
        for key, value in info.items():
            result += f"{key}: {value}\n"
        
        return [types.TextContent(
            type="text",
            text=result
        )]
        
    except Exception as e:
        return [types.TextContent(
            type="text",
            text=f"Error getting system info: {str(e)}"
        )]

async def main():
    """Run the MCP server using stdio transport."""
    print("[localops] Starting Local Operations MCP Server", file=sys.stderr)
    
    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            InitializationOptions(
                server_name="localops",
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
