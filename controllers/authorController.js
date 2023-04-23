const asyncHandler = require('express-async-handler');
const { body, validationResult } = require('express-validator');

const Author = require('../models/author');
const Book = require('../models/book');

// Display list of all Authors.
exports.author_list = function (req, res, next) {
  Author.find()
    .sort([['family_name', 'ascending']])
    .exec((err, list_authors) => {
      if (err) {
        return next(err);
      }
      // Successful, so render
      res.render('author_list', {
        title: 'Author List',
        author_list: list_authors,
      });
    });
};

// Display Author create form on GET.
exports.author_create_get = (req, res, next) => {
  res.render('author_form', { title: 'Create Author' });
};

// Handle Author create on POST.
exports.author_create_post = [
  // Validate and sanitize fields.
  body('first_name')
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage('First name must be specified.')
    .isAlphanumeric()
    .withMessage('First name has non-alphanumeric characters.'),
  body('family_name')
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage('Family name must be specified.')
    .isAlphanumeric()
    .withMessage('Family name has non-alphanumeric characters.'),
  body('date_of_birth', 'Invalid date of birth')
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),
  body('date_of_death', 'Invalid date of death')
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),

  // Process request after validation and sanitization.
  asyncHandler(async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create Author object with escaped and trimmed data
    const author = new Author({
      first_name: req.body.first_name,
      family_name: req.body.family_name,
      date_of_birth: req.body.date_of_birth,
      date_of_death: req.body.date_of_death,
    });

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/errors messages.
      res.render('author_form', {
        title: 'Create Author',
        author: author,
        errors: errors.array(),
      });
    } else {
      // Data from form is valid.

      // Save author.
      await author.save();
      // Redirect to new author record.
      res.redirect(author.url);
    }
  }),
];

// Display Author update form on GET.
exports.author_update_get = asyncHandler(async (req, res) => {
  const author = await Author.findById(req.params.id).exec();

  res.render('author_form', {
    title: 'Update Author',
    author,
  });
});

// Handle Author update on POST.
exports.author_update_post = [
  // validate the data
  body('first_name', 'First name should be defined')
    .trim()
    .escape()
    .isLength({ min: 1 }),
  body('family_name', 'First name should be defined')
    .trim()
    .escape()
    .isLength({ min: 1 }),
  body('date_of_birth').optional().trim().escape(),
  body('date_of_death').optional().trim().escape(),
  // handling the data
  asyncHandler(async (req, res, next) => {
    const author = new Author({
      _id: req.params.id,
      first_name: req.body.first_name,
      family_name: req.body.family_name,
      ...(req.body.date_of_birth && { date_of_birth: req.body.date_of_birth }),
      ...(req.body.date_of_death && { date_of_death: req.body.date_of_death }),
    });
    console.log(author);

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.render('author_form', {
        title: 'Update Author',
        author,
        errors: errors.array(),
      });
    } else {
      const theAuthor = await Author.findByIdAndUpdate(
        req.params.id,
        author,
        {}
      );
      res.redirect(theAuthor.url);
    }
  }),
];

// Display detail page for a specific Author.
exports.author_detail = asyncHandler(async (req, res, next) => {
  // Get details of author and all their books (in parallel)
  const [author, allBooksByAuthor] = await Promise.all([
    Author.findById(req.params.id).exec(),
    Book.find({ author: req.params.id }, 'title summary').exec(),
  ]);

  if (author === null) {
    // No results.
    const err = new Error('Author not found');
    err.status = 404;
    return next(err);
  }

  res.render('author_detail', {
    title: 'Author Detail',
    author: author,
    author_books: allBooksByAuthor,
  });
});

// Display Author delete form on GET.
exports.author_delete_get = asyncHandler(async (req, res, next) => {
  // Get details of author and all their books (in parallel)
  const [author, allBooksByAuthor] = await Promise.all([
    Author.findById(req.params.id).exec(),
    Book.find({ author: req.params.id }, 'title summary').exec(),
  ]);

  if (author === null) {
    // No results.
    res.redirect('/catalog/authors');
  }

  res.render('author_delete', {
    title: 'Delete Author',
    author: author,
    author_books: allBooksByAuthor,
  });
});

// Handle Author delete on POST.
exports.author_delete_post = asyncHandler(async (req, res, next) => {
  // Get details of author and all their books (in parallel)
  const [author, allBooksByAuthor] = await Promise.all([
    Author.findById(req.params.id).exec(),
    Book.find({ author: req.params.id }, 'title summary').exec(),
  ]);

  if (allBooksByAuthor.length > 0) {
    // Author has books. Render in the same way as for GET route.
    res.render('author_delete', {
      title: 'Delete Author',
      author: author,
      author_books: allBooksByAuthor,
    });
  } else {
    // Author has no books. Delete object and redirect to the list of authors.
    await Author.findByIdAndRemove(req.body.authorid);
    res.redirect('/catalog/authors');
  }
});
