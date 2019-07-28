const express = require('express')
const xss = require('xss')
const uuid = require('uuid/v4')
const logger = require('../logger')
const { bookmarks } = require('../store')
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
                res.json(bookmarks)
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
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')
        const { id } = req.params;
        BookmarksService.getById(knexInstance, id)
            .then(bookmark => {
                if(!bookmark) {
                    return res.status(404).json({
                        error: { message: `Bookmark doesn't exist`}
                    })
                }
                res.json(bookmark)
            })
            .catch(next)
    })
    .delete((req, res) => {
        const { id } = req.params;

        const bookmarkIndex = bookmarks.findIndex(bm => bm.id == id);
    
        if(bookmarkIndex === -1) {
            logger.error(`Bookmark with id ${id} not found.`);
            return res
                .status(404)
                .send('Not Found');
        }
    
        bookmarks.splice(bookmarkIndex, 1);
    
        logger.info(`Bookmark with id ${id} deleted.`);
        res
            .status(204)
            .end();
    })


    module.exports = bookmarkRouter