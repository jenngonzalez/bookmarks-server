// this file can export functions we use to make articles
// the term "fixtures" is similar in meaning to "seed" data but more dedicated to testing

function makeBookmarksArray() {
    return [
        {
            id: 1,
            title: 'Test Bookmark 1',
            url: 'http://testbookmark1.com',
            description: 'Description for test bookmark 1',
            rating: 5

        },
        {
            id: 2,
            title: 'Test Bookmark 2',
            url: 'http://testbookmark2.com',
            description: 'Description for test bookmark 2',
            rating: 4
        },
        {
            id: 3,
            title: 'Test Bookmark 3',
            url: 'http://testbookmark3.com',
            description: 'Description for test bookmark 3',
            rating: 2
        }
    ]
}

module.exports = { makeBookmarksArray }