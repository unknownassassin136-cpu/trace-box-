import { spawn } from 'child_process';
import process from 'process';

console.log("Starting TraceNode backend from root wrapper...");

// Run npm install in the backend directory first
const install = spawn('npm', ['install'], {
  cwd: './backend',
  stdio: 'inherit',
  shell: true
});

install.on('close', (code) => {
  if (code !== 0) {
    console.error(`npm install failed with code ${code}`);
    process.exit(1);
  }
  
  console.log("Backend dependencies installed. Starting server...");
  
  // Now run the actual backend server from the backend directory
  const server = spawn('npm', ['run', 'dev'], {
    cwd: './backend',
    stdio: 'inherit',
    shell: true
  });

  server.on('close', (code) => {
    console.log(`Backend server exited with code ${code}`);
    process.exit(code ?? 1);
  });
});
