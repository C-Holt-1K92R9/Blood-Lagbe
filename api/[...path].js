import { errorHandler } from '../server/lib/http.js'
import app from '../server/app.js'

app.use(errorHandler)

export default app
