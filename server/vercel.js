import { errorHandler } from './lib/http.js'
import app from './app.js'

app.use(errorHandler)

export default app
