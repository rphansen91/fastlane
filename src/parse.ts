import { z } from 'zod'
import { StatusError } from './errors'

export function parseEvent (body: unknown) {
  const event = eventSchema.safeParse(body)

  if (!event.success) throw new StatusError('BadRequest')

  const data = event.data.message.data

  const content = Buffer.from(data, 'base64').toString('utf8')

  return content
}

export function formatEvent (body: unknown) {
  const content = JSON.stringify(body)

  const data = Buffer.from(content).toString('base64')

  return {
    message: {
      data
    }
  }
}

export function parseEventJson (body: unknown) {
  const content = parseEvent(body)

  try {
    return JSON.parse(content)
  } catch (err) {
    throw new StatusError('BadRequest')
  }
}

const eventSchema = z.object({
  message: z.object({
    data: z.string()
  })
})