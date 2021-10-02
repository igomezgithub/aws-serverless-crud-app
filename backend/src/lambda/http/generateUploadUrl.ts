import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'

import { createAttachmentPresignedUrl, updateUploadURL } from '../../businessLogic/todos'
import { getUserId } from '../utils'
import { createLogger } from '../../utils/logger';

const logger = createLogger('todos')

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const todoId = event.pathParameters.todoId
    logger.info('Todo Id: ', {TodoId: todoId})

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

    // TODO: Return a presigned URL to upload a file for a TODO item with the provided id
    const url = await createAttachmentPresignedUrl(todoId);

    logger.info('Upload URL generated: ', {Url: url});
    const todoItem = await updateUploadURL(todoId, userId);
    logger.info('New Todo Item updated: ', todoItem)

    return {
      statusCode: 200,
      body: JSON.stringify({
        uploadURL: url
      })
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
