import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const port = 5000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set the project root as two levels up from server.js (now in src/server)
const projectRoot = path.join(__dirname, '../..');

// Serve static files from the project root
app.use(express.static(projectRoot));

// Serve assets directories
app.use('/src', express.static(path.join(projectRoot, 'src')));
app.use('/assets', express.static(path.join(projectRoot, 'src/assets')));

app.get('/', (req, res) => {
    res.sendFile(path.join(projectRoot, 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
