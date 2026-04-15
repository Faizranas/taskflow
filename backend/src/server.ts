import { connectDB } from './config/db'
import { env } from './config/env'
import app from './app'

const start = async (): Promise<void> => {
  await connectDB()
  app.listen(env.PORT, () => {
    console.info(`Server running on port ${env.PORT}`)
  })
}

start()
