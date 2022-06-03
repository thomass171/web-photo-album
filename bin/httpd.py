#
# A simple web server for development only!
#
# NOT FOR PRODUCTION. IT HAS MANY SECURITY ISSUES.
#
from http.server import HTTPServer, BaseHTTPRequestHandler, SimpleHTTPRequestHandler
import logging
import os, sys

logFormatter = logging.Formatter("%(asctime)s [%(threadName)-12.12s] [%(levelname)-5.5s]  %(message)s")
rootLogger = logging.getLogger()

consoleHandler = logging.StreamHandler()
consoleHandler.setFormatter(logFormatter)
rootLogger.addHandler(consoleHandler)
rootLogger.setLevel(logging.DEBUG)

rootDir = "."

class Handler(BaseHTTPRequestHandler):

    # SimpleHTTPRequestHandler do_GET does everything we need, a single file and a directory listing, but as html :-(
    def do_GET(self):
        logging.info("GET request,\nPath: %s\nHeaders:\n%s\n", str(self.path), str(self.headers))
        if self.path == '/upforfuture':
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b'up')

        #return super(Handler, self).do_GET()
        elif os.path.isdir(rootDir + self.path):
            try:
                self.send_response(200)
                self.end_headers()
                #files = os.listdir("." + self.path)
                files = os.listdir(rootDir )
                for f in files:
                    logging.debug("file %s", str(f))
                    self.wfile.write((f+"\n").encode())
            except Exception:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(b'error')
        else:
            try:
                with open(rootDir + self.path, 'rb') as f:
                    data = f.read()
                self.send_response(200)
                self.send_header("Content-type", "image/jpeg")
                self.end_headers()
                self.wfile.write(data)
            except FileNotFoundError:
                self.send_response(404)
                self.end_headers()
                self.wfile.write(b'not found')
            except PermissionError:
                self.send_response(403)
                self.end_headers()
                self.wfile.write(b'no permission')
            except Exception:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(b'error')
        #self.send_response(200)
        #self.end_headers()
        #message =  'hallo'
        #self.wfile.write(message)
        #self.wfile.write('\n')
        #return
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        return super(Handler, self).end_headers()

if __name__ == '__main__':
    rootDir = sys.argv[1]
    server = HTTPServer(('localhost', 8009), Handler)
    logging.info("Starting server, use <Ctrl-C> to stop")
    server.serve_forever()