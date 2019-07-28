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

function makeMaliciousBookmark() {
    const maliciousBookmark = {
        id: 911,
        title: 'Naughty naughty very naughty <script>alert("xss");</script>',
        url: 'http://maliciousbookmark.com',
        description: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
        rating: 1
    }
    const expectedBookmark = {
        id: 911,
        title: 'Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;',
        url: 'http://maliciousbookmark.com',
        description: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`,
        rating: 1
    }
    return {
        maliciousBookmark,
        expectedBookmark
    }
}

module.exports = { makeBookmarksArray, makeMaliciousBookmark }