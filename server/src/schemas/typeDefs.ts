import { gql } from 'apollo-server'; // Adjust the import based on your setup

export const typeDefs = gql`
  type User {
    _id: ID!
    username: String!
    email: String!
    savedBooks: [Book!]
  }

  type Book {
    bookId: String!
    authors: [String]
    description: String
    title: String!
    image: String
    link: String
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  input UserInput {
    username: String!
    email: String!
    password: String!
  }

  input BookInput {
    bookId: String!
    authors: [String]
    description: String
    title: String!
    image: String
    link: String
  }

  type Query {
    getUser(id: ID, username: String): User
  }

  type Mutation {
    createUser(input: UserInput!): AuthPayload!
    login(username: String, email: String, password: String!): AuthPayload!
    saveBook(book: BookInput!): User!
    deleteBook(bookId: String!): User!
  }
`;

export default typeDefs;
