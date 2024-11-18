import { GraphQLError } from 'graphql';
import User from '../models/User.js';
import { signToken } from '../services/auth.js';

export const resolvers = {
  Query: {
    // Resolver for getSingleUser
    getUser: async (_: any, { id, username }: { id?: string, username?: string }, context: any) => {
      // If no context.user for id, use the provided id or username
      const searchCriteria = context.user 
        ? { _id: context.user._id } 
        : { 
            $or: [
              id ? { _id: id } : {}, 
              username ? { username: username } : {} 
            ] 
          };

      const foundUser = await User.findOne(searchCriteria);

      if (!foundUser) {
        throw new GraphQLError('Cannot find a user with this id!', {
          extensions: { code: 'NOT_FOUND' }
        });
      }

      return foundUser;
    }
  },

  Mutation: {
    // Resolver for createUser
    createUser: async (_: any, { input }: { input: any }) => {
      try {
        const user = await User.create(input);
        const token = signToken(user.username, user.password, user._id);
        return { token, user };
      } catch (error) {
        throw new GraphQLError('Something is wrong with user creation!', {
          extensions: { code: 'BAD_USER_INPUT' }
        });
      }
    },

    // Resolver for login
    login: async (_: any, { username, email, password }: { username?: string, email?: string, password: string }) => {
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
    saveBook: async (_: any, { book }: { book: any }, context: any) => {
      if (!context.user) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      try {
        const updatedUser = await User.findOneAndUpdate(
          { _id: context.user._id },
          { $addToSet: { savedBooks: book } },
          { new: true, runValidators: true }
        );

        return updatedUser;
      } catch (error) {
        throw new GraphQLError('Error saving book', {
          extensions: { code: 'BAD_USER_INPUT' }
        });
      }
    },

    // Resolver for deleteBook
    deleteBook: async (_: any, { bookId }: { bookId: string }, context: any) => {
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
