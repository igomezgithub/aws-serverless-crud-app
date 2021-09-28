import * as AWS  from 'aws-sdk'
// import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest';
import { TodoItem } from '../models/TodoItem'
import { createLogger } from '../utils/logger';

// const XAWS = AWSXRay.captureAWS(AWS)
const s3 = new AWS.S3({
  signatureVersion: 'v4'
})

const logger = createLogger('itemAccess')
const bucketName = process.env.ATTACHMENT_S3_BUCKET
const urlExpiration = process.env.SIGNED_URL_EXPIRATION

export class ItemAccess {

  constructor(
    private readonly docClient: DocumentClient = createDynamoDBClient(),
    private readonly todosTable = process.env.TODOS_TABLE) {
  }

  async getAllTodos(userId: string): Promise<TodoItem[]> {
    logger.info('Get all Todos')

    const result = await this.docClient.query({
      TableName: this.todosTable,
      KeyConditionExpression: 'userId = :userId',
			ExpressionAttributeValues: {
				':userId': userId
			},
			ScanIndexForward: false
    }).promise()
    
    const items = result.Items
    logger.info('User:', {UserId: userId})
    logger.info('All Todos for this user:', {Items: items})
    
    return items as TodoItem[]
  }

  async createTodo(todoItem: TodoItem): Promise<TodoItem> {
    await this.docClient.put({
      TableName: this.todosTable,
      Item: todoItem
    }).promise()

    return todoItem
  }

  async updateTodo(todoId: string, updatedTodo: UpdateTodoRequest): Promise<TodoItem>{
    logger.info("Updating todo Item: ", todoId)
    const result = await this.docClient.query({
        TableName: this.todosTable,
        KeyConditionExpression: 'todoId = :todoId',
        ExpressionAttributeValues: {
            ':todoId': todoId
        },
        ScanIndexForward: false
    }).promise()
    
    logger.info("Todo Item to update: ", result.Items)

    if(result.Count !== 0){
      logger.info('Todo id validated');

      const result = await this.docClient.update({
        TableName: this.todosTable,
        Key: {
          todoId: todoId
        },
        ExpressionAttributeNames:{
          '#todoName': 'name'
        },
        ExpressionAttributeValues:{
          ':name': updatedTodo.name,
          ':dueDate': updatedTodo.dueDate,
          ':done': updatedTodo.done
        },
        UpdateExpression: 'SET #todoName = :name, dueDate = :dueDate, done = :done',
        ReturnValues: 'UPDATED_NEW'
      }).promise();
    
      logger.info('Todo Item updated: ', result);
      const attributes = result.Attributes

      if (attributes != null) {
        logger.info('Todo item has been updated: ', {updatedTodo: attributes})
        return attributes as TodoItem
      } else {
        logger.warn('Error in update todo Item.')
        return undefined
      }
    }
  }

  async deleteTodo(todoId: string) {
    logger.info('Deleting todo item: ' + todoId)

    try{
      await this.docClient.delete({
        TableName: this.todosTable,
        Key: {
          todoId: todoId
        }
      }).promise()
    }catch(e){
      logger.info('Could not delete item: ', {error: e.message})
    }
  }

  async getUploadURL(imageId: string): Promise<string>{
    return s3.getSignedUrl('putObject', {
      Bucket: bucketName,
      Key: imageId,
      Expires: parseInt(urlExpiration)
    })
  }

  async updateUploadURL(todoId: string): Promise<TodoItem>{
    const attachmentUrl = `https://${bucketName}.s3.amazonaws.com/${todoId}`
    logger.info('Attachment URL created: ', attachmentUrl);

    logger.info('Updating todo attachment URL')
    const result = await this.docClient.update({
      TableName: this.todosTable,
      Key: {
        todoId: todoId
      },
      ExpressionAttributeValues: {
        ':attachmentUrl': attachmentUrl
      },
      UpdateExpression: 'SET attachmentUrl = :attachmentUrl',
      ReturnValues: 'UPDATED_NEW'
    }).promise()

    logger.info('URL attached: ', result.Attributes);

    return result.Attributes as TodoItem;
  }
}

function createDynamoDBClient() {
  if (process.env.IS_OFFLINE) {
    console.log('Creating a local DynamoDB instance')
    return new AWS.DynamoDB.DocumentClient({
      region: 'localhost',
      endpoint: 'http://localhost:8000'
    })
  }

  return new AWS.DynamoDB.DocumentClient()
}
