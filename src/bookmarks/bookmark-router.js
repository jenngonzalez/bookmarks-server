const express = require('express')
const xss = require('xss')
const logger = require('../logger')
const BookmarksService = require('../bookmarks-service')

const bookmarkRouter = express.Router()
const bodyParser = express.json()

const serializeBookmark = bookmark => ({
    id: bookmark.id,
    title: xss(bookmark.title),
    url: xss(bookmark.url),
    description: xss(bookmark.description),
    rating: bookmark.rating
})

bookmarkRouter
    .route('/bookmarks')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')
        BookmarksService.getAllBookmarks(knexInstance)
            .then(bookmarks => {
                res.json(bookmarks.map(serializeBookmark))
            })
            .catch(next)
    })
    .post(bodyParser, (req, res, next) => {
        const knexInstance = req.app.get('db')
        const { title, url, description, rating=1 } = req.body
        const newBookmark = { title, url, description, rating }

        for (const [key, value] of Object.entries(newBookmark)) {
            if (value == null) {
                return res.status(400).json({
                    error: { message: `Missing '${key}' in request body`}
                })
            }
        }

        if(rating > 5 || rating < 1) {
            logger.error(`Rating range is from 1 to 5`);
            return res
                .status(400)
                .json({
                    error: { message: 'Invalid data' }
                });
        }
    
        BookmarksService.insertBookmark(knexInstance, newBookmark)
        .then(bookmark => {
            res
              .status(201)
              .location(`/bookmarks/${bookmark.id}`)
              .json(serializeBookmark(bookmark))
          })
          .catch(next)
    })

bookmarkRouter
    .route('/bookmarks/:id')
    .all((req, res, next) => {
        const { id } = req.params
        const knexInstance = req.app.get('db')
        BookmarksService.getById(knexInstance, id)
            .then(bookmark => {
                if(!bookmark) {
                    return res.status(404).json({
                        error: { message: `Bookmark doesn't exist` }
                    })
                }
                res.bookmark = bookmark
                next()
            })
    })
    .get((req, res, next) => {
        res.json(serializeBookmark(res.bookmark))
    })
    .delete((req, res, next) => {
        const knexInstance = req.app.get('db')
        const { id } = req.params;
        BookmarksService.deleteBookmark(knexInstance, id)
            .then(() => {
                res.status(204).end()
            })
            .catch(next)
    })


    module.exports = bookmarkRouter