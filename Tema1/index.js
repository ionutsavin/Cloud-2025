const http = require('http');
const url = require('url');
const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASS,
    port: process.env.DB_PORT
});

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const { pathname, query } = parsedUrl;

    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'GET' && pathname === '/authors') {
        pool.query('SELECT * FROM authors', (error, results) => {
            if (error) {
                res.writeHead(500);
                res.end(JSON.stringify({ success: false, message: 'Server error' }));
                console.log('Server error');
            } else {
                res.writeHead(200);
                res.end(JSON.stringify({ success: true, data: results.rows }));
                console.log(results.rows);
            }
        });
    }
    else if (req.method == 'GET' && pathname == '/authors_names') {
        pool.query('SELECT name FROM authors', (error, results) => {
            if (error) {
                res.writeHead(500);
                res.end(JSON.stringify({ success: false, message: 'Server error' }));
                console.log('Server error');
            } else {
                res.writeHead(200);
                res.end(JSON.stringify({ success: true, data: results.rows }));
                console.log(results.rows);
            }
        });
    }
    else if (req.method === 'POST' && pathname === '/authors') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            const author = JSON.parse(body);
            pool.query('SELECT * FROM authors WHERE name = $1', [author.name], (error, results) => {
                if(results.rows.length > 0){
                    res.writeHead(409);
                    res.end(JSON.stringify({ success: false, message: 'Author already exists' }));
                    console.log('Author already exists');
                }
            }
            );
            pool.query('INSERT INTO authors (name) VALUES ($1) RETURNING *', [author.name], (error, results) => {
                if (error) {
                    res.writeHead(500);
                    res.end(JSON.stringify({ success: false, message: 'Server error' }));
                    console.log('Server error');
                } else {
                    res.writeHead(201);
                    res.end(JSON.stringify({ success: true, data: results.rows[0] }));
                    console.log('Author added:', results.rows[0]);
                }
            });
        });
    }
    else if(req.method == 'POST' && pathname == '/authors_books'){
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            const author = JSON.parse(body);
            pool.query('SELECT * FROM authors WHERE name = $1', [author.name], (error, results) => {
                if(results.rows.length > 0){
                    res.writeHead(409);
                    res.end(JSON.stringify({ success: false, message: 'Author already exists' }));
                    console.log('Author already exists');
                }
            }
            );
            pool.query('INSERT INTO authors (name, books_written) VALUES ($1, $2) RETURNING *', [author.name, author.books_written], (error, results) => {
                if (error) {
                    res.writeHead(500);
                    res.end(JSON.stringify({ success: false, message: 'Server error' }));
                    console.log('Server error');
                } else {
                    res.writeHead(201);
                    res.end(JSON.stringify({ success: true, data: results.rows[0] }));
                    console.log('Author added:', results.rows[0]);
                }
            });
        });
    }
    else if (req.method === 'PUT' && pathname.startsWith('/authors/')) {
        const name = pathname.split('/')[2].replace('-', ' ');
        console.log(name);
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            const author = JSON.parse(body);
            pool.query('UPDATE authors SET name = $1 WHERE name = $2 RETURNING *', [author.name, name], (error, results) => {
                if (error) {
                    res.writeHead(500);
                    res.end(JSON.stringify({ success: false, message: 'Server error' }));
                    console.log('Server error');
                } else {
                    if (results.rows.length === 0) {
                        res.writeHead(404);
                        res.end(JSON.stringify({ success: false, message: 'Author not found' }));
                        console.log('Author not found');
                    } else {
                        res.writeHead(200);
                        res.end(JSON.stringify({ success: true, data: results.rows[0] }));
                        console.log('Author updated:', results.rows[0]);
                    }
                }
            });
        });
    }
    else if (req.method === 'PUT' && pathname.startsWith('/authors_books/')) {
        const name = pathname.split('/')[2].replace('-', ' ');
        console.log(name);
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            const author = JSON.parse(body);
            pool.query('UPDATE authors SET books_written = $1 WHERE name = $2 RETURNING *', [author.books_written, name], (error, results) => {
                if (error) {
                    res.writeHead(500);
                    res.end(JSON.stringify({ success: false, message: 'Server error' }));
                    console.log('Server error');
                } else {
                    if (results.rows.length === 0) {
                        res.writeHead(404);
                        res.end(JSON.stringify({ success: false, message: 'Author not found' }));
                        console.log('Author not found');
                    } else {
                        res.writeHead(200);
                        res.end(JSON.stringify({ success: true, data: results.rows[0] }));
                        console.log('Author updated:', results.rows[0]);
                    }
                }
            });
        });
    }
    else if (req.method === 'DELETE' && pathname.startsWith('/authors/')) {
        const name = pathname.split('/')[2].replace('-', ' ');
        pool.query('DELETE FROM authors WHERE name = $1 RETURNING *', [name], (error, results) => {
            if (error) {
                res.writeHead(500);
                res.end(JSON.stringify({ success: false, message: 'Server error' }));
                console.log('Server error');
            } else {
                if (results.rows.length === 0) {
                    res.writeHead(404);
                    res.end(JSON.stringify({ success: false, message: 'Author not found' }));
                    console.log('Author not found');
                } else {
                    res.writeHead(200);
                    res.end(JSON.stringify({ success: true, data: results.rows[0] }));
                    console.log('Author deleted:', results.rows[0]);
                }
            }
        });
    }
    else if(req.method == 'DELETE' && pathname.startsWith('/authors_books/')){
        const books_written = pathname.split('/')[2];
        pool.query('DELETE FROM authors WHERE books_written = $1 RETURNING *', [books_written], (error, results) => {
            if (error) {
                res.writeHead(500);
                res.end(JSON.stringify({ success: false, message: 'Server error' }));
                console.log('Server error');
            } else {
                if (results.rows.length === 0) {
                    res.writeHead(404);
                    res.end(JSON.stringify({ success: false, message: 'Author not found' }));
                    console.log('Author not found');
                } else {
                    res.writeHead(200);
                    res.end(JSON.stringify({ success: true, data: results.rows[0] }));
                    console.log('Author deleted:', results.rows[0]);
                }
            }
        });
    }
    else {
        res.writeHead(404);
        res.end(JSON.stringify({ success: false, message: 'Route not found' }));
        console.log('Route not found');
    }
});


const port = 3000;
server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});