// Remembers what you had open on the map when you leave it for a detail page, so Back returns to the same place.
// A tab tap starts the map fresh (see clearMapMemo in App).
let memo = null
export const rememberMap = (state) => { memo = state }
export const recallMap = () => memo
export const clearMapMemo = () => { memo = null }
