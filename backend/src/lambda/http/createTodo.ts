import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import 'source-map-support/register'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'
import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import { createTodo } from '../../businessLogic/todos'
import { getUserId } from '../utils';
import { createLogger } from '../../utils/logger'

const logger = createLogger('auth')

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    logger.info('Caller event', { Event: event })
    const newTodo: CreateTodoRequest = JSON.parse(event.body)
    // TODO: Implement creating a new TODO item
    const userId = getUserId(event)

    logger.info('The userId is', { userId: userId })

    if (!userId) {
      return {
        statusCode: 401,
        body: JSON.stringify({
          error: 'User is not authorized'
        })
      }
    }

    const newItem = await createTodo(newTodo, userId)

    return {
      statusCode: 201,
      body: JSON.stringify({
        newItem
      })
    }
  })

handler.use(
  cors({
    credentials: true
  })
)
