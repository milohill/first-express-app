const asyncHandler = require('express-async-handler');
const { body, validationResult } = require('express-validator');
const BookInstance = require('../models/bookinstance');
const Book = require('../models/book');
Date.prototype.yyyymmdd = require('../addons/yyyymmdd');

// Display list of all BookInstances.
exports.bookinstance_list = function (req, res, next) {
  BookInstance.find()
    .populate('book')
    .exec((err, list_bookinstances) => {
      if (err) {
        return next(err);
      }
      // Successful, so render
      res.render('bookinstance_list', {
        title: 'Book Instance List',
        bookinstance_list: list_bookinstances,
      });
    });
};

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = asyncHandler(async (req, res, next) => {
  const bookInstance = await BookInstance.findById(req.params.id)
    .populate('book')
    .exec();

  if (bookInstance === null) {
    // No results.
    const err = new Error('Book copy not found');
    err.status = 404;
    return next(err);
  }

  res.render('bookinstance_detail', {
    title: 'Book:',
    bookinstance: bookInstance,
  });
});

// Display BookInstance create form on GET.
exports.bookinstance_create_get = asyncHandler(async (req, res, next) => {
  const allBooks = await Book.find({}, 'title').exec();

  res.render('bookinstance_form', {
    title: 'Create BookInstance',
    book_list: allBooks,
  });
});

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
  // Validate and sanitize fields.
  body('book', 'Book must be specified').trim().isLength({ min: 1 }).escape(),
  body('imprint', 'Imprint must be specified')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('status').escape(),
  body('due_back', 'Invalid date')
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),

  // Process request after validation and sanitization.
  asyncHandler(async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a BookInstance object with escaped and trimmed data.
    const bookInstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
    });

    if (!errors.isEmpty()) {
      // There are errors.
      // Render form again with sanitized values and error messages.
      const allBooks = await Book.find({}, 'title').exec();

      res.render('bookinstance_form', {
        title: 'Create BookInstance',
        book_list: allBooks,
        selected_book: bookInstance.book._id,
        errors: errors.array(),
        bookinstance: bookInstance,
      });
    } else {
      // Data from form is valid
      await bookInstance.save();
      res.redirect(bookInstance.url);
    }
  }),
];

// // Display BookInstance delete form on GET.
exports.bookinstance_delete_get = asyncHandler(async (req, res) => {
  res.render('bookinstance_delete', {
    title: 'Delete Bookinstance',
    bookinstanceId: req.params.id,
  });
});

// // Handle BookInstance delete on POST.
exports.bookinstance_delete_post = asyncHandler(async (req, res) => {
  await BookInstance.findByIdAndDelete(req.params.id);
  res.redirect('/catalog/bookinstances');
});

// // Display BookInstance update form on GET.
exports.bookinstance_update_get = asyncHandler(async (req, res) => {
  const allBooks = await Book.find({}).orFail().exec(); // array
  const bookinstance = await BookInstance.findById(req.params.id)
    .orFail()
    .exec();
  const book = await Book.findById(bookinstance.book).orFail().exec();

  res.render('bookinstance_form', {
    title: 'Update Bookinstance',
    book_list: allBooks,
    selected_book: book,
    bookinstance: bookinstance,
  });
});

// // Handle bookinstance update on POST.
exports.bookinstance_update_post = [
  body('book').trim().escape(),
  body('imprint').trim().escape(),
  body('due_back').trim().escape(),
  body('status').trim().escape(),
  asyncHandler(async (req, res) => {
    const allBooks = await Book.find({}).orFail().exec(); // array
    const bookinstance = await BookInstance.findById(req.params.id)
      .orFail()
      .exec();
    const book = await Book.findById(bookinstance.book).orFail().exec();
    const errors = validationResult(req);
    console.log(errors.array());
    if (!errors.isEmpty()) {
      res.render('bookinstance_form', {
        title: 'Update Bookinstance',
        book_list: allBooks,
        selected_book: book,
        bookinstance: bookinstance,
      });
    } else {
      const bookinstance = new BookInstance({
        _id: req.params.id,
        book: req.body.book,
        imprint: req.body.imprint,
        due_back: req.body.due_back,
        status: req.body.status,
      });
      const theBookinstance = await BookInstance.findByIdAndUpdate(
        req.params.id,
        bookinstance,
        {}
      );
      res.redirect(theBookinstance.url);
    }
  }),
];
