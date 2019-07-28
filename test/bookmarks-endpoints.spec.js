const { expect } = require('chai')
const knex = require('knex')
const app = require('../src/app')
const { makeBookmarksArray, makeMaliciousBookmark } = require('./bookmarks.fixtures')

describe.only('Bookmarks Endpoints', function() {
    let db

    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL
        })
        app.set('db', db)
    })

    after('disconnect from db', () => db.destroy())

    before('clean the table', () => db('bookmarks_table').truncate())

    afterEach('cleanup', () => db('bookmarks_table').truncate())

    describe(`GET /bookmarks`, () => {
        context('Given no bookmarks', () => {
            it(`responds with 200 and an empty list`, () => {
                return supertest(app)
                .get('/bookmarks')
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(200, [])
            })
        })

        context('Given there are bookmarks in the database', () => {
            const testBookmarks = makeBookmarksArray()

            beforeEach('insert bookmarks', () => {
                return db
                    .into('bookmarks_table')
                    .insert(testBookmarks)
            })

            it('responds with 200 and all of the bookmarks', () => {
                return supertest(app)
                    .get('/bookmarks')
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200, testBookmarks)
            })
        })

        context(`Given an XSS attack bookmark`, () => {
            const { maliciousBookmark, expectedBookmark } = makeMaliciousBookmark()

            beforeEach('insert malicious bookmark', () => {
                return db
                    .into('bookmarks_table')
                    .insert([ maliciousBookmark ])
            })

            it('removes XSS attack content', () => {
                return supertest(app)
                    .get('/bookmarks')
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200)
                    .expect(res => {
                        expect(res.body[0].title).to.eql(expectedBookmark.title)
                        expect(res.body[0].description).to.eql(expectedBookmark.description)
                    })
            })
        })
    })

    describe(`GET /bookmarks/:id`, () => {
        context(`Given no bookmarks`, () => {
            it(`responds with 404`, () => {
                const bookmarkId = 12345
                return supertest(app)
                    .get(`/bookmarks/${bookmarkId}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(404, { error: { message: `Bookmark doesn't exist`}})
            })
        })
        context('Given there are bookmarks in the database', () => {
            const testBookmarks = makeBookmarksArray()

            beforeEach('insert bookmarks', () => {
                return db
                    .into('bookmarks_table')
                    .insert(testBookmarks)
            })

            it('responds with 200 and the specified bookmark', () => {
                const bookmarkId = 2
                const expectedBookmark = testBookmarks[bookmarkId - 1]
                return supertest(app)
                    .get(`/bookmarks/${bookmarkId}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200, expectedBookmark)
            })
        })

        context('Given an XSS attack bookmark', () => {
            const { maliciousBookmark, expectedBookmark } = makeMaliciousBookmark()

            beforeEach('insert malicious bookmark', () => {
                return db
                    .into('bookmarks_table')
                    .insert([ maliciousBookmark ])
            })

            it('removes XSS attack content', () => {
                return supertest(app)
                    .get(`/bookmarks/${maliciousBookmark.id}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200)
                    .expect(res => {
                        expect(res.body.title).to.eql(expectedBookmark.title)
                        expect(res.body.description).to.eql(expectedBookmark.description)
                    })
            })
        })
    })

    describe.only(`POST /bookmarks`, () => {
        it(`creates a new bookmark, responding with 201 and the new bookmark`, () => {
            const newBookmark = {
                title: 'Test new bookmark',
                url: 'http://www.testnewbookmark.com/',
                description: 'Test new bookmark description ...',
                rating: 5
            }
            return supertest(app)
                .post('/bookmarks')
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .send(newBookmark)
                .expect(201)
                .expect(res => {
                    expect(res.body.title).to.eql(newBookmark.title)
                    expect(res.body.url).to.eql(newBookmark.url)
                    expect(res.body.description).to.eql(newBookmark.description)
                    expect(res.body.rating).to.eql(newBookmark.rating)
                    expect(res.body).to.have.property('id')
                    expect(res.headers.location).to.eql(`/bookmarks/${res.body.id}`)
                })
                .then(postRes => {
                    supertest(app)
                        .get(`/bookmarks/${postRes.body.id}`)
                        .expect(postRes.body)
                })
        })

        const requiredFields = ['title', 'url', 'description']

        requiredFields.forEach(field => {
            const newBookmark = {
                title: 'Test new bookmark',
                url: 'http://www.testnewbookmark.com',
                description: 'Test new bookmark description...'
            }

            it(`responds with 400 and an error message when the '${field}' is missing`, () => {
                delete newBookmark[field]

                return supertest(app)
                    .post('/bookmarks')
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .send(newBookmark)
                    .expect(400, {
                        error: { message: `Missing '${field}' in request body` }
                    })
            })
        })

        it(`responds with 400 and 'invalid data' when user tries to post a rating <1`, () => {
            const newBookmark = {
                title: 'Test new bookmark',
                url: 'http://www.testnewbookmark.com',
                description: 'Test new bookmark description...',
                rating: 0
            }
            return supertest(app)
                .post('/bookmarks')
                .set('Authorization', `Bearer: ${process.env.API_TOKEN}`)
                .send(newBookmark)
                .expect(400, {
                    error: { message: 'Invalid data' }
                })
        })

        it(`responds with 400 and 'invalid data' when user tries to post a rating >5`, () => {
            const newBookmark = {
                title: 'Test new bookmark',
                url: 'http://www.testnewbookmark.com',
                description: 'Test new bookmark description...',
                rating: 6
            }
            return supertest(app)
                .post('/bookmarks')
                .set('Authorization', `Bearer: ${process.env.API_TOKEN}`)
                .send(newBookmark)
                .expect(400, {
                    error: { message: 'Invalid data' }
                })
        })

        it(`removes XSS attack content from response`, () => {
            const { maliciousBookmark, expectedBookmark } = makeMaliciousBookmark()
            return supertest(app)
                .post(`/bookmarks`)
                .set('Authorization', `Bearer: ${process.env.API_TOKEN}`)
                .send(maliciousBookmark)
                .expect(201)
                .expect(res => {
                    expect(res.body.title).to.eql(expectedBookmark.title)
                    expect(res.body.description).to.eql(expectedBookmark.description)
                })
        })
    })
})