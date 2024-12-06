import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import path from 'node:path';
import db from './config/connection.js';
import { ApolloServer } from '@apollo/server'; // Import Apollo Server
import { expressMiddleware } from '@apollo/server/express4'; // Correct import for Express 4
import { typeDefs, resolvers } from './schemas/index.js';
import { authenticateToken } from './utils/auth.js'; // Import the authenticateToken function
const PORT = process.env.PORT || 3001;
const app = express();
const server = new ApolloServer({
    typeDefs,
    resolvers
});
const startApolloServer = async () => {
    await server.start(); // Start the Apollo Server
    await db(); // Connect to the database
    app.use(express.urlencoded({ extended: false }));
    app.use(express.json());
    // Apply Apollo Server middleware to the Express app
    app.use('/graphql', expressMiddleware(server, {
        context: async ({ req }) => {
            // Use the authenticateToken function to set the context
            const user = await authenticateToken(req); // Pass the request object directly
            return { user }; // Pass the user object to the context
        }
    }));
    // Serve static files in production
    if (process.env.NODE_ENV === 'production') {
        const __dirname = path.dirname(new URL(import.meta.url).pathname);
        // Adjust the path to point to the client/dist directory
        app.use(express.static(path.join(__dirname, '../client/dist')));
        // Serve index.html for any other request
        app.get('*', (_req, res) => {
            res.sendFile(path.join(__dirname, '../client/dist/index.html'));
        });
    }
    app.listen(PORT, () => {
        console.log(`API server running on port ${PORT}!`);
        console.log(`Use GraphQL at http://localhost:${PORT}/graphql`);
    });
};
startApolloServer();
