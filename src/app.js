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
    // returns a single bookmark with the given id
    // returns 404 not valid if no id exists
})

app.post('/bookmarks', (req, res) => {
    // accepts a json object representing a bookmark and adds it to the list of bookmarks AFTER validation
})

app.delete('/bookmarks/:id', (req, res) => {
    // deletes the bookmark with the given ID
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