import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException
} from '@nestjs/common'

import { paginate } from '@/common/pagination'

import {
  fromApiJobProfileStatus,
  fromApiOrganizationPositionStatus,
  toJobProfileDetailResponse,
  toJobProfileResponse,
  toOrganizationPositionResponse
} from './post.mapper'
import { PostRepository } from './post.repository'

import type {
  CreateJobProfileDto,
  FindJobProfilesQueryDto,
  LinkOrganizationPositionDto,
  UpdateJobProfileDto,
  UpdateOrganizationPositionDto
} from './dto'
import type {
  JobProfileDetailResponse,
  JobProfileResponse,
  JobProfilesPageResponse,
  OrganizationPositionResponse
} from './responses/post.response'

@Injectable()
export class PostService {
  constructor(@Inject(PostRepository) private readonly postRepo: PostRepository) {}

  async findAll(query: FindJobProfilesQueryDto): Promise<JobProfilesPageResponse> {
    const where = this.postRepo.buildProfileWhere({
      keyword: query.keyword,
      status: query.status ? fromApiJobProfileStatus(query.status) : undefined,
      level: query.level
    })

    const page = await paginate({
      page: query.page,
      pageSize: query.pageSize,
      count: () => this.postRepo.countProfiles(where),
      findMany: (pagination) => this.postRepo.findProfiles(where, pagination)
    })

    return {
      pagination: page.pagination,
      items: page.items.map(toJobProfileResponse)
    }
  }

  async findOne(id: string): Promise<JobProfileDetailResponse> {
    const profile = await this.postRepo.findProfileById(id)
    if (!profile) throw new NotFoundException('岗位不存在')
    return toJobProfileDetailResponse(profile)
  }

  async create(data: CreateJobProfileDto): Promise<JobProfileResponse> {
    if (await this.postRepo.findProfileByCode(data.code)) {
      throw new ConflictException('岗位编码已存在')
    }

    const created = await this.postRepo.createProfile({
      code: data.code,
      name: data.name,
      description: data.description,
      level: data.level,
      family: data.family,
      icon: data.icon,
      iconColor: data.iconColor,
      status: fromApiJobProfileStatus(data.status ?? 'active')
    })
    return toJobProfileResponse(created)
  }

  async update(id: string, data: UpdateJobProfileDto): Promise<JobProfileResponse> {
    const existing = await this.postRepo.findProfileWithCounts(id)
    if (!existing) throw new NotFoundException('岗位不存在')

    const updated = await this.postRepo.updateProfile(id, {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.level !== undefined ? { level: data.level } : {}),
      ...(data.family !== undefined ? { family: data.family } : {}),
      ...(data.icon !== undefined ? { icon: data.icon } : {}),
      ...(data.iconColor !== undefined ? { iconColor: data.iconColor } : {}),
      ...(data.status !== undefined ? { status: fromApiJobProfileStatus(data.status) } : {})
    })
    return toJobProfileResponse(updated)
  }

  async remove(id: string): Promise<void> {
    const existing = await this.postRepo.findProfileWithCounts(id)
    if (!existing) throw new NotFoundException('岗位不存在')

    if (existing._count.posts > 0) {
      throw new ConflictException('该岗位已关联组织编制，请先解除关联后再删除')
    }

    await this.postRepo.deleteProfile(id)
  }

  async listOrganizationPositions(organizationId: string): Promise<OrganizationPositionResponse[]> {
    return (await this.postRepo.listOrganizationPositions(organizationId)).map(
      toOrganizationPositionResponse
    )
  }

  async linkOrganizationPosition(
    organizationId: string,
    data: LinkOrganizationPositionDto
  ): Promise<OrganizationPositionResponse> {
    const profile = await this.postRepo.findActiveProfileById(data.jobProfileId)
    if (!profile) {
      throw new NotFoundException('岗位目录不存在或已停用')
    }

    const existing = await this.postRepo.findOrganizationPositionByProfile(
      organizationId,
      data.jobProfileId
    )
    if (existing) {
      throw new ConflictException('该组织已关联此岗位')
    }

    const created = await this.postRepo.createOrganizationPosition({
      organization: { connect: { id: organizationId } },
      jobProfile: { connect: { id: data.jobProfileId } },
      headcount: data.headcount,
      level: data.level,
      description: data.description
    })
    return toOrganizationPositionResponse(created)
  }

  async updateOrganizationPosition(
    organizationId: string,
    positionId: string,
    data: UpdateOrganizationPositionDto
  ): Promise<OrganizationPositionResponse> {
    const existing = await this.postRepo.findOrganizationPosition(organizationId, positionId)
    if (!existing) throw new NotFoundException('组织岗位编制不存在')

    if (data.headcount !== undefined && data.headcount < existing._count.users) {
      throw new BadRequestException('编制人数不能小于当前在岗人数')
    }

    const updated = await this.postRepo.updateOrganizationPosition(positionId, {
      ...(data.headcount !== undefined ? { headcount: data.headcount } : {}),
      ...(data.level !== undefined ? { level: data.level } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.status !== undefined
        ? { status: fromApiOrganizationPositionStatus(data.status) }
        : {})
    })
    return toOrganizationPositionResponse(updated)
  }

  async unlinkOrganizationPosition(organizationId: string, positionId: string): Promise<void> {
    const existing = await this.postRepo.findOrganizationPosition(organizationId, positionId)
    if (!existing) throw new NotFoundException('组织岗位编制不存在')

    const activeCount = await this.postRepo.countActiveAssignments(positionId)
    if (activeCount > 0) {
      throw new ConflictException('仍有在岗人员，无法解除岗位关联')
    }

    await this.postRepo.deleteOrganizationPosition(positionId)
  }
}
