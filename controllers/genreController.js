const async = require('async');
const { body, validationResult } = require('express-validator');
const asyncHandler = require('express-async-handler');
const Genre = require('../models/genre');
const Book = require('../models/book');

// Display list of all Genre.
exports.genre_list = (req, res, next) => {
  Genre.find()
    .sort({ name: 1 })
    .exec((err, list_genre) => {
      if (err) {
        next(err);
      }
      res.render('genre_list', { title: 'Genre List', genre_list: list_genre });
    });
};

// Display detail page for a specific Genre.
exports.genre_detail = (req, res, next) => {
  async.parallel(
    {
      genre(callback) {
        Genre.findById(req.params.id).exec(callback);
      },

      genre_books(callback) {
        Book.find({ genre: req.params.id }).exec(callback);
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      if (results.genre == null) {
        // No results.
        const err = new Error('Genre not found');
        err.status = 404;
        return next(err);
      }
      // Successful, so render
      res.render('genre_detail', {
        title: 'Genre Detail',
        genre: results.genre,
        genre_books: results.genre_books,
      });
    }
  );
};

// Display Genre create form on GET.
exports.genre_create_get = (req, res, next) => {
  res.render('genre_form', { title: 'Create Genre' });
};

// Handle Genre create on POST.
exports.genre_create_post = [
  // Validate and sanitize the name field.
  body('name', 'Genre name must contain at least 3 characters')
    .trim()
    .isLength({ min: 3 })
    .escape(),

  // Process request after validation and sanitization.
  asyncHandler(async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a genre object with escaped and trimmed data.
    const genre = new Genre({ name: req.body.name });

    if (!errors.isEmpty()) {
      // There are errors. Render the form again with sanitized values/error messages.
      res.render('genre_form', {
        title: 'Create Genre',
        genre: genre,
        errors: errors.array(),
      });
    } else {
      // Data from form is valid.
      // Check if Genre with same name already exists.
      const genreExists = await Genre.findOne({ name: req.body.name }).exec();
      if (genreExists) {
        // Genre exists, redirect to its detail page.
        res.redirect(genreExists.url);
      } else {
        await genre.save();
        // New genre saved. Redirect to genre detail page.
        res.redirect(genre.url);
      }
    }
  }),
];

// Display Genre delete form on GET.
exports.genre_delete_get = asyncHandler(async (req, res) => {
  const [books, genre] = await Promise.all([
    Book.find({ genre: req.params.id }).exec(),
    Genre.findById(req.params.id).exec(),
  ]);
  res.render('genre_delete', {
    title: 'Delete Genre',
    books,
    genre,
  });
});

// Handle Genre delete on POST.
exports.genre_delete_post = asyncHandler(async (req, res) => {
  await Genre.findByIdAndDelete(req.params.id);
  res.redirect('/catalog/genres');
});

// Display Genre update form on GET.
exports.genre_update_get = asyncHandler(async (req, res) => {
  const genre = await Genre.findById(req.params.id).exec();
  res.render('genre_form', {
    title: 'Update Genre',
    genre,
  });
});

// Handle Genre update on POST.
exports.genre_update_post = [
  body('name').trim().escape(),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.render('genre_form', {
        title: 'Update Genre',
        genre: req.body,
        errors: errors.array(),
      });
    } else {
      const genre = new Genre({
        _id: req.params.id,
        name: req.body.name,
      });
      const newGenre = await Genre.findByIdAndUpdate(req.params.id, genre, {});
      res.redirect(newGenre.url);
    }
  }),
];
