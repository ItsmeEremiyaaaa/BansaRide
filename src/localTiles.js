import { PMTiles } from 'pmtiles'

// The Bansalan map is one 2 MB file. It is read once (from the app's saved copy when there is no signal) and then
// every map piece is cut out of memory. That avoids partial downloads, which a saved copy cannot answer.
class WholeFileSource {
  constructor(url) { this.url = url; this.data = null }
  getKey() { return this.url }
  async getBytes(offset, length) {
    this.data ??= fetch(this.url).then((r) => { if (!r.ok) throw new Error('map file ' + r.status); return r.arrayBuffer() })
    const buf = await this.data
    return { data: buf.slice(offset, offset + length) }
  }
}
export const bansalanTiles = (url) => new PMTiles(new WholeFileSource(url))
