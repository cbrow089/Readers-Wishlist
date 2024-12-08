import { gql } from 'apollo-server'; // Adjust the import based on your setup
export const typeDefs = gql `
  type User {
    _id: ID!
    username: String!
    email: String!
    savedBooks: [Book]
    bookCount: Int
  }

  type Book {
    bookId: ID!
    authors: [String]
    description: String
    title: String
    image: String
    link: String
  }

  type Auth {
    token: ID!
    user: User
  }

  input UserInput {
    username: String!
    email: String!
    password: String!
  }

  input BookInput {
  bookId: ID!
  authors: [String]!
  title: String!
  description: String
  image: String
  link: String
}

  type Query {
    me: User
    getSingleUser(id: ID, username: String): User
  }

  type Mutation {
    loginUser(username: String, email: String, password: String): Auth
    addUser(username: String!, email: String!, password: String!): Auth
    saveBook(book: BookInput!): User
    removeBook(bookId: ID!): User
  }
`;
export default typeDefs;
