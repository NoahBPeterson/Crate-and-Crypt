import { serve } from "bun";
import { join } from "path";
import { readFileSync, statSync, existsSync } from "fs";

const STATIC_DIR = join(import.meta.dir, "..");
const PUBLIC_DIR = join(STATIC_DIR, "public");

// Create service worker for cross-origin isolation
const coiServiceWorker = `
// This service worker allows cross-origin isolation for better performance
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response.status === 0) {
          return response;
        }
        
        const newHeaders = new Headers(response.headers);
        newHeaders.set('Cross-Origin-Embedder-Policy', 'require-corp');
        newHeaders.set('Cross-Origin-Opener-Policy', 'same-origin');
        
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: newHeaders,
        });
      })
      .catch(e => console.error(e))
  );
});
`;

// Write service worker file
const serviceWorkerPath = join(PUBLIC_DIR, "coi-serviceworker.js");
try {
  Bun.write(serviceWorkerPath, coiServiceWorker);
  console.log("Created service worker at", serviceWorkerPath);
} catch (error) {
  console.error("Error creating service worker:", error);
}

// Copy CSS to public directory if it doesn't exist yet
const CSS_SOURCE = join(STATIC_DIR, "src", "css", "main.css");
const CSS_DEST = join(PUBLIC_DIR, "css");

if (!existsSync(join(CSS_DEST, "main.css")) && existsSync(CSS_SOURCE)) {
  console.log("Copying CSS to public directory...");
  try {
    if (!existsSync(CSS_DEST)) {
      Bun.spawnSync(["mkdir", "-p", CSS_DEST]);
    }
    Bun.spawnSync(["cp", CSS_SOURCE, CSS_DEST]);
  } catch (error) {
    console.error("Error copying CSS:", error);
  }
}

console.log("Starting development server...");
console.log(`Static files from: ${STATIC_DIR}`);
console.log(`Public files from: ${PUBLIC_DIR}`);

function getMimeType(path: string): string {
  if (path.endsWith(".html")) return "text/html";
  if (path.endsWith(".js")) return "text/javascript";
  if (path.endsWith(".css")) return "text/css";
  if (path.endsWith(".json")) return "application/json";
  if (path.endsWith(".png")) return "image/png";
  if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
  if (path.endsWith(".svg")) return "image/svg+xml";
  if (path.endsWith(".ts")) return "application/typescript";
  return "text/plain";
}

function tryReadFile(path: string): Buffer | null {
  try {
    if (existsSync(path)) {
      const stat = statSync(path);
      if (stat.isFile()) {
        return readFileSync(path);
      }
    }
    return null;
  } catch (error) {
    console.error(`Error reading file ${path}:`, error);
    return null;
  }
}

const server = serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);
    let path = url.pathname;
    
    // Default to index.html for root path
    if (path === "/" || path === "") {
      path = "/index.html";
    }
    
    // Special handling for app.js - redirect to our app.ts
    if (path === "/app.js") {
      const tsFile = join(STATIC_DIR, "src", "js", "app.ts");
      try {
        const compiled = await Bun.build({
          entrypoints: [tsFile],
          minify: false,
          target: "browser",
        });
        
        const output = await compiled.outputs[0].text();
        return new Response(output, {
          headers: { 
            "Content-Type": "text/javascript",
            "Cross-Origin-Embedder-Policy": "require-corp",
            "Cross-Origin-Opener-Policy": "same-origin"
          },
        });
      } catch (error) {
        console.error(`Error compiling app.ts:`, error);
        return new Response(`console.error("Failed to compile app.ts");`, {
          headers: { "Content-Type": "text/javascript" },
          status: 500,
        });
      }
    }
    
    // Try to serve from public directory first
    let filePath = join(PUBLIC_DIR, path.slice(1));
    let fileContent = tryReadFile(filePath);
    
    // If not found in public, try to serve from root directory
    if (!fileContent) {
      filePath = join(STATIC_DIR, path.slice(1));
      fileContent = tryReadFile(filePath);
    }
    
    // If still not found and it's a .js file, try to serve the corresponding .ts file
    if (!fileContent && path.endsWith(".js")) {
      const tsPath = path.replace(/\.js$/, ".ts");
      filePath = join(STATIC_DIR, tsPath.slice(1));
      fileContent = tryReadFile(filePath);
      
      // If found, compile the TypeScript file on the fly
      if (fileContent) {
        try {
          const compiled = await Bun.build({
            entrypoints: [filePath],
            minify: false,
            target: "browser",
          });
          
          const output = await compiled.outputs[0].text();
          return new Response(output, {
            headers: { 
              "Content-Type": "text/javascript",
              "Cross-Origin-Embedder-Policy": "require-corp",
              "Cross-Origin-Opener-Policy": "same-origin"
            },
          });
        } catch (error) {
          console.error(`Error compiling TypeScript file ${filePath}:`, error);
          return new Response(`console.error("Failed to compile ${path}");`, {
            headers: { "Content-Type": "text/javascript" },
            status: 500,
          });
        }
      }
    }
    
    // If file is found, serve it with COOP/COEP headers for cross-origin isolation
    if (fileContent) {
      return new Response(fileContent, {
        headers: { 
          "Content-Type": getMimeType(filePath),
          "Cross-Origin-Embedder-Policy": "require-corp",
          "Cross-Origin-Opener-Policy": "same-origin"
        },
      });
    }
    
    // File not found
    console.log(`404: ${path}`);
    return new Response("File not found", { status: 404 });
  },
});

console.log(`Server running at http://localhost:${server.port}`);

// Launch browser
Bun.spawn(["open", `http://localhost:${server.port}`], {
  stdio: ["inherit", "inherit", "inherit"],
}); 