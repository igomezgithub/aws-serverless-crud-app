import * as uuid from 'uuid'

import { TodoItem } from '../models/TodoItem'
import { ItemAccess } from '../dataLayer/itemsAccess'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
// import { parseUserId } from '../auth/utils'
import { createLogger } from '../utils/logger';

const itemAccess = new ItemAccess()

const logger = createLogger('todos')

export async function getAllTodos(userId: string): Promise<TodoItem[]> {
  return itemAccess.getAllTodos(userId)
}

export async function createTodo(
  createTodoRequest: CreateTodoRequest,
  userId: string
): Promise<TodoItem> {

  const itemId = uuid.v4()

  return await itemAccess.createTodo({
    todoId: itemId,
    userId: userId,
    name: createTodoRequest.name,
    dueDate: createTodoRequest.dueDate,
    done: true,
    createdAt: new Date().toISOString()
  })
}

export async function updateTodo(todoId: string, updatedTodo: UpdateTodoRequest): Promise<TodoItem>{
  logger.info('Calling updateTodo from data layer: ', updatedTodo)
  return itemAccess.updateTodo(todoId, updatedTodo)
}

export async function deleteTodo(todoId: string){
  logger.info('Calling deleteTodo from data layer with todoId: ', todoId);
  return itemAccess.deleteTodo(todoId);
}

export async function createAttachmentPresignedUrl(todoId: string): Promise<string> {
  logger.info('Getting upload URL from data layer')
  const url = await itemAccess.getUploadURL(todoId);

  logger.info('Upload URL generated: ', url);

  return url;
}

export async function updateUploadURL(todoId: string): Promise<TodoItem> {
  logger.info('Uploading image to S3')
  return await itemAccess.updateUploadURL(todoId);
}


