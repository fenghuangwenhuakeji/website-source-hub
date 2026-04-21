import http.server
import socketserver
import sys
import os
import webbrowser
import time

# Configuration
DEFAULT_PORT = 8000

class CORSRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Request handler with CORS support and correct MIME types."""
    
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def guess_type(self, path):
        # Fix for some Windows registries missing proper MIME types
        base, ext = os.path.splitext(path)
        if ext.lower() == '.js':
            return 'application/javascript'
        if ext.lower() == '.css':
            return 'text/css'
        if ext.lower() == '.svg':
            return 'image/svg+xml'
        return super().guess_type(path)

def run_server(port):
    # Ensure we are in the script's directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    handler = CORSRequestHandler
    
    # Allow fast restart
    socketserver.TCPServer.allow_reuse_address = True
    
    try:
        with socketserver.TCPServer(("", port), handler) as httpd:
            print(f"\n[SERVER] Serving at http://localhost:{port}")
            print(f"[SERVER] Root Directory: {os.getcwd()}")
            print("[SERVER] Press Ctrl+C to stop.\n")
            httpd.serve_forever()
    except OSError as e:
        print(f"\n[ERROR] Port {port} is busy or invalid.")
        print(f"Error details: {e}")
        input("Press Enter to exit...")
    except KeyboardInterrupt:
        print("\n[SERVER] Stopping...")

if __name__ == "__main__":
    port = DEFAULT_PORT
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            pass
            
    run_server(port)