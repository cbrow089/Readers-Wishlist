import { GraphQLError } from 'graphql';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { signToken } from '../services/auth.js';
import bcrypt from 'bcrypt';

export const resolvers = {
  Query: {
    me: async (_: any, __: any, context: any) => {
      // Check if the user is authenticated
      if (!context.user) {
        throw new GraphQLError('You need to be logged in!', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }
  
      // Check if the user ID is valid
      if (!mongoose.Types.ObjectId.isValid(context.user._id)) {
        throw new GraphQLError('Invalid user ID!', {
          extensions: { code: 'BAD_USER_INPUT' }
        });
      }
  
      // Find the user by their ID
      const foundUser = await User.findById(context.user._id);
  
      if (!foundUser) {
        throw new GraphQLError('Cannot find a user with this id!', {
          extensions: { code: 'NOT_FOUND' }
        });
      }
  
      console.log('Found user:', foundUser); // Log the found user for debugging
  
      return foundUser; // Return the found user, including savedBooks
    },
  },

  Mutation: {
    // Resolver for createUser
    addUser: async (_: any, { username, email, password }: { username: string; email: string; password: string }) => {
      try {
         const hashedPassword = await bcrypt.hash(password, 10);
         const user = await User.create({ username, email, password: hashedPassword });
         console.log('User created:', user); // Log the created user
         const token = signToken(user.username, user.email, user._id);
         return { token, user };
      } catch (error) {
         console.error('Error creating user:', error);
         throw new GraphQLError('Something is wrong with user creation!', {
            extensions: { code: 'BAD_USER_INPUT' }
         });
      }
   },

    // Resolver for login
    loginUser: async (_: any, { username, email, password }: { username?: string, email?: string, password: string }) => {
      const user = await User.findOne({ 
        $or: [
          username ? { username } : {}, 
          email ? { email } : {} 
        ] 
      });

      if (!user) {
        throw new GraphQLError("Can't find this user", {
          extensions: { code: 'UNAUTHORIZED' }
        });
      }

      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        throw new GraphQLError('Wrong password!', {
          extensions: { code: 'UNAUTHORIZED' }
        });
      }

      const token = signToken(user.username, user.password, user._id);
      return { token, user };
    },

      // Resolver for saveBook
      saveBook: async (_: any, { bookInput }: { bookInput: any }, context: any) => {
        // Check if the user is authenticated
        if (!context.user) {
          throw new GraphQLError('Authentication required', {
            extensions: { code: 'UNAUTHENTICATED' }
          });
        }
      
        try {
          // Update the user document by adding the bookInput to the savedBooks array
          const updatedUser = await User.findOneAndUpdate(
            { _id: context.user._id },
            { $addToSet: { savedBooks: bookInput } }, // Use $addToSet to avoid duplicates
            { new: true, runValidators: true }
          );
      
          return updatedUser; // Return the updated user
        } catch (error) {
          throw new GraphQLError('Error saving book', {
            extensions: { code: 'BAD_USER_INPUT' }
          });
        }
      },

    // Resolver for deleteBook
    removeBook: async (_: any, { bookId }: { bookId: string }, context: any) => {
      if (!context.user) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      const updatedUser = await User.findOneAndUpdate(
        { _id: context.user._id },
        { $pull: { savedBooks: { bookId } } },
        { new: true }
      );

      if (!updatedUser) {
        throw new GraphQLError("Couldn't find user with this id!", {
          extensions: { code: 'NOT_FOUND' }
        });
      }

      return updatedUser;
    }
  }
};

export default resolvers;
