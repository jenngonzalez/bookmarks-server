const BookmarksService = {
    // put methods on this object that store our transactions
    getAllBookmarks(knex) {
        return knex.select('*').from('bookmarks_table')
    },
    insertBookmark(knex, newBookmark) {
        // return Promise.resolve({})
        return knex
            .insert(newBookmark)
            .into('bookmarks_table')
            .returning('*')
            .then(rows => {
                return rows[0]
            })
    },
    getById(knex, id) {
        return knex
            .from('bookmarks_table')
            .select('*')
            .where('id', id).first()
    },
    deleteBookmark(knex, id) {
        return knex('bookmarks_table')
            .where({ id })
            .delete()
    },
    updateBookmark(knex, id, newBookmarkData) {
        return knex('bookmarks_table')
            .where({ id })
            .update(newBookmarkData)
    }
}

module.exports = BookmarksService