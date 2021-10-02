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
    done: false,
    createdAt: new Date().toISOString()
  })
}

export async function updateTodo(
  todoId: string,
  updatedTodo: UpdateTodoRequest,
  userId: string
): Promise<TodoItem>{
  logger.info('Calling updateTodo from data layer: ', updatedTodo)
  return itemAccess.updateTodo(todoId, updatedTodo, userId)
}

export async function deleteTodo(todoId: string, userId: string){
  logger.info('Calling deleteTodo from data layer with todoId: ', todoId);
  return itemAccess.deleteTodo(todoId, userId);
}

export async function createAttachmentPresignedUrl(todoId: string): Promise<string> {
  logger.info('Getting upload URL from data layer')
  const url = await itemAccess.getUploadURL(todoId);

  logger.info('Upload URL generated: ', {Url: url});

  return url.split('?')[0];
}

export async function updateUploadURL(todoId: string, userId: string): Promise<TodoItem> {
  logger.info('Uploading image to S3')
  return await itemAccess.updateUploadURL(todoId, userId);
}


