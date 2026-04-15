import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AppError } from '../../utils/AppError'
import mongoose from 'mongoose'

// ─── Mocks ──────────────────────────────────────────
vi.mock('./tasks.schema', () => ({
  TaskModel: {
    create: vi.fn(),
    find: vi.fn(),
    findOne: vi.fn(),
    findOneAndUpdate: vi.fn(),
    deleteOne: vi.fn(),
  },
}))

vi.mock('../projects/projects.schema', () => ({
  ProjectModel: {
    findOne: vi.fn(),
  },
}))

vi.mock('../tags/tags.schema', () => ({
  TagModel: {
    find: vi.fn(),
  },
}))

import { TaskModel } from './tasks.schema'
import { ProjectModel } from '../projects/projects.schema'
import { TagModel } from '../tags/tags.schema'
import * as tasksService from './tasks.service'

const USER_ID = new mongoose.Types.ObjectId().toString()
const OTHER_USER_ID = new mongoose.Types.ObjectId().toString()
const PROJECT_ID = new mongoose.Types.ObjectId().toString()
const TASK_ID = new mongoose.Types.ObjectId().toString()
const TAG_ID = new mongoose.Types.ObjectId().toString()

const mockPopulatedTag = { _id: TAG_ID, name: 'Bug', color: '#FF5733' }

const mockTask = {
  _id: TASK_ID,
  userId: USER_ID,
  projectId: PROJECT_ID,
  title: 'Fix login bug',
  description: 'A task',
  status: 'TODO',
  priority: 'HIGH',
  dueDate: new Date('2030-12-31'),
  tags: [mockPopulatedTag],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

const mockProject = {
  _id: PROJECT_ID,
  userId: USER_ID,
  name: 'Test Project',
}

const setupProjectFound = (): void => {
  vi.mocked(ProjectModel.findOne).mockReturnValue({
    lean: vi.fn().mockResolvedValue(mockProject),
  } as unknown as ReturnType<typeof ProjectModel.findOne>)
}

const setupProjectNotFound = (): void => {
  vi.mocked(ProjectModel.findOne).mockReturnValue({
    lean: vi.fn().mockResolvedValue(null),
  } as unknown as ReturnType<typeof ProjectModel.findOne>)
}

const chainedQuery = (result: unknown) => ({
  populate: vi.fn().mockReturnValue({
    lean: vi.fn().mockResolvedValue(result),
  }),
})

const chainedQueryWithSort = (result: unknown) => ({
  sort: vi.fn().mockReturnValue({
    populate: vi.fn().mockReturnValue({
      lean: vi.fn().mockResolvedValue(result),
    }),
  }),
})

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── createTask ─────────────────────────────────────
describe('createTask', () => {
  it('returns task with populated tags', async () => {
    setupProjectFound()
    vi.mocked(TagModel.find).mockReturnValue({
      lean: vi.fn().mockResolvedValue([{ _id: TAG_ID, userId: USER_ID }]),
    } as unknown as ReturnType<typeof TagModel.find>)
    vi.mocked(TaskModel.create).mockResolvedValue({ _id: TASK_ID } as never)
    vi.mocked(TaskModel.findOne).mockReturnValue(
      chainedQuery(mockTask) as unknown as ReturnType<typeof TaskModel.findOne>
    )

    const result = await tasksService.createTask(USER_ID, PROJECT_ID, {
      title: 'Fix login bug',
      priority: 'HIGH',
      dueDate: '2030-12-31T00:00:00.000Z',
      tags: [TAG_ID],
    })

    expect(result.task.id).toBe(TASK_ID)
    expect(result.task.tags[0].id).toBe(TAG_ID)
    expect(result.task.tags[0].name).toBe('Bug')
  })

  it('throws NOT_FOUND when project not found', async () => {
    setupProjectNotFound()

    try {
      await tasksService.createTask(USER_ID, PROJECT_ID, { title: 'Test' })
      expect.fail('Should have thrown')
    } catch (err) {
      expect((err as AppError).status).toBe(404)
      expect((err as AppError).code).toBe('NOT_FOUND')
    }
  })

  it('throws NOT_FOUND for invalid tag ID', async () => {
    setupProjectFound()
    vi.mocked(TagModel.find).mockReturnValue({
      lean: vi.fn().mockResolvedValue([]),
    } as unknown as ReturnType<typeof TagModel.find>)

    try {
      await tasksService.createTask(USER_ID, PROJECT_ID, {
        title: 'Test',
        tags: [TAG_ID],
      })
      expect.fail('Should have thrown')
    } catch (err) {
      expect((err as AppError).status).toBe(404)
      expect((err as AppError).code).toBe('NOT_FOUND')
    }
  })

  it('throws VALIDATION_ERROR for invalid projectId format', async () => {
    try {
      await tasksService.createTask(USER_ID, 'invalid-id', { title: 'Test' })
      expect.fail('Should have thrown')
    } catch (err) {
      expect((err as AppError).status).toBe(400)
      expect((err as AppError).code).toBe('VALIDATION_ERROR')
    }
  })
})

// ─── getTasks ───────────────────────────────────────
describe('getTasks', () => {
  it('returns all tasks for project', async () => {
    setupProjectFound()
    vi.mocked(TaskModel.find).mockReturnValue(
      chainedQueryWithSort([mockTask]) as unknown as ReturnType<typeof TaskModel.find>
    )

    const result = await tasksService.getTasks(USER_ID, PROJECT_ID, {})

    expect(result.tasks).toHaveLength(1)
    expect(result.total).toBe(1)
    expect(TaskModel.find).toHaveBeenCalledWith(
      expect.objectContaining({ projectId: PROJECT_ID, userId: USER_ID })
    )
  })

  it('filters by status', async () => {
    setupProjectFound()
    vi.mocked(TaskModel.find).mockReturnValue(
      chainedQueryWithSort([mockTask]) as unknown as ReturnType<typeof TaskModel.find>
    )

    await tasksService.getTasks(USER_ID, PROJECT_ID, { status: 'TODO' })

    expect(TaskModel.find).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'TODO' })
    )
  })

  it('filters by priority', async () => {
    setupProjectFound()
    vi.mocked(TaskModel.find).mockReturnValue(
      chainedQueryWithSort([mockTask]) as unknown as ReturnType<typeof TaskModel.find>
    )

    await tasksService.getTasks(USER_ID, PROJECT_ID, { priority: 'HIGH' })

    expect(TaskModel.find).toHaveBeenCalledWith(
      expect.objectContaining({ priority: 'HIGH' })
    )
  })

  it('filters by tag', async () => {
    setupProjectFound()
    vi.mocked(TaskModel.find).mockReturnValue(
      chainedQueryWithSort([mockTask]) as unknown as ReturnType<typeof TaskModel.find>
    )

    await tasksService.getTasks(USER_ID, PROJECT_ID, { tag: TAG_ID })

    expect(TaskModel.find).toHaveBeenCalledWith(
      expect.objectContaining({ tags: TAG_ID })
    )
  })

  it('filters by dueBefore', async () => {
    setupProjectFound()
    vi.mocked(TaskModel.find).mockReturnValue(
      chainedQueryWithSort([mockTask]) as unknown as ReturnType<typeof TaskModel.find>
    )

    await tasksService.getTasks(USER_ID, PROJECT_ID, {
      dueBefore: '2030-12-31T00:00:00.000Z',
    })

    expect(TaskModel.find).toHaveBeenCalledWith(
      expect.objectContaining({
        dueDate: expect.objectContaining({ $lte: expect.any(Date) }),
      })
    )
  })

  it('throws NOT_FOUND when project not owned', async () => {
    setupProjectNotFound()

    try {
      await tasksService.getTasks(OTHER_USER_ID, PROJECT_ID, {})
      expect.fail('Should have thrown')
    } catch (err) {
      expect((err as AppError).status).toBe(404)
      expect((err as AppError).code).toBe('NOT_FOUND')
    }
  })
})

// ─── getTaskById ────────────────────────────────────
describe('getTaskById', () => {
  it('returns task with populated tags', async () => {
    vi.mocked(TaskModel.findOne).mockReturnValue(
      chainedQuery(mockTask) as unknown as ReturnType<typeof TaskModel.findOne>
    )

    const result = await tasksService.getTaskById(USER_ID, PROJECT_ID, TASK_ID)

    expect(result.task.id).toBe(TASK_ID)
    expect(result.task.tags[0].name).toBe('Bug')
  })

  it('throws NOT_FOUND for wrong project', async () => {
    vi.mocked(TaskModel.findOne).mockReturnValue(
      chainedQuery(null) as unknown as ReturnType<typeof TaskModel.findOne>
    )

    const wrongProjectId = new mongoose.Types.ObjectId().toString()
    try {
      await tasksService.getTaskById(USER_ID, wrongProjectId, TASK_ID)
      expect.fail('Should have thrown')
    } catch (err) {
      expect((err as AppError).status).toBe(404)
      expect((err as AppError).code).toBe('NOT_FOUND')
    }
  })
})

// ─── updateTask ─────────────────────────────────────
describe('updateTask', () => {
  it('returns updated task', async () => {
    const updatedTask = { ...mockTask, title: 'Updated title' }
    vi.mocked(TaskModel.findOneAndUpdate).mockReturnValue(
      chainedQuery(updatedTask) as unknown as ReturnType<typeof TaskModel.findOneAndUpdate>
    )

    const result = await tasksService.updateTask(USER_ID, PROJECT_ID, TASK_ID, {
      title: 'Updated title',
    })

    expect(result.task.title).toBe('Updated title')
  })

  it('clears dueDate when set to null', async () => {
    const updatedTask = { ...mockTask, dueDate: null }
    vi.mocked(TaskModel.findOneAndUpdate).mockReturnValue(
      chainedQuery(updatedTask) as unknown as ReturnType<typeof TaskModel.findOneAndUpdate>
    )

    const result = await tasksService.updateTask(USER_ID, PROJECT_ID, TASK_ID, {
      dueDate: null,
    })

    expect(result.task.dueDate).toBeNull()
    expect(TaskModel.findOneAndUpdate).toHaveBeenCalledWith(
      expect.anything(),
      { $set: expect.objectContaining({ dueDate: null }) },
      expect.anything()
    )
  })

  it('replaces tags array fully', async () => {
    const newTagId = new mongoose.Types.ObjectId().toString()
    const newTag = { _id: newTagId, name: 'Feature', color: '#00FF00' }
    const updatedTask = { ...mockTask, tags: [newTag] }

    vi.mocked(TagModel.find).mockReturnValue({
      lean: vi.fn().mockResolvedValue([{ _id: newTagId, userId: USER_ID }]),
    } as unknown as ReturnType<typeof TagModel.find>)
    vi.mocked(TaskModel.findOneAndUpdate).mockReturnValue(
      chainedQuery(updatedTask) as unknown as ReturnType<typeof TaskModel.findOneAndUpdate>
    )

    const result = await tasksService.updateTask(USER_ID, PROJECT_ID, TASK_ID, {
      tags: [newTagId],
    })

    expect(result.task.tags).toHaveLength(1)
    expect(result.task.tags[0].id).toBe(newTagId)
  })

  it('throws NOT_FOUND when task not found', async () => {
    vi.mocked(TaskModel.findOneAndUpdate).mockReturnValue(
      chainedQuery(null) as unknown as ReturnType<typeof TaskModel.findOneAndUpdate>
    )

    try {
      await tasksService.updateTask(USER_ID, PROJECT_ID, TASK_ID, {
        title: 'X',
      })
      expect.fail('Should have thrown')
    } catch (err) {
      expect((err as AppError).status).toBe(404)
      expect((err as AppError).code).toBe('NOT_FOUND')
    }
  })
})

// ─── deleteTask ─────────────────────────────────────
describe('deleteTask', () => {
  it('task removed from DB', async () => {
    vi.mocked(TaskModel.findOne).mockReturnValue({
      lean: vi.fn().mockResolvedValue(mockTask),
    } as unknown as ReturnType<typeof TaskModel.findOne>)
    vi.mocked(TaskModel.deleteOne).mockResolvedValue({ deletedCount: 1 } as never)

    await tasksService.deleteTask(USER_ID, PROJECT_ID, TASK_ID)

    expect(TaskModel.deleteOne).toHaveBeenCalledWith({
      _id: TASK_ID,
      projectId: PROJECT_ID,
      userId: USER_ID,
    })
  })

  it('throws NOT_FOUND for wrong user', async () => {
    vi.mocked(TaskModel.findOne).mockReturnValue({
      lean: vi.fn().mockResolvedValue(null),
    } as unknown as ReturnType<typeof TaskModel.findOne>)

    try {
      await tasksService.deleteTask(OTHER_USER_ID, PROJECT_ID, TASK_ID)
      expect.fail('Should have thrown')
    } catch (err) {
      expect((err as AppError).status).toBe(404)
      expect((err as AppError).code).toBe('NOT_FOUND')
    }
  })
})
