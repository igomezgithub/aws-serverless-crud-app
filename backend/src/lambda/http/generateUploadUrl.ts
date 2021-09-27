import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'

import { createAttachmentPresignedUrl, updateUploadURL } from '../../businessLogic/todos'
// import { getUserId } from '../utils'
import { createLogger } from '../../utils/logger';

const logger = createLogger('todos')

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const todoId = event.pathParameters.todoId
    logger.info('Todo Id: ', todoId)
    // TODO: Return a presigned URL to upload a file for a TODO item with the provided id
    const url = await createAttachmentPresignedUrl(todoId);
    const todoItem = await updateUploadURL(todoId);
    logger.info('New Todo Item updated: ', todoItem)

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
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
      credentials: false
    })
  )
