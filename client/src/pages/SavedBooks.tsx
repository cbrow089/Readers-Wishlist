import { Container, Card, Button, Row, Col } from 'react-bootstrap';
import { useQuery, useMutation } from '@apollo/client';
import { GET_ME } from '../utils/queries'; // Ensure this is the correct path
import { REMOVE_BOOK } from '../utils/mutations'; // Ensure this is the correct path
import Auth from '../utils/auth';
import { removeBookId } from '../utils/localStorage';
import type { User } from '../models/User';
import type { Book } from '../models/Book';
import { useState, useEffect } from 'react';

const SavedBooks = () => {
  const { loading, data: userData } = useQuery(GET_ME);
  const [removeBook] = useMutation(REMOVE_BOOK);
  const [savedBooks, setSavedBooks] = useState<Book[]>([]);

    // Update savedBooks state whenever data changes
    useEffect(() => {
      if (userData?.me?.savedBooks) {
        setSavedBooks(userData.me.savedBooks);
      }
    }, [userData]);

  const user: User = userData?.me || {
    username: '',
    email: '',
    savedBooks: [],
  };

  console.log(userData);
  if (userData?.me) {
    console.log("Saved books:", userData.me.savedBooks); // Log saved books
  }

  const handleDeleteBook = async (bookId: string) => {
    const token = Auth.loggedIn() ? Auth.getToken() : null;

    if (!token) {
      return false;
    }

    try {
      const response = await removeBook({ variables: { bookId } });

      if (!response.data) {
        throw new Error('something went wrong!');
      }

      // Update local state to remove the book
      setSavedBooks((prevBooks) => prevBooks.filter((book) => book.bookId !== bookId));

      // upon success, remove book's id from localStorage
      removeBookId(bookId);
    } catch (err) {
      console.error(err);
      // Optionally, show an error message to the user
    }
  };

  // if data isn't here yet, say so
  if (loading) {
    return <h2>LOADING...</h2>;
  }
  console.log("Query data:", userData);
  return (
    <>
      <div className='text-light bg-dark p-5'>
        <Container>
          {user.username ? (
            <h1>Viewing {user.username}'s saved books!</h1>
          ) : (
            <h1>Viewing saved books!</h1>
          )}
        </Container>
      </div>
      <Container>
        <h2 className='pt-5'>
          {savedBooks.length
            ? `Viewing ${savedBooks.length} saved ${savedBooks.length === 1 ? 'book' : 'books'}:`
            : 'You have no saved books!'}
        </h2>
        <Row>
          {savedBooks.map((book) => (
            <Col md='4' key={book.bookId}>
              <Card border='dark'>
                {book.image ? (
                  <Card.Img
                    src={book.image}
                    alt={`The cover for ${book.title}`}
                    variant='top'
                  />
                ) : null}
                <Card.Body>
                  <Card.Title>{book.title}</Card.Title>
                  <p className='small'>Authors: {book.authors.join(', ')}</p>
                  <Card.Text>{book.description}</Card.Text>
                  <Button
                    className='btn-block btn-danger'
                    onClick={() => handleDeleteBook(book.bookId)}
                  >
                    Delete this Book!
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </>
  );
};

export default SavedBooks;