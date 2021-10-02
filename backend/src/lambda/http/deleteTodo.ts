import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'
import { deleteTodo } from '../../businessLogic/todos'
import { createLogger } from '../../utils/logger';
import { getUserId } from '../utils'

const logger = createLogger('deleteTodo');

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const todoId = event.pathParameters.todoId
    // TODO: Remove a TODO item by id
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

    await deleteTodo(todoId, userId);
    logger.info('User was deleted');
  
    return {
      statusCode: 200,
      body: ''
    }
  }
)

handler
  .use(httpErrorHandler())
  .use(
    cors({
      credentials: true
    })
  )
