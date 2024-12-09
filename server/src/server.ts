import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'node:path';
import type { Request, Response } from 'express';
import db from './config/connection.js';
import { ApolloServer } from '@apollo/server'; // Import Apollo Server
import { expressMiddleware } from '@apollo/server/express4'; // Correct import for Express 4
import { typeDefs, resolvers } from './schemas/index.js';
import jwt from 'jsonwebtoken';

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
    context: async ({ req }: { req: Request }) => {
      let user = null;
      const authHeader = req.headers.authorization;

      if (authHeader) {
        const token = authHeader.split(' ')[1]; // Get the token from the header
        const secretKey = process.env.JWT_SECRET_KEY || '';

        try {
          user = jwt.verify(token, secretKey); // Verify the token
        } catch (err) {
          console.error('Token verification failed:', err);
        }
      }

      return { user }; // Pass the authenticated user to the context
    }
  }));

  // Serve static files in production
  if (process.env.NODE_ENV === 'production') {
    const __dirname = path.dirname(new URL(import.meta.url).pathname);
    // Adjust the path to point to the client/dist directory
    app.use(express.static(path.join(__dirname, '../../client/dist')));

    // Serve index.html for any other request
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`API server running on port ${PORT}!`);
    console.log(`Use GraphQL at http://localhost:${PORT}/graphql`);
  });
};

startApolloServer();