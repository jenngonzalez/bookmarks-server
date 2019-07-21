require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const helmet = require('helmet')
const { NODE_ENV } = require('./config')
const uuid = require('uuid/v4')
const winston = require('winston')


const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File( { filename: 'info.log' } )
    ]
})

if(NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }))
}

const app = express()

const morganOption = (NODE_ENV === 'production')
    ? 'tiny'
    : 'common';

app.use(morgan(morganOption))
app.use(helmet())
app.use(cors())
app.use(express.json())

const bookmarks = [
    {
        name: 'bookmark one',
        id: 1
    },
    {
        name: 'bookmark two',
        id: 2
    },
    {
        name: 'bookmark three',
        id: 3
    }
]


app.use(function validateBearerToken(req, res, next) {
    const apiToken = process.env.API_TOKEN
    const authToken = req.get('Authorization')

    if(!authToken || authToken.split(' ')[1] !== apiToken) {
        logger.error(`Unauthorized request to path: ${req.path}`);
        return res
            .status(401)
            .json({ error: 'Unauthorized request'})
    }
    next()
})


app.get('/', (req, res) => {
    res.send('Hello, boilerplate!')
})

app.get('/bookmarks', (req, res) => {
    res
        .json(bookmarks)
})

app.get('/bookmarks/:id', (req, res) => {
    const { id } = req.params;
    const bookmark = bookmarks.find(bm => bm.id == id);

    if(!bookmark) {
        logger.error(`Bookmark with id ${id} not found.`);
        return res
            .status(404)
            .send('Bookmark Not Found');
    }
    res.json(bookmark)
})

app.post('/bookmarks', (req, res) => {
    const { name } = req.body;

    if(!name) {
        logger.error(`Name is required`);
        return res
            .status(400)
            .send('Invalid data');
    }

    const id = uuid();

    const bookmark = {
        name,
        id
    }

    bookmarks.push(bookmark);
    logger.info(`Bookmark with id ${id} created`);
    res
        .status(201)
        .location(`http://localhost:8000/bookmarks/${id}`)
        .json(bookmark);
})

app.delete('/bookmarks/:id', (req, res) => {
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


app.use(function errorHandler(error, req, res, next) {
    let response
    if(NODE_ENV === 'production') {
        response = { error: { message: 'server error' } }
    } else {
        console.error(error)
        response = { message: error.message, error }
    }
    res.status(500).json(response)
})


module.exports = app