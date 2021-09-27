import * as AWS  from 'aws-sdk'
// import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest';
import { TodoItem } from '../models/TodoItem'
import { createLogger } from '../utils/logger';

// const XAWS = AWSXRay.captureAWS(AWS)

const logger = createLogger('itemAccess')

export class ItemAccess {

  constructor(
    private readonly docClient: DocumentClient = createDynamoDBClient(),
    private readonly todosTable = process.env.TODOS_TABLE) {
  }

  async getAllTodos(): Promise<TodoItem[]> {
    console.log('Getting all todos')

    const result = await this.docClient.scan({
      TableName: this.todosTable
    }).promise()

    const items = result.Items
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
