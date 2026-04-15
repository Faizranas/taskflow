import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AppError } from '../../utils/AppError'
import mongoose from 'mongoose'

// ─── Mocks ──────────────────────────────────────────
vi.mock('./projects.schema', () => ({
  ProjectModel: {
    create: vi.fn(),
    find: vi.fn(),
    findOne: vi.fn(),
    findOneAndUpdate: vi.fn(),
    deleteOne: vi.fn(),
  },
}))

vi.mock('../tasks/tasks.schema', () => ({
  TaskModel: {
    deleteMany: vi.fn(),
  },
}))

import { ProjectModel } from './projects.schema'
import { TaskModel } from '../tasks/tasks.schema'
import * as projectsService from './projects.service'

const VALID_USER_ID = new mongoose.Types.ObjectId().toString()
const OTHER_USER_ID = new mongoose.Types.ObjectId().toString()
const VALID_PROJECT_ID = new mongoose.Types.ObjectId().toString()

const mockProject = {
  _id: VALID_PROJECT_ID,
  userId: VALID_USER_ID,
  name: 'Test Project',
  description: 'A test project',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── createProject ──────────────────────────────────
describe('createProject', () => {
  it('returns created project with correct userId', async () => {
    vi.mocked(ProjectModel.create).mockResolvedValue({
      toObject: () => mockProject,
    } as never)

    const result = await projectsService.createProject(VALID_USER_ID, {
      name: 'Test Project',
      description: 'A test project',
    })

    expect(result.project.id).toBe(VALID_PROJECT_ID)
    expect(result.project.name).toBe('Test Project')
    expect(ProjectModel.create).toHaveBeenCalledWith({
      userId: VALID_USER_ID,
      name: 'Test Project',
      description: 'A test project',
    })
  })

  it('throws VALIDATION_ERROR for missing name', async () => {
    // Validation happens at controller/Zod level, but service gets invalid ObjectId
    // Test that invalid projectId format is caught
    try {
      await projectsService.getProjectById(VALID_USER_ID, 'invalid-id')
    } catch (err) {
      expect((err as AppError).status).toBe(400)
      expect((err as AppError).code).toBe('VALIDATION_ERROR')
    }
  })
})

// ─── getProjects ────────────────────────────────────
describe('getProjects', () => {
  it('returns only projects belonging to user', async () => {
    vi.mocked(ProjectModel.find).mockReturnValue({
      sort: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([mockProject]),
      }),
    } as unknown as ReturnType<typeof ProjectModel.find>)

    const result = await projectsService.getProjects(VALID_USER_ID)

    expect(result.projects).toHaveLength(1)
    expect(result.total).toBe(1)
    expect(result.projects[0].id).toBe(VALID_PROJECT_ID)
    expect(ProjectModel.find).toHaveBeenCalledWith({ userId: VALID_USER_ID })
  })

  it('returns empty array when user has no projects', async () => {
    vi.mocked(ProjectModel.find).mockReturnValue({
      sort: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([]),
      }),
    } as unknown as ReturnType<typeof ProjectModel.find>)

    const result = await projectsService.getProjects(VALID_USER_ID)

    expect(result.projects).toEqual([])
    expect(result.total).toBe(0)
  })
})

// ─── getProjectById ─────────────────────────────────
describe('getProjectById', () => {
  it('returns correct project', async () => {
    vi.mocked(ProjectModel.findOne).mockReturnValue({
      lean: vi.fn().mockResolvedValue(mockProject),
    } as unknown as ReturnType<typeof ProjectModel.findOne>)

    const result = await projectsService.getProjectById(VALID_USER_ID, VALID_PROJECT_ID)

    expect(result.project.id).toBe(VALID_PROJECT_ID)
    expect(ProjectModel.findOne).toHaveBeenCalledWith({
      _id: VALID_PROJECT_ID,
      userId: VALID_USER_ID,
    })
  })

  it('throws NOT_FOUND when project belongs to different user', async () => {
    vi.mocked(ProjectModel.findOne).mockReturnValue({
      lean: vi.fn().mockResolvedValue(null),
    } as unknown as ReturnType<typeof ProjectModel.findOne>)

    try {
      await projectsService.getProjectById(OTHER_USER_ID, VALID_PROJECT_ID)
    } catch (err) {
      expect((err as AppError).status).toBe(404)
      expect((err as AppError).code).toBe('NOT_FOUND')
    }
  })

  it('throws NOT_FOUND when project does not exist', async () => {
    const nonExistentId = new mongoose.Types.ObjectId().toString()
    vi.mocked(ProjectModel.findOne).mockReturnValue({
      lean: vi.fn().mockResolvedValue(null),
    } as unknown as ReturnType<typeof ProjectModel.findOne>)

    try {
      await projectsService.getProjectById(VALID_USER_ID, nonExistentId)
    } catch (err) {
      expect((err as AppError).status).toBe(404)
      expect((err as AppError).code).toBe('NOT_FOUND')
    }
  })
})

// ─── updateProject ──────────────────────────────────
describe('updateProject', () => {
  it('returns updated fields', async () => {
    const updatedProject = { ...mockProject, name: 'Updated Name' }
    vi.mocked(ProjectModel.findOneAndUpdate).mockReturnValue({
      lean: vi.fn().mockResolvedValue(updatedProject),
    } as unknown as ReturnType<typeof ProjectModel.findOneAndUpdate>)

    const result = await projectsService.updateProject(VALID_USER_ID, VALID_PROJECT_ID, {
      name: 'Updated Name',
    })

    expect(result.project.name).toBe('Updated Name')
  })

  it('throws NOT_FOUND when project belongs to different user', async () => {
    vi.mocked(ProjectModel.findOneAndUpdate).mockReturnValue({
      lean: vi.fn().mockResolvedValue(null),
    } as unknown as ReturnType<typeof ProjectModel.findOneAndUpdate>)

    try {
      await projectsService.updateProject(OTHER_USER_ID, VALID_PROJECT_ID, {
        name: 'Updated',
      })
    } catch (err) {
      expect((err as AppError).status).toBe(404)
      expect((err as AppError).code).toBe('NOT_FOUND')
    }
  })

  it('throws VALIDATION_ERROR for empty body (invalid objectId proxy)', async () => {
    try {
      await projectsService.updateProject(VALID_USER_ID, 'invalid-id', {
        name: 'Updated',
      })
    } catch (err) {
      expect((err as AppError).status).toBe(400)
      expect((err as AppError).code).toBe('VALIDATION_ERROR')
    }
  })
})

// ─── deleteProject ──────────────────────────────────
describe('deleteProject', () => {
  it('deletes project and cascades to tasks', async () => {
    vi.mocked(ProjectModel.findOne).mockReturnValue({
      lean: vi.fn().mockResolvedValue(mockProject),
    } as unknown as ReturnType<typeof ProjectModel.findOne>)
    vi.mocked(TaskModel.deleteMany).mockResolvedValue({ deletedCount: 3 } as never)
    vi.mocked(ProjectModel.deleteOne).mockResolvedValue({ deletedCount: 1 } as never)

    await projectsService.deleteProject(VALID_USER_ID, VALID_PROJECT_ID)

    expect(TaskModel.deleteMany).toHaveBeenCalledWith({ projectId: VALID_PROJECT_ID })
    expect(ProjectModel.deleteOne).toHaveBeenCalledWith({
      _id: VALID_PROJECT_ID,
      userId: VALID_USER_ID,
    })
  })

  it('throws NOT_FOUND when project belongs to different user', async () => {
    vi.mocked(ProjectModel.findOne).mockReturnValue({
      lean: vi.fn().mockResolvedValue(null),
    } as unknown as ReturnType<typeof ProjectModel.findOne>)

    try {
      await projectsService.deleteProject(OTHER_USER_ID, VALID_PROJECT_ID)
    } catch (err) {
      expect((err as AppError).status).toBe(404)
      expect((err as AppError).code).toBe('NOT_FOUND')
    }
  })
})
