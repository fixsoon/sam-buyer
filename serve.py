#!/usr/bin/env python3
"""Simple HTTP server with correct MIME types for PWA."""
import http.server
import socketserver

class PWAHandler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        '.js': 'application/javascript',
        '.json': 'application/json',
        '.png': 'image/png',
        '.svg': 'image/svg+xml',
        '.html': 'text/html; charset=utf-8',
        '.css': 'text/css',
    }

    def end_headers(self):
        # Allow service worker to work
        if self.path.endswith('.js'):
            self.send_header('Service-Worker-Allowed', '/')
        super().end_headers()

PORT = 8765
with socketserver.TCPServer(("", PORT), PWAHandler) as httpd:
    print(f"PWA server at http://localhost:{PORT}")
    httpd.serve_forever()
